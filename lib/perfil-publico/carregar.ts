// Carrega o perfil público por slug (F4/S7, capacidade E5), no servidor.
//
// ⚠️ A CONTA QUE NÃO ESTÁ `active` NÃO EXISTE AQUI, E QUEM GARANTE É O BANCO.
// A leitura sai pelo cliente anônimo (`lib/supabase/publico.ts`): a única
// policy que vale é `*_select_publico` = `perfil_esta_ativo(id, role)`. Conta
// em `pending_validation`, `incomplete` ou `suspended`, e linha de
// `vet_profiles` cujo dono não é `vet`, voltam como "nenhuma linha", que é
// exatamente o mesmo que slug inexistente: `nao_encontrado`, 404. Nem o dono
// logado vê a própria página antes da aprovação por aqui (a prévia dele é
// outra leitura, na S7, lendo a linha do dono no painel).
//
// ⚠️ ANTES DA 0005 todo slug é nulo (R-065), então toda página devolve 404.
// Não é erro: não existe endereço público ainda. Nada aqui lê coluna da 0005.
//
// `cache` do React: `generateMetadata` e a página chamam a mesma função na
// mesma requisição, e o banco é consultado uma vez só.
import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/publico";
import { classificarErro, registrarFalha } from "@/lib/publico/disponibilidade";
import { rotuloDaExperiencia, rotuloDoTitulo } from "@/lib/publico/rotulos";
import type {
  ConteudoDoEstabelecimento,
  ConteudoDoVeterinario,
  PerfilCarregado,
  PerfilDeEstabelecimento,
  PerfilDeVeterinario,
} from "./tipos";

/** O mesmo formato do CHECK `*_slug_formato` da 0005 (DL-067). */
function slugValido(slug: string): boolean {
  return slug.length <= 120 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// SÓ estas colunas. Coluna nova aqui é decisão de exposição (matriz §3).
// Exportadas para a prévia do dono (`previa.ts`): a prévia lê exatamente as
// mesmas colunas, para não mostrar ao dono algo que o responsável não vê.
export const COLUNAS_VET =
  "slug, nome_exibicao, titulo, crmv, crmv_uf, experiencia, bio, especialidades, cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao";
export const COLUNAS_ESTAB = "slug, nome_fantasia, sobre, servicos, cidade, estado, site";

export type LinhaVet = {
  /** Nulo na linha do dono até a aprovação; na leitura anônima, sempre preenchido. */
  slug: string | null;
  nome_exibicao: string | null;
  titulo: string | null;
  crmv: string | null;
  crmv_uf: string | null;
  experiencia: string | null;
  bio: string | null;
  especialidades: string[] | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  atende_presencial: boolean;
  atende_domiciliar: boolean;
  atende_teleorientacao: boolean;
};

export type LinhaEstab = {
  slug: string | null;
  nome_fantasia: string | null;
  sobre: string | null;
  servicos: string[] | null;
  cidade: string | null;
  estado: string | null;
  site: string | null;
};

export const carregarPerfilDeVeterinario = cache(
  async (slug: string): Promise<PerfilCarregado<PerfilDeVeterinario>> => {
    if (!slugValido(slug)) return { estado: "nao_encontrado" };
    try {
      const supabase = await createPublicClient();
      const { data, error } = await supabase
        .from("vet_profiles")
        .select(COLUNAS_VET)
        .eq("slug", slug)
        .maybeSingle<LinhaVet>();
      if (error) throw error;
      if (!data) return { estado: "nao_encontrado" };

      // A RLS anônima só devolve conta `active`, e toda conta `active` tem
      // slug desde a 0005; a busca foi feita PELO slug, então ele existe.
      const endereco = data.slug ?? slug;
      return {
        estado: "ok",
        perfil: {
          ...conteudoDoVeterinario(data),
          slug: endereco,
          href: `/veterinario/${endereco}`,
          contato: { tipo: "vet", slug: endereco },
        },
      };
    } catch (erro) {
      const falha = classificarErro(erro);
      registrarFalha("perfil-publico/vet", falha, erro);
      return { estado: falha };
    }
  }
);

export const carregarPerfilDeEstabelecimento = cache(
  async (slug: string): Promise<PerfilCarregado<PerfilDeEstabelecimento>> => {
    if (!slugValido(slug)) return { estado: "nao_encontrado" };
    try {
      const supabase = await createPublicClient();
      const { data, error } = await supabase
        .from("clinic_profiles")
        .select(COLUNAS_ESTAB)
        .eq("slug", slug)
        .maybeSingle<LinhaEstab>();
      if (error) throw error;
      if (!data) return { estado: "nao_encontrado" };

      const endereco = data.slug ?? slug;
      return {
        estado: "ok",
        perfil: {
          ...conteudoDoEstabelecimento(data),
          slug: endereco,
          href: `/estabelecimento/${endereco}`,
          contato: { tipo: "clinic", slug: endereco },
        },
      };
    } catch (erro) {
      const falha = classificarErro(erro);
      registrarFalha("perfil-publico/estabelecimento", falha, erro);
      return { estado: falha };
    }
  }
);

/**
 * A linha do banco vira o que a tela desenha. UMA transformação, usada pela
 * página pública e pela prévia do dono: rótulo traduzido, CRMV só inteiro,
 * site só se for http/https. Se a prévia tivesse a sua própria, o dono veria
 * uma coisa e o responsável outra.
 */
export function conteudoDoVeterinario(data: LinhaVet): ConteudoDoVeterinario {
  return {
    tipo: "vet",
    nome: data.nome_exibicao,
    titulo: rotuloDoTitulo(data.titulo),
    crmv: data.crmv && data.crmv_uf ? { numero: data.crmv, uf: data.crmv_uf } : null,
    experiencia: rotuloDaExperiencia(data.experiencia),
    bio: data.bio,
    especialidades: data.especialidades ?? [],
    cidade: data.cidade,
    uf: data.estado,
    bairro: data.bairro,
    atendimento: {
      presencial: data.atende_presencial,
      domiciliar: data.atende_domiciliar,
      teleorientacao: data.atende_teleorientacao,
    },
  };
}

export function conteudoDoEstabelecimento(data: LinhaEstab): ConteudoDoEstabelecimento {
  return {
    tipo: "clinic",
    nome: data.nome_fantasia,
    sobre: data.sobre,
    servicos: data.servicos ?? [],
    cidade: data.cidade,
    uf: data.estado,
    site: siteSeguro(data.site),
  };
}

/**
 * O plano (S7) só deixa `site` virar link depois da T-027 (CHECK de esquema
 * no banco). Esta conferência vale com ou sem ela: esquema http/https, com
 * host, sem usuário e senha na URL.
 */
function siteSeguro(bruto: string | null): string | null {
  if (!bruto) return null;
  try {
    const url = new URL(bruto.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
