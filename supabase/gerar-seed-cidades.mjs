// Gera `supabase/seed-0005-cidades-ibge.sql` a partir da lista OFICIAL de
// municípios do IBGE (T-028). Sem dependência nova: Node 18+ puro.
//
// Uso (na raiz do repo):
//   node supabase/gerar-seed-cidades.mjs
//     baixa de https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado
//   node supabase/gerar-seed-cidades.mjs caminho/municipios.json
//     usa um JSON já baixado (mesmo formato "nivelado")
//
// O que o script garante ANTES de escrever o arquivo (se falhar, não escreve):
//   · 27 UFs, nenhuma a mais;
//   · código IBGE de 7 dígitos, único;
//   · nenhum nome que, normalizado pela MESMA regra de `public.chave_de_nome()`
//     da 0005, colida com outro da mesma UF (é o `unique (uf, chave)` da tabela);
//   · nenhum caractere que a normalização não saiba tratar (a regra do SQL e a
//     daqui têm que dar o mesmo resultado, letra por letra).
//
// ⚠️ Os dois mapas de acento abaixo são CÓPIA dos de `public.sem_acento()` na
// 0005. Mudou lá, muda aqui.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FONTE =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";
const DESTINO = join(dirname(fileURLToPath(import.meta.url)), "seed-0005-cidades-ibge.sql");

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

// Espelho de public.sem_acento() (0005 §2).
const DE = "ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ";
const PARA = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy";
if (DE.length !== PARA.length) throw new Error("mapas de acento com tamanhos diferentes");

function semAcento(s) {
  let r = "";
  for (const ch of s) {
    const i = DE.indexOf(ch);
    r += i >= 0 ? PARA[i] : ch;
  }
  // lower() do Postgres só é garantido em ASCII em qualquer collation: por
  // isso o acento sai ANTES, e aqui só sobra ASCII para baixar.
  return r.replace(/[A-Z]/g, (c) => c.toLowerCase());
}
const chaveDeNome = (s) => semAcento(s).replace(/[^a-z0-9]+/g, "");
const slugificar = (s) => semAcento(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function lerFonte() {
  const arquivo = process.argv[2];
  if (arquivo) return { texto: readFileSync(arquivo, "utf8"), origem: arquivo };
  const resp = await fetch(FONTE);
  if (!resp.ok) throw new Error(`IBGE respondeu HTTP ${resp.status}`);
  return { texto: await resp.text(), origem: FONTE };
}

const { texto, origem } = await lerFonte();
const sha256 = createHash("sha256").update(texto).digest("hex");
const brutos = JSON.parse(texto);

const municipios = brutos.map((m) => ({
  codigo: Number(m["municipio-id"]),
  nome: String(m["municipio-nome"]).trim(),
  uf: String(m["UF-sigla"]).trim(),
}));

// --- conferências -----------------------------------------------------------
const erros = [];
const codigos = new Set();
const porUfChave = new Map();
const slugs = new Set();
const contagem = Object.fromEntries(UFS.map((uf) => [uf, 0]));

for (const m of municipios) {
  if (!/^\d{7}$/.test(String(m.codigo))) erros.push(`código inválido: ${m.codigo}`);
  if (codigos.has(m.codigo)) erros.push(`código repetido: ${m.codigo}`);
  codigos.add(m.codigo);
  if (!UFS.includes(m.uf)) erros.push(`UF desconhecida: ${m.uf} (${m.nome})`);
  else contagem[m.uf] += 1;

  const normal = semAcento(m.nome);
  if (/[^a-z0-9 '\-.]/.test(normal)) {
    erros.push(`caractere que a normalização não trata: ${JSON.stringify(m.nome)} → ${JSON.stringify(normal)}`);
  }
  const chave = `${m.uf}|${chaveDeNome(m.nome)}`;
  if (porUfChave.has(chave)) erros.push(`colisão de chave na UF: ${m.nome} × ${porUfChave.get(chave)} (${m.uf})`);
  porUfChave.set(chave, m.nome);
  const slug = `${slugificar(m.nome)}-${m.uf.toLowerCase()}`;
  if (slugs.has(slug)) erros.push(`slug repetido: ${slug}`);
  slugs.add(slug);
}
for (const uf of UFS) if (contagem[uf] === 0) erros.push(`UF sem município: ${uf}`);

if (erros.length) {
  console.error(`NÃO GERADO. ${erros.length} problema(s):\n` + erros.join("\n"));
  process.exit(1);
}

// --- o arquivo -----------------------------------------------------------------
const q = (s) => `'${s.replace(/'/g, "''")}'`;
const hoje = new Date().toISOString().slice(0, 10);
const total = municipios.length;

const blocos = UFS.map((uf) => {
  const linhas = municipios
    .filter((m) => m.uf === uf)
    .sort((a, b) => a.codigo - b.codigo)
    .map((m) => `  (${m.codigo}, ${q(m.nome)}, '${uf}')`);
  return (
    `-- ${uf}: ${linhas.length} municípios\n` +
    `insert into public.cidades (codigo_ibge, nome, uf) values\n` +
    linhas.join(",\n") +
    `\non conflict (codigo_ibge) do update\n` +
    `  set nome = excluded.nome, uf = excluded.uf\n` +
    `  where (public.cidades.nome, public.cidades.uf) is distinct from (excluded.nome, excluded.uf);\n`
  );
});

const esperadoPorUf = UFS.map((uf) => `('${uf}', ${contagem[uf]})`).join(", ");

const sql = `-- ============================================================================
-- SEED DA 0005 — OS ${total} MUNICÍPIOS DO IBGE EM public.cidades (T-028)
--
-- ⚠️ ARQUIVO GERADO. NÃO EDITE À MÃO. Para gerar de novo:
--      node supabase/gerar-seed-cidades.mjs
--
-- Fonte:  ${origem}
-- Gerado: ${hoje} · ${total} municípios · 27 UFs
-- sha256 do JSON de origem: ${sha256}
--
-- COMO RODAR: DEPOIS da migration 0005 (é ela que cria a tabela). SQL Editor,
-- este arquivo inteiro, de uma vez. É uma transação só, e é idempotente: rodar
-- de novo não duplica nada (o código IBGE é a chave) e só atualiza o nome se o
-- IBGE tiver mudado. Se o editor recusar o tamanho, rode por partes: cada
-- bloco "-- UF" é independente; nesse caso rode o select do fim por último.
--
-- O resultado na tela é o select do fim: todas as linhas com ok = true.
-- ============================================================================

begin;

${blocos.join("\n")}
commit;

-- O RESULTADO (leitura pura, depois do commit). Todas as linhas: ok = true.
select 0 as ordem, 'total de municipios' as item,
       (select count(*) from public.cidades) = ${total} as ok,
       (select count(*) from public.cidades)::text || ' de ${total}' as leitura
union all
select 1, 'UFs com municipio', (select count(distinct uf) from public.cidades) = 27,
       (select count(distinct uf) from public.cidades)::text || ' de 27'
union all
select 2, 'municipios em ' || e.uf, coalesce(c.n, 0) = e.n,
       coalesce(c.n, 0)::text || ' de ' || e.n::text
from (values ${esperadoPorUf}) as e(uf, n)
left join (select uf, count(*) as n from public.cidades group by uf) c on c.uf = e.uf
order by 1, 2;
`;

writeFileSync(DESTINO, sql, "utf8");
console.log(`OK: ${total} municípios, 27 UFs, ${sql.length} caracteres → ${DESTINO}`);
console.log(`sha256 da fonte: ${sha256}`);
