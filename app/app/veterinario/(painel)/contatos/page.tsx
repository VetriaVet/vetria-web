import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { carregarContatosRecebidos } from "@/lib/contato/leitura";
import { ContatosRecebidosTela } from "@/components/app/Contatos";

export const metadata = { title: "Contatos recebidos" };

// T-042 · A contagem e a lista saem pela sessão do dono (policy
// `contatos_select_profissional`), com as colunas pedidas pelo nome (0006 §3).
export default async function VetContatosPage() {
  const { user } = await requirePainel("vet", SO_ATIVO);
  const dados = await carregarContatosRecebidos(user.id, "vet");
  return <ContatosRecebidosTela dados={dados} />;
}
