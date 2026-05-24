"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  role: string;
  admin_level: string | null;
  admin_team: string | null;
  onboarding_completed: boolean;
  created_at: string;
};

// TASK-021: refator SÓ visual (dark). Lógica de fetch + set-access PRESERVADA
// da Sprint 1 — chama /api/admin/profiles e /api/admin/set-access.
export default function AdminPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/profiles", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRows([]);
        setMsg(json.error ?? "Erro ao carregar");
      } else {
        setRows((json.data ?? []) as Row[]);
      }
    } catch (e: any) {
      setRows([]);
      setMsg(e?.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  async function callSetAccess(payload: any) {
    setMsg(null);

    try {
      const res = await fetch("/api/admin/set-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json.error ?? "Erro ao atualizar");
        return;
      }

      setMsg("Atualizado ✅");
      load();
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao atualizar");
    }
  }

  function promoteToAdmin(id: string) {
    return callSetAccess({
      target_user_id: id,
      new_role: "admin",
      new_admin_level: "admin",
      new_admin_team: "ops",
    });
  }

  function setMaster(id: string) {
    return callSetAccess({
      target_user_id: id,
      new_role: "admin",
      new_admin_level: "master",
      new_admin_team: "ops",
    });
  }

  function setTutor(id: string) {
    return callSetAccess({ target_user_id: id, new_role: "tutor" });
  }

  function setVet(id: string) {
    return callSetAccess({ target_user_id: id, new_role: "vet" });
  }

  function setClinic(id: string) {
    return callSetAccess({ target_user_id: id, new_role: "clinic" });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasError = !!msg && msg !== "Atualizado ✅";
  const showEmpty = !hasError && rows.length === 0 && !loading;

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] py-3 border-b border-white/[0.06]">
        <button
          onClick={load}
          disabled={loading}
          className="rounded-md border border-white/10 text-white/70 px-3 py-1.5 text-[12px] hover:bg-white/[0.06] hover:text-white transition disabled:opacity-50"
        >
          {loading ? "Carregando..." : "Recarregar"}
        </button>
        {msg && (
          <span
            className={`text-[12px] ${
              hasError ? "text-[#FF7A7A]" : "text-[#5DD9A2]"
            }`}
          >
            {msg}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-white/85">
          <thead>
            <tr>
              {["id", "role", "admin_level", "admin_team", "ações"].map((h) => (
                <th
                  key={h}
                  className="text-left px-[18px] py-2.5 text-[11px] uppercase tracking-[0.08em] text-white/50 font-semibold bg-black/15 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-[18px] py-3 align-top font-mono text-[11px] text-white/60">
                  {r.id}
                </td>
                <td className="px-[18px] py-3 align-top">{r.role}</td>
                <td className="px-[18px] py-3 align-top">{r.admin_level ?? "-"}</td>
                <td className="px-[18px] py-3 align-top">{r.admin_team ?? "-"}</td>
                <td className="px-[18px] py-3 align-top">
                  <div className="flex gap-2 flex-wrap">
                    <ActionBtn onClick={() => promoteToAdmin(r.id)}>virar admin</ActionBtn>
                    <ActionBtn onClick={() => setMaster(r.id)}>virar master</ActionBtn>
                    <ActionBtn onClick={() => setTutor(r.id)}>virar tutor</ActionBtn>
                    <ActionBtn onClick={() => setVet(r.id)}>virar vet</ActionBtn>
                    <ActionBtn onClick={() => setClinic(r.id)}>virar clinic</ActionBtn>
                  </div>
                </td>
              </tr>
            ))}

            {showEmpty && (
              <tr>
                <td className="px-[18px] py-4 text-white/50" colSpan={5}>
                  Nenhum profile encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {hasError && (
          <div className="m-[18px] rounded-md border border-[#FF7A7A]/40 bg-[#FF7A7A]/10 p-3 text-[13px] text-[#FF7A7A]">
            <b>Erro:</b> {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-white/10 text-white/70 px-2.5 py-1 text-[12px] hover:bg-white/[0.06] hover:text-white transition whitespace-nowrap"
    >
      {children}
    </button>
  );
}
