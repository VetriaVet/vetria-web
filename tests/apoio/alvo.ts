// O ALVO DA SUÍTE — e a trava que impede a suíte de escrever em produção.
//
// DL-064 (23/09/2026): a suíte E2E passa a rodar contra o projeto Supabase de
// TESTE (`vetria-e2e`), e só lá ela pode criar conta, subir documento,
// aprovar e reprovar. Tudo que escreve depende de DUAS coisas ao mesmo tempo:
//
//   1. uma variável EXPLÍCITA: `E2E_ALVO=teste`. Sem ela, todo teste que
//      escreve PULA, dizendo por quê (ou FALHA, com `E2E_EXIGIR_FILA=1`).
//   2. a URL do Supabase NÃO ser a de produção. Se `E2E_ALVO=teste` vier junto
//      com a URL de produção, isto não pula: ESTOURA. É engano de
//      configuração, e engano de configuração com `service_role` na mão é o
//      pior incidente que esta suíte consegue causar.
//
// ⚠️ O ref de produção está escrito aqui, e de propósito. Ele não é segredo
// (viaja no bundle do navegador, dentro de NEXT_PUBLIC_SUPABASE_URL) e o CI
// não tem `.env.local` para ler. Lido uma vez de `.env.local` em 23/09/2026,
// só o host. Se o projeto de produção mudar, mude aqui.
//
// ⚠️ A trava é conferida em TRÊS lugares, porque cada um pega um engano
// diferente:
//   · `exigirAlvoDeTeste()` confere o ambiente do PROCESSO DE TESTE (é o que
//     o cliente de serviço usa)
//   · a chave `service_role`, quando é JWT, diz de qual projeto ela é (`ref`)
//   · o COOKIE de sessão que o app escreve se chama `sb-<ref>-auth-token`, e é
//     o único jeito de saber para qual projeto o SERVIDOR NEXT está falando.
//     Local, o `next start` lê `.env.local` (produção) para toda variável que
//     o shell não definiu. Ver `conferirCookiesDoAlvo()`.

export const REF_PRODUCAO = "gdqnnrozbxrtaaquarnd";

export type AlvoDeTeste = {
  url: string;
  ref: string;
  anonKey: string;
  serviceKey: string;
};

function ler(nome: string): string | undefined {
  const v = process.env[nome];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** `true` só com `E2E_ALVO=teste`. Não confere nada: é a pergunta barata
 *  para o `test.skip` de nível de `describe`. Quem vai ESCREVER chama
 *  `exigirAlvoDeTeste()`, que confere tudo. */
export function alvoEhTeste(): boolean {
  return ler("E2E_ALVO") === "teste";
}

export const SEM_ALVO_DE_TESTE =
  "E2E_ALVO nao e 'teste': este teste cria conta, sobe documento ou decide validacao, e so roda no projeto Supabase de teste (vetria-e2e, DL-064). Contra producao ele nunca roda.";

/** O ref do projeto a partir da URL `https://<ref>.supabase.co`. */
export function refDaUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const achado = host.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return achado ? achado[1] : null;
  } catch {
    return null;
  }
}

/** O payload de um JWT sem conferir assinatura. Só serve para ler `ref` e
 *  `role` da chave antes de usá-la. Chave no formato novo (`sb_secret_...`)
 *  não é JWT e devolve `null`: aí a trava da URL é a que vale. */
function payloadDoJwt(chave: string): Record<string, unknown> | null {
  const partes = chave.split(".");
  if (partes.length !== 3) return null;
  try {
    const json = Buffer.from(partes[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

let conferido: AlvoDeTeste | null = null;

/**
 * Confere que o alvo é o projeto de TESTE e devolve a configuração. Estoura,
 * com o motivo escrito, em qualquer dúvida. NUNCA imprime chave.
 */
export function exigirAlvoDeTeste(): AlvoDeTeste {
  if (conferido) return conferido;

  if (!alvoEhTeste()) {
    throw new Error(`exigirAlvoDeTeste: ${SEM_ALVO_DE_TESTE}`);
  }

  const url = ler("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = ler("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = ler("SUPABASE_SERVICE_ROLE_KEY");

  const faltam = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (faltam.length > 0 || !url || !anonKey || !serviceKey) {
    throw new Error(
      `exigirAlvoDeTeste: E2E_ALVO=teste, mas faltam no ambiente: ${faltam.join(", ")}. ` +
        "Todas precisam ser as do projeto vetria-e2e (Project Settings > API). " +
        "Local, exporte no shell: o processo de teste NAO le .env.local, e o .env.local e o de producao."
    );
  }

  const ref = refDaUrl(url);
  if (!ref) {
    throw new Error(
      `exigirAlvoDeTeste: NEXT_PUBLIC_SUPABASE_URL nao tem o formato https://<ref>.supabase.co (host: ${safeHost(url)}).`
    );
  }

  if (ref === REF_PRODUCAO) {
    throw new Error(
      "exigirAlvoDeTeste: RECUSADO. E2E_ALVO=teste, mas NEXT_PUBLIC_SUPABASE_URL e a de PRODUCAO " +
        `(${REF_PRODUCAO}). Esta suite cria e apaga conta com service_role e nunca roda contra producao (DL-064). ` +
        "Troque os secrets/variaveis para os do projeto vetria-e2e."
    );
  }

  const esperado = ler("E2E_SUPABASE_REF_ESPERADO");
  if (esperado && esperado !== ref) {
    throw new Error(
      `exigirAlvoDeTeste: a URL aponta para o projeto ${ref}, e E2E_SUPABASE_REF_ESPERADO diz ${esperado}.`
    );
  }

  // A chave de serviço, quando é JWT, carrega o projeto dela. Chave de
  // produção com URL de teste daria 401 (sem estrago), mas o erro seria
  // críptico; aqui ele sai com nome.
  const carga = payloadDoJwt(serviceKey);
  if (carga) {
    if (carga.role !== "service_role") {
      throw new Error(
        `exigirAlvoDeTeste: SUPABASE_SERVICE_ROLE_KEY nao e uma chave service_role (role=${String(carga.role)}). ` +
          "Pegue a 'service_role' (secret) em Project Settings > API do vetria-e2e, nao a anon."
      );
    }
    if (carga.ref === REF_PRODUCAO) {
      throw new Error(
        "exigirAlvoDeTeste: RECUSADO. SUPABASE_SERVICE_ROLE_KEY e a chave de PRODUCAO. Ela nunca vai para o CI (DL-064)."
      );
    }
    if (typeof carga.ref === "string" && carga.ref !== ref) {
      throw new Error(
        `exigirAlvoDeTeste: SUPABASE_SERVICE_ROLE_KEY e do projeto ${carga.ref}, e a URL e do projeto ${ref}.`
      );
    }
  }

  conferido = { url, ref, anonKey, serviceKey };
  return conferido;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(url invalida)";
  }
}

/**
 * Confere, pelos cookies que o APP escreveu no login, para qual projeto o
 * servidor Next está falando. O `@supabase/ssr` nomeia o cookie
 * `sb-<ref>-auth-token` (às vezes com sufixo `.0`, `.1` quando é grande).
 *
 * Só age com `E2E_ALVO=teste`. Sem isso não há nada a conferir: o alvo é
 * produção e é o que o ambiente diz.
 */
export function conferirCookiesDoAlvo(nomes: string[]): void {
  if (!alvoEhTeste()) return;
  const { ref } = exigirAlvoDeTeste();

  const refs = new Set(
    nomes
      .map((n) => n.match(/^sb-([a-z0-9]{20})-auth-token/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => m[1])
  );

  if (refs.has(REF_PRODUCAO)) {
    throw new Error(
      "conferirCookiesDoAlvo: RECUSADO. O login escreveu cookie do projeto de PRODUCAO: o servidor Next esta " +
        "apontando para producao enquanto a suite acha que o alvo e o de teste. Local, isso acontece quando o " +
        "`next start` le o .env.local. Exporte NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e " +
        "SUPABASE_SERVICE_ROLE_KEY do vetria-e2e no shell e refaca o build."
    );
  }

  if (refs.size > 0 && !refs.has(ref)) {
    throw new Error(
      `conferirCookiesDoAlvo: o app escreveu cookie do projeto ${[...refs].join(", ")}, e o alvo da suite e ${ref}.`
    );
  }
}
