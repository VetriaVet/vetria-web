"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

// Editor de perfil do vet — casca fiel ao produto (DL-020). O formulário tem
// estado client e alimenta um preview ao vivo, mas NÃO persiste ainda: não
// existe tabela vet_profiles (migration 029/031). Por isso "Salvar" fica
// desabilitado ("em breve"). Campos começam vazios (só o nome de exibição vem
// do user_metadata) — sem dado fictício.

const ESPECIALIDADES = [
  "Cardiologia",
  "Clínica geral",
  "Felinos",
  "Dermatologia",
  "Oftalmologia",
  "Ortopedia",
  "Cirurgia",
  "Anestesiologia",
  "Oncologia",
];

const EXPERIENCIA = [
  { value: "lt1", label: "Menos de 1 ano" },
  { value: "1a3", label: "1 a 3 anos" },
  { value: "3a5", label: "3 a 5 anos" },
  { value: "5a10", label: "5 a 10 anos" },
  { value: "gt10", label: "Mais de 10 anos" },
];

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
].map((uf) => ({ value: uf, label: uf }));

const BIO_MIN = 80;
const BIO_MAX = 500;

export default function VetProfileForm({ initialName }: { initialName: string }) {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState(initialName);
  const [experiencia, setExperiencia] = useState("");
  const [bio, setBio] = useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [bairro, setBairro] = useState("");
  const [modos, setModos] = useState({
    presencial: false,
    domiciliar: false,
    teleorientacao: false,
  });
  const [whatsapp, setWhatsapp] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailContato, setEmailContato] = useState("");

  function toggleEspecialidade(e: string) {
    setEspecialidades((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  }

  function toggleModo(key: keyof typeof modos) {
    setModos((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const principal = especialidades[0];
  const nomePreview = nomeExibicao.trim() || initialName || "Seu nome";
  const inicial = nomePreview.charAt(0).toUpperCase() || "V";
  const modosAtivos = [
    modos.presencial && "Presencial",
    modos.domiciliar && "Domiciliar",
    modos.teleorientacao && "Teleorientação",
  ].filter(Boolean) as string[];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Coluna esquerda: formulário */}
      <div className="flex flex-col gap-6">
        {/* Foto e identificação */}
        <Section
          title="Foto e identificação"
          desc="Como você aparece no perfil público"
        >
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-fundo-destaque text-principal flex items-center justify-center text-2xl font-bold shrink-0">
              {inicial}
            </div>
            <div>
              <p className="font-medium text-sm text-titulo mb-1">
                Foto de perfil
              </p>
              <p className="text-[12px] text-corpo-texto leading-relaxed mb-2">
                Responsáveis confiam mais em perfis com foto real. Mínimo 400×400px.
              </p>
              <button
                type="button"
                disabled
                className="rounded-pill border border-gray-200 text-corpo-texto/60 px-4 py-2 text-[13px] font-medium cursor-not-allowed"
              >
                {/* TODO: upload pra Supabase Storage (migration 031) */}
                Carregar foto (em breve)
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeCompleto">Nome completo</Label>
              <Input
                id="nomeCompleto"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Como aparece no CRMV"
              />
            </div>
            <div>
              <Label htmlFor="nomeExibicao">Nome de exibição</Label>
              <Input
                id="nomeExibicao"
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                placeholder="Como responsáveis te encontram"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="crmv">CRMV</Label>
              <Input
                id="crmv"
                disabled
                placeholder="Validação em breve"
              />
              <p className="text-[12px] text-corpo-texto/70 mt-1">
                {/* TODO: validação de CRMV (migration 029/031) */}
                O CRMV é validado pela equipe Vetria.
              </p>
            </div>
            <div>
              <Label htmlFor="experiencia">Anos de experiência</Label>
              <Select
                id="experiencia"
                options={EXPERIENCIA}
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                placeholder="Selecione..."
              />
            </div>
          </div>
        </Section>

        {/* Bio */}
        <Section
          title="Bio profissional"
          desc="A primeira coisa que responsáveis leem sobre você"
        >
          <textarea
            rows={6}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte sobre sua atuação, foco e jeito de atender. Evite tom comercial, fale com naturalidade."
            className="w-full rounded-2xl bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition resize-none"
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[12px] text-corpo-texto/70">
              Mínimo {BIO_MIN} caracteres.
            </span>
            <span className="text-[11px] text-corpo-texto/60">
              {bio.length} / {BIO_MAX}
            </span>
          </div>
        </Section>

        {/* Especialidades */}
        <Section
          title="Especialidades"
          desc="A primeira selecionada vira a principal"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ESPECIALIDADES.map((e) => {
              const selected = especialidades.includes(e);
              const isPrincipal = principal === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEspecialidade(e)}
                  className={`rounded-xl border-2 px-3.5 py-2.5 text-[13px] text-left transition ${
                    selected
                      ? "bg-principal text-white border-principal"
                      : "border-gray-200 text-titulo hover:border-principal"
                  }`}
                >
                  {e}
                  {isPrincipal && (
                    <span className="ml-1.5 text-[9px] uppercase tracking-wider rounded-pill bg-white/20 px-1.5 py-0.5">
                      principal
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Localização */}
        <Section title="Localização" desc="Onde responsáveis podem te encontrar">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: Palmas"
                rightSlot={<PinIcon />}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                id="estado"
                options={ESTADOS}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                placeholder="UF"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="bairro">Bairro ou região (opcional)</Label>
            <Input
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Regiões onde atende, separadas por vírgula"
            />
          </div>
        </Section>

        {/* Modos de atendimento */}
        <Section title="Como você atende" desc="Responsáveis filtram por essas opções">
          <div className="grid sm:grid-cols-3 gap-3">
            <ModeCard
              active={modos.presencial}
              onClick={() => toggleModo("presencial")}
              title="Presencial"
              desc="Em estabelecimento ou consultório"
            />
            <ModeCard
              active={modos.domiciliar}
              onClick={() => toggleModo("domiciliar")}
              title="Domiciliar"
              desc="Visitas na casa do responsável"
            />
            <ModeCard
              active={modos.teleorientacao}
              onClick={() => toggleModo("teleorientacao")}
              title="Teleorientação"
              desc="Consulta online por vídeo"
            />
          </div>
        </Section>

        {/* Contato */}
        <Section
          title="Como responsáveis te contatam"
          desc="Pelo menos uma forma de contato"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone fixo (opcional)</Label>
              <Input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="emailContato">
              Email de contato profissional (opcional)
            </Label>
            <Input
              id="emailContato"
              type="email"
              value={emailContato}
              onChange={(e) => setEmailContato(e.target.value)}
              placeholder="contato@seuestabelecimento.com.br"
            />
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
            {/* TODO: persistir em vet_profiles (migration 029/031) */}
            Salvar (em breve)
          </button>
        </div>
      </div>

      {/* Coluna direita: preview ao vivo */}
      <aside className="lg:sticky lg:top-24 flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-principal text-white/90 text-center py-3 text-[11px] uppercase tracking-[0.18em] font-medium">
            Pré-visualização
          </div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-fundo-destaque text-principal flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {inicial}
            </div>
            <div className="font-bold text-xl text-titulo mb-1">
              {nomePreview}
            </div>

            {principal ? (
              <span className="inline-block rounded-pill bg-fundo-destaque text-principal text-[12px] font-medium px-3.5 py-1.5 mb-4">
                {principal}
              </span>
            ) : (
              <p className="text-[12px] text-corpo-texto/60 mb-4">
                Selecione uma especialidade
              </p>
            )}

            <div className="border-t border-gray-100 pt-4 text-left flex flex-col gap-1.5">
              <PreviewRow
                icon={<PinIcon />}
                text={
                  cidade || estado
                    ? [cidade, estado].filter(Boolean).join(", ")
                    : "Cidade não informada"
                }
              />
              <PreviewRow
                icon={<BriefcaseIcon />}
                text={
                  EXPERIENCIA.find((x) => x.value === experiencia)?.label ??
                  "Experiência não informada"
                }
              />
            </div>

            {modosAtivos.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {modosAtivos.map((m) => (
                  <span
                    key={m}
                    className="rounded-pill border border-gray-200 text-corpo-texto text-[11px] px-2.5 py-1"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-fundo-claro/60 border border-gray-100 p-4">
          <p className="text-[12px] text-corpo-texto leading-relaxed">
            Seu perfil <strong className="text-titulo">ainda não está público</strong>.
            Quando a busca da Vetria for ao ar, ele aparece pra responsáveis da sua região.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
      <div className="mb-5 pb-4 border-b border-gray-100">
        <h2 className="font-bold text-lg text-titulo">{title}</h2>
        <p className="text-[13px] text-corpo-texto mt-0.5">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-4 text-left transition ${
        active ? "border-principal bg-fundo-destaque" : "border-gray-200 hover:border-principal/50"
      }`}
    >
      <span
        className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
          active ? "bg-principal text-white" : "border border-gray-300"
        }`}
      >
        {active && <CheckIcon />}
      </span>
      <div className="font-medium text-sm text-titulo mb-0.5">{title}</div>
      <div className="text-[12px] text-corpo-texto leading-snug">{desc}</div>
    </button>
  );
}

function PreviewRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-corpo-texto">
      <span className="text-corpo-texto/60 shrink-0">{icon}</span>
      {text}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
