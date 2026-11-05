"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarAnimal } from "./campos";
import { podeEscolherTipo } from "@/lib/auth/tipo";

// A conclusão do onboarding do responsável. Saiu de dentro de `page.tsx`
// (revisão de 04/11/2026) porque Server Action é endpoint público: o fato de
// a PÁGINA ter conferido `role === 'tutor'` antes de renderizar não protege
// a ACTION, que pode ser chamada direto, por qualquer conta logada, com o id
// dela. Então a action confere sessão e role por conta própria.
//
// T-065 / DL-080 item 3: O ANIMAL PASSA A SER GUARDADO, em `public.animais`
// (0002 §4.3), com a SESSÃO DO RESPONSÁVEL, sob a policy `animais_insert_own`
// (`tutor_id = auth.uid()`). Nunca `service_role`: quem decide que a linha é
// dele é o Postgres. Antes, o formulário perguntava e a Action descartava.
//
// A ORDEM, e por quê:
//   1. confere tudo o que chegou (lista fechada e teto de tamanho, `campos.ts`)
//   2. MARCA o onboarding como concluído com `.eq("onboarding_completed",
//      false)`: é a trava contra o clique duplo. Dois envios simultâneos não
//      gravam dois animais, porque só um deles consegue virar o false em true.
//   3. grava o animal. Se falhar, DESFAZ o passo 2 e devolve a frase: a pessoa
//      tenta de novo e nada fica pela metade.
//   4. a cidade vai para os dados do login, o mesmo lugar onde o cadastro do
//      responsável já a guarda (`app/cadastro/responsavel/page.tsx`). Falha
//      aqui não desfaz nada: o animal, que é o que a pessoa veio dizer, já
//      está gravado.
//
// ⚠️ DL-016: nenhum `redirect()` aqui dentro está em try/catch.
// ⚠️ Log sem `details` nem `hint` (SEC-056): só `code`. E nunca o nome do
//    animal nem a cidade.

export type ResultadoOnboarding = { erro: string };

const FALHA =
  "Não foi possível salvar agora. Seus dados não foram perdidos na tela: tente de novo em alguns instantes.";

export async function completeOnboarding(
  formData: FormData
): Promise<ResultadoOnboarding | void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null; onboarding_completed: boolean | null }>();

  if (erroPerfil) {
    console.error("[completeOnboarding] leitura do perfil falhou", { code: erroPerfil.code });
    return { erro: FALHA };
  }

  // Rota em português, role em inglês (DL-043): este onboarding é do `tutor`.
  if (perfil?.role !== "tutor") {
    redirect("/app");
  }

  // Já concluído (outra aba, ou o segundo clique): nada é gravado de novo.
  if (perfil.onboarding_completed) {
    redirect("/app/responsavel");
  }

  // SEC-145: conta que ainda pode escolher o tipo (T-064) escolhe ANTES de
  // concluir como responsável. Sem isto, chamar a Action direto concluía o
  // cadastro com `tipo_escolhido_em` nulo e deixava a escolha reabrível.
  if (await podeEscolherTipo(supabase, user.id)) {
    redirect("/onboarding");
  }

  // 1. ENTRADA
  const validacao = validarAnimal(formData);
  if (!validacao.ok) return { erro: validacao.mensagem };
  const { nome, especie, idade, peso, cidade } = validacao.dados;

  // 2. A TRAVA: só um envio vira o false em true.
  const { data: marcado, error: erroMarca } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id)
    .eq("role", "tutor")
    .eq("onboarding_completed", false)
    .select("id");

  if (erroMarca) {
    console.error("[completeOnboarding] update error", { code: erroMarca.code });
    return { erro: FALHA };
  }
  if (!marcado || marcado.length === 0) {
    // Outro envio chegou antes e já concluiu (ou já está concluindo). O
    // animal é dele; este não grava um segundo.
    redirect("/app/responsavel");
  }

  // 3. O ANIMAL, com a sessão do dono.
  const { error: erroAnimal } = await supabase
    .from("animais")
    .insert({ tutor_id: user.id, nome, especie, idade, peso });

  if (erroAnimal) {
    console.error("[completeOnboarding] gravar o animal falhou", { code: erroAnimal.code });
    const { error: erroDesfazer } = await supabase
      .from("profiles")
      .update({ onboarding_completed: false })
      .eq("id", user.id)
      .eq("role", "tutor");
    if (erroDesfazer) {
      console.error("[completeOnboarding] desfazer a conclusao falhou", {
        code: erroDesfazer.code,
        userId: user.id,
      });
    }
    return { erro: FALHA };
  }

  // 4. A CIDADE, nos dados do login (como no cadastro). Melhor esforço.
  const { error: erroCidade } = await supabase.auth.updateUser({ data: { cidade } });
  if (erroCidade) {
    console.error("[completeOnboarding] gravar a cidade falhou", {
      code: erroCidade.code ?? erroCidade.status ?? null,
    });
  }

  redirect("/app/responsavel");
}
