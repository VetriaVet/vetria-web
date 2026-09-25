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
  PerfilCarregado,
  PerfilDeEstabelecimento,
  PerfilDeVeterinario,
} from "./tipos";

/** O mesmo formato do CHECK `*_slug_formato` da 0005 (DL-067). */
function slugValido(slug: string): boolean {
  return slug.length <= 120 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// SÓ estas colunas. Coluna nova aqui é decisão de exposição (matriz §3).
const COLUNAS_VET =
  "slug, nome_exibicao, titulo, crmv, crmv_uf, experiencia, bio, especialidades, cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao";
const COLUNAS_ESTAB = "slug, nome_fantasia, sobre, servicos, cidade, estado, site";

type LinhaVet = {
  slug: string;
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

type LinhaEstab = {
  slug: string;
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

      return {
        estado: "ok",
        perfil: {
          tipo: "vet",
          slug: data.slug,
          href: `/veterinario/${data.slug}`,
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
          contato: { tipo: "vet", slug: data.slug },
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

      return {
        estado: "ok",
        perfil: {
          tipo: "clinic",
          slug: data.slug,
          href: `/estabelecimento/${data.slug}`,
          nome: data.nome_fantasia,
          sobre: data.sobre,
          servicos: data.servicos ?? [],
          cidade: data.cidade,
          uf: data.estado,
          site: siteSeguro(data.site),
          contato: { tipo: "clinic", slug: data.slug },
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
