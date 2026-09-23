// A normalização de texto da busca, do lado do Next.
//
// ⚠️ ESTE ARQUIVO É CÓPIA. A fonte é `public.sem_acento()` e
// `public.chave_de_nome()` da `0005` (§2). Existe outra cópia em
// `supabase/gerar-seed-cidades.mjs`. MUDOU LÁ, MUDA AQUI, no mesmo commit:
// se os mapas divergirem, "Goiânia" digitado deixa de achar o que o banco
// gravou, e ninguém recebe erro, só resultado vazio.
//
// Por que a cópia, e não uma ida ao banco (`rpc('sem_acento')`): a busca usa a
// regra para montar a consulta (o termo do full-text e o padrão da cidade),
// e uma ida a mais por busca, para uma função pura de 3 linhas, é custo sem
// ganho. O seed de cidades já confere, município por município, que a regra
// JS e a SQL dão o mesmo resultado.

const DE = "ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ";
const PARA = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy";

/** Espelho de `public.sem_acento()`: tira o acento do mapa e baixa o ASCII. */
export function semAcento(texto: string): string {
  let r = "";
  for (const ch of texto) {
    const i = DE.indexOf(ch);
    r += i >= 0 ? PARA[i] : ch;
  }
  return r.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

/** Espelho de `public.chave_de_nome()`: só `[a-z0-9]`. */
export function chaveDeNome(texto: string): string {
  return semAcento(texto).replace(/[^a-z0-9]+/g, "");
}

/**
 * O padrão (regex do Postgres, operador `~`) que casa um texto gravado cuja
 * `chave_de_nome()` é exatamente `chave`.
 *
 * POR QUE ISTO EXISTE: a `0005` casa cidade por `chave_de_nome(cidade)`, mas o
 * PostgREST não filtra por expressão, só por coluna. Sem função nova no banco
 * (migration), a forma de fazer o MESMO teste no Postgres é um regex que
 * aceita, para cada letra da chave, a letra em qualquer caixa e com qualquer
 * acento do mapa, e entre elas qualquer coisa que a `chave_de_nome` apaga
 * (espaço, hífen, apóstrofo, ponto). "goiania" casa "Goiânia", "goiania " e
 * "GOIÂNIA"; não casa "Goiana".
 *
 * O filtro roda no Postgres, com paginação e contagem no Postgres. O que ele
 * NÃO usa é o índice `idx_*_local` da expressão (usa o de `estado`, que é a
 * primeira coluna dele). Quando doer, a troca é uma função de busca no banco
 * (migration da S6), e esta função sai.
 *
 * Aceita só `[a-z0-9]`, que é o que `cidades.chave` pode conter; qualquer
 * outra coisa devolve `null` e quem chama não filtra por cidade nenhuma
 * (nunca monta regex com dado que não conferiu).
 */
export function padraoDaChave(chave: string): string | null {
  if (!/^[a-z0-9]{1,80}$/.test(chave)) return null;

  // Separador: tudo que não é letra ASCII, dígito nem letra latina acentuada
  // (U+00C0 a U+00FF). É um pouco MAIS ESTREITO que o da `chave_de_nome`
  // (que também apaga Æ, Ø, ß, × e vizinhos, que não estão no mapa): o erro
  // possível é deixar de achar uma cidade gravada com um desses símbolos, e
  // nunca achar cidade errada. Em troca a URL fica curta: com o mapa inteiro
  // aqui, o padrão de "Vila Bela da Santíssima Trindade" passaria de 8 KB
  // depois de codificado (estimativa, não medido), que é tamanho de URL que
  // proxy costuma recusar. Assim o pior caso fica em 1,9 KB (medido com URLSearchParams).
  const separador = "[^A-Za-z0-9À-ÿ]*";
  let padrao = "^" + separador;
  for (const ch of chave) {
    if (/[0-9]/.test(ch)) {
      padrao += ch;
    } else {
      const variantes = new Set<string>([ch, ch.toUpperCase()]);
      for (let i = 0; i < DE.length; i++) {
        if (PARA[i].toLowerCase() === ch) variantes.add(DE[i]);
      }
      padrao += "[" + [...variantes].join("") + "]";
    }
    padrao += separador;
  }
  return padrao + "$";
}
