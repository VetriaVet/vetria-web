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
    return callSetAccess({
      target_user_id: id,
      new_role: "tutor",
    });
  }

  function setVet(id: string) {
    return callSetAccess({
      target_user_id: id,
      new_role: "vet",
    });
  }

  function setClinic(id: string) {
    return callSetAccess({
      target_user_id: id,
      new_role: "clinic",
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasError = !!msg && msg !== "Atualizado ✅";
  const showEmpty = !hasError && rows.length === 0 && !loading;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: 10, borderRadius: 8, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Carregando..." : "Recarregar"}
        </button>

        {msg && <span>{msg}</span>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>id</th>
              <th style={th}>role</th>
              <th style={th}>admin_level</th>
              <th style={th}>admin_team</th>
              <th style={th}>ações</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{r.id}</td>
                <td style={td}>{r.role}</td>
                <td style={td}>{r.admin_level ?? "-"}</td>
                <td style={td}>{r.admin_team ?? "-"}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => promoteToAdmin(r.id)} style={btn}>
                      virar admin
                    </button>
                    <button onClick={() => setMaster(r.id)} style={btn}>
                      virar master
                    </button>
                    <button onClick={() => setTutor(r.id)} style={btn}>
                      virar tutor
                    </button>
                    <button onClick={() => setVet(r.id)} style={btn}>
                      virar vet
                    </button>
                    <button onClick={() => setClinic(r.id)} style={btn}>
                      virar clinic
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {showEmpty && (
              <tr>
                <td style={td} colSpan={5}>
                  Nenhum profile encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {hasError && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: "1px solid #f3c2c2",
              borderRadius: 10,
            }}
          >
            <b>Erro:</b> {msg}
          </div>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: 8,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  verticalAlign: "top",
};

const btn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
};
