// A PRÉVIA do perfil público, para o próprio profissional (F4/S7, E5).
//
// ⚠️ ESTA LEITURA É OUTRA, E DE PROPÓSITO. A página pública lê como `anon`
// (`carregar.ts`) e só enxerga conta `active`. O dono em `pending_validation`
// precisa ver a própria linha ANTES de estar no ar, então aqui a leitura sai
// com a SESSÃO dele (`lib/supabase/server.ts`) e vale a policy
// `*_select_own` (`id = auth.uid()`). Nunca `service_role`: quem decide que a
// linha é dele é o Postgres, e o `.eq("id", ...)` só escolhe qual linha pedir.
//
// Mesmas colunas e mesma transformação da página pública, importadas de
// `carregar.ts` e não copiadas: a prévia não pode mostrar ao dono um dado que o
// responsável não vê (nada de `perfil_privado`, CNPJ, razão social, endereço).
//
// O carregador anônimo continua intocado: esta função não serve a página
// pública, e a página pública não passa por aqui.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { modosLigados } from "@/components/publico/atendimento";
import {
  COLUNAS_ESTAB,
  COLUNAS_VET,
  conteudoDoEstabelecimento,
  conteudoDoVeterinario,
  type LinhaEstab,
  type LinhaVet,
} from "./carregar";
import type { ConteudoDoEstabelecimento, ConteudoDoVeterinario } from "./tipos";

export type PreviaCarregada<C> =
  | {
      estado: "ok";
      conteudo: C;
      /** Nulo até a aprovação. Com ele, a página pública existe. */
      slug: string | null;
      /** O que o responsável não vai encontrar no perfil, em palavras simples. */
      faltando: string[];
    }
  /** Não há linha de perfil para esta conta (cadastro não chegou ao fim). */
  | { estado: "sem_perfil" }
  | { estado: "erro" };

export async function carregarPreviaDoVeterinario(
  idDoDono: string
): Promise<PreviaCarregada<ConteudoDoVeterinario>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vet_profiles")
      .select(COLUNAS_VET)
      .eq("id", idDoDono)
      .maybeSingle<LinhaVet>();
    if (error) throw error;
    if (!data) return { estado: "sem_perfil" };

    const conteudo = conteudoDoVeterinario(data);
    const faltando: string[] = [];
    if (!conteudo.nome) faltando.push("o nome de exibição");
    if (!conteudo.cidade || !conteudo.uf) faltando.push("a cidade e o estado");
    if (conteudo.especialidades.length === 0) faltando.push("as especialidades");
    if (modosLigados(conteudo.atendimento).length === 0) faltando.push("as formas de atendimento");
    if (!conteudo.bio) faltando.push("a apresentação");

    return { estado: "ok", conteudo, slug: data.slug, faltando };
  } catch (erro) {
    console.error(`[previa/vet] erro (${(erro as { code?: string })?.code ?? "sem-codigo"})`);
    return { estado: "erro" };
  }
}

export async function carregarPreviaDoEstabelecimento(
  idDoDono: string
): Promise<PreviaCarregada<ConteudoDoEstabelecimento>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clinic_profiles")
      .select(COLUNAS_ESTAB)
      .eq("id", idDoDono)
      .maybeSingle<LinhaEstab>();
    if (error) throw error;
    if (!data) return { estado: "sem_perfil" };

    const conteudo = conteudoDoEstabelecimento(data);
    const faltando: string[] = [];
    if (!conteudo.nome) faltando.push("o nome fantasia");
    if (!conteudo.cidade || !conteudo.uf) faltando.push("a cidade e o estado");
    if (conteudo.servicos.length === 0) faltando.push("os serviços");
    if (!conteudo.sobre) faltando.push("a apresentação");

    return { estado: "ok", conteudo, slug: data.slug, faltando };
  } catch (erro) {
    console.error(`[previa/estabelecimento] erro (${(erro as { code?: string })?.code ?? "sem-codigo"})`);
    return { estado: "erro" };
  }
}
