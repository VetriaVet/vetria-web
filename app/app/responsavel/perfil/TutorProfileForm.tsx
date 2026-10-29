"use client";

import { useState } from "react";
import { Input } from "../../../../components/ui/Input";
import { Label } from "../../../../components/ui/Label";
import { CampoMascarado } from "@/components/ui/CampoMascarado";

// Perfil do responsável, casca fiel (DL-020). Dados pessoais (email real, do
// login) e preferências como toggles locais. Cadastro de animais e lembretes
// de consulta saíram na T-054: estão fora do escopo da entrega de 25/11. "Salvar" e "Excluir conta" desabilitados até o backend (migration
// 029/031). Sem dado fictício.

export default function TutorProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [nome, setNome] = useState(initialName);
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [prefs, setPrefs] = useState({
    email: true,
    dicas: false,
  });

  function togglePref(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sobre você */}
      <Section title="Sobre você">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} disabled />
            <p className="text-[12px] text-corpo-texto/70 mt-1">
              É o email do seu login.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <CampoMascarado
              id="telefone"
              mascara="telefone"
              valor={telefone}
              onValor={setTelefone}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Palmas, TO"
            />
          </div>
        </div>
      </Section>

      {/* Preferências */}
      <Section title="Preferências de comunicação">
        <div className="flex flex-col">
          <ToggleRow
            on={prefs.email}
            onClick={() => togglePref("email")}
            title="Notificações por e-mail"
            desc="Avisos da sua conta e novidades da Vetria."
          />
          <ToggleRow
            on={prefs.dicas}
            onClick={() => togglePref("dicas")}
            title="Receber dicas educativas"
            desc="Conteúdo pra cuidar melhor dos seus animais."
            last
          />
        </div>
      </Section>

      {/* Zona de perigo */}
      <Section title="Zona de perigo" danger>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium text-sm text-titulo mb-0.5">
              Excluir minha conta
            </div>
            <div className="text-[13px] text-corpo-texto">
              Essa ação é permanente. Seu histórico será apagado.
            </div>
          </div>
          <button
            type="button"
            disabled
            className="shrink-0 rounded-pill border border-red-200 text-red-400 px-4 py-2 text-sm font-medium cursor-not-allowed"
          >
            {/* TODO: fluxo de exclusão de conta (backend) */}
            Excluir conta (em breve)
          </button>
        </div>
      </Section>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-fundo-claro px-5 py-4">
        <span className="text-[13px] text-corpo-texto">
          Pré-visualização. Salvar estará disponível em breve.
        </span>
        <button
          type="button"
          disabled
          className="shrink-0 inline-flex items-center gap-2 rounded-pill bg-principal/40 text-white px-6 py-2.5 font-semibold text-sm cursor-not-allowed"
        >
          {/* TODO: persistir dados do tutor (migration 029/031) */}
          Salvar (em breve)
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  danger,
  children,
}: {
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
      <h2
        className={`font-bold text-lg mb-5 ${
          danger ? "text-red-600" : "text-titulo"
        }`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleRow({
  on,
  onClick,
  title,
  desc,
  last,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <div className="min-w-0">
        <div className="font-medium text-sm text-titulo">{title}</div>
        <div className="text-[12px] text-corpo-texto">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onClick}
        className={`relative w-11 h-6 rounded-pill transition shrink-0 ${
          on ? "bg-principal" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
