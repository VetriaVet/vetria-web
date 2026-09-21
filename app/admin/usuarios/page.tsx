import { requireMaster } from "@/lib/auth/admin";
import AdminPanel from "../AdminPanel";

export const metadata = {
  title: "Usuários",
};

// Gestão de usuários — ferramenta funcional de RBAC (AdminPanel), só pra master.
//
// ⚠️ R-054 / SEC-078 (T-023) — A PÁGINA PASSOU A EXIGIR `admin_level = 'master'`
// NO SERVIDOR. Antes ela conferia só `role === 'admin'` e renderizava para
// admin comum, contra a última linha da matriz de rotas (§2), que dá ❌ a
// admin comum aqui e diz, por escrito, que ❌ significa "bloqueado no
// servidor". Ninguém vazava dado: o `<AdminPanel />` estava dentro de um ramo
// `isMaster` e o admin comum caía num `else` com um texto explicativo. O
// problema era onde a defesa morava: num `? :` de renderização. No dia em que
// um segundo bloco nascesse fora daquele ramo, o vazamento apareceria sem
// ninguém ter tocado em autorização, porque não havia autorização ali para
// tocar.
//
// O `else` sumiu junto, e sumiu por ter ficado inalcançável: depois do
// `requireMaster()`, quem chega nesta linha é master. Manter a caixa de
// "você é admin com acesso limitado" seria manter em tela um caminho que o
// servidor já não permite percorrer.
//
// A matriz não mudou e não muda aqui: ela só muda por decisão registrada em
// `docs/05-DECISOES.md`. Quando matriz e código divergem, o código é que está
// errado.

export default async function AdminUsuariosPage() {
  await requireMaster();

  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10">
        <h1 className="font-bold text-lg text-white">Usuários & permissões</h1>
      </header>

      <div className="p-6 max-w-[1280px] mx-auto">
        <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] overflow-hidden">
          <div className="px-[18px] py-3.5 border-b border-white/[0.06]">
            <div className="font-bold text-sm text-white">Todos os usuários</div>
            <div className="text-[12px] text-white/50">
              Gerencie role e nível de acesso dos usuários da plataforma.
            </div>
          </div>
          <AdminPanel />
        </div>
      </div>
    </div>
  );
}
