import { NextResponse, type NextRequest } from "next/server";
import { sugerirCidades } from "@/lib/busca/opcoes";
import { UFS } from "@/app/app/veterinario/onboarding/campos";

// GET /api/cidades?q=goian&uf=GO: o autocompletar de cidade da /buscar.
//
// Leitura de lista PÚBLICA (a tabela `cidades` do IBGE, 0005, DL-068), pelo
// cliente anônimo de `lib/busca/opcoes.ts`. Não há dado de pessoa nenhuma
// aqui, não há sessão, e a rota está fora do `matcher` do middleware de
// propósito: quem busca não tem conta.
//
// Os limites da rota (além dos de `sugerirCidades`, que corta a chave em 80 e
// ignora menos de 2 letras):
//   · `q` com mais de 60 caracteres é recusado com 400 antes de qualquer
//     consulta (nome de município mais longo do IBGE tem 32);
//   · `uf` fora da lista é ignorado, não repassado;
//   · no máximo 8 sugestões por pedido.
// Antes da 0005 a tabela não existe e a resposta é 503 com lista vazia: a
// tela continua funcionando como campo de texto simples.

const TERMO_MAXIMO = 60;
const SUGESTOES = 8;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const ufBruta = (request.nextUrl.searchParams.get("uf") ?? "").toUpperCase();
  const uf = (UFS as readonly string[]).includes(ufBruta) ? ufBruta : null;

  if (q.length > TERMO_MAXIMO) {
    return NextResponse.json({ cidades: [] }, { status: 400 });
  }

  const r = await sugerirCidades(q, uf, SUGESTOES);
  if (r.estado !== "ok") {
    return NextResponse.json(
      { cidades: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { cidades: r.cidades.map(({ nome, uf, slug }) => ({ nome, uf, slug })) },
    {
      // A lista do IBGE não muda de um dia para o outro: o navegador e a CDN
      // podem guardar a mesma resposta por uma hora.
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    }
  );
}
