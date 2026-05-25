"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

// Editor de perfil da clínica — casca fiel ao produto (DL-020), mesmo padrão
// do editor do vet. Estado client + preview ao vivo, sem persistência ainda
// (não existe clinic_profiles — migration 029/031). "Salvar" desabilitado.
// Campos vazios (só nome fantasia pré-preenchido do user_metadata).

const SERVICOS = [
  "Emergência 24h",
  "Internação",
  "Centro cirúrgico",
  "Laboratório",
  "Diagnóstico por imagem",
  "Vacinação",
  "Banho & tosa",
  "Pet shop",
  "Farmácia",
];

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
].map((uf) => ({ value: uf, label: uf }));

const BIO_MAX = 600;

export default function ClinicProfileForm({
  initialName,
}: {
  initialName: string;
}) {
  const [nomeFantasia, setNomeFantasia] = useState(initialName);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [sobre, setSobre] = useState("");
  const [servicos, setServicos] = useState<string[]>([]);
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [site, setSite] = useState("");

  function toggleServico(s: string) {
    setServicos((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const nomePreview = nomeFantasia.trim() || initialName || "Sua clínica";
  const inicial = nomePreview.charAt(0).toUpperCase() || "C";

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Coluna esquerda: formulário */}
      <div className="flex flex-col gap-6">
        <Section title="Identificação" desc="Como a clínica aparece no perfil público">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-fundo-destaque text-principal flex items-center justify-center text-2xl font-bold shrink-0">
              {inicial}
            </div>
            <div>
              <p className="font-medium text-sm text-titulo mb-1">Logo da clínica</p>
              <p className="text-[12px] text-corpo-texto leading-relaxed mb-2">
                Use a logo oficial. Mínimo 400×400px.
              </p>
              <button
                type="button"
                disabled
                className="rounded-pill border border-gray-200 text-corpo-texto/60 px-4 py-2 text-[13px] font-medium cursor-not-allowed"
              >
                {/* TODO: upload pra Supabase Storage (migration 031) */}
                Carregar logo (em breve)
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeFantasia">Nome fantasia</Label>
              <Input
                id="nomeFantasia"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Como tutores conhecem a clínica"
              />
            </div>
            <div>
              <Label htmlFor="razaoSocial">Razão social</Label>
              <Input
                id="razaoSocial"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Nome jurídico"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" disabled placeholder="Validação em breve" />
            <p className="text-[12px] text-corpo-texto/70 mt-1">
              {/* TODO: validação de CNPJ (migration 029/031) */}
              O CNPJ é validado pela equipe Vetria.
            </p>
          </div>
        </Section>

        <Section title="Sobre a clínica" desc="O que tutores leem primeiro">
          <textarea
            rows={6}
            maxLength={BIO_MAX}
            value={sobre}
            onChange={(e) => setSobre(e.target.value)}
            placeholder="Conte a história da clínica, estrutura e diferenciais. Fale com naturalidade."
            className="w-full rounded-2xl bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition resize-none"
          />
          <div className="flex justify-end mt-1.5">
            <span className="text-[11px] text-corpo-texto/60">
              {sobre.length} / {BIO_MAX}
            </span>
          </div>
        </Section>

        <Section title="Serviços e estrutura" desc="O que a clínica oferece">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SERVICOS.map((s) => {
              const selected = servicos.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServico(s)}
                  className={`rounded-xl border-2 px-3.5 py-2.5 text-[13px] text-left transition ${
                    selected
                      ? "bg-principal text-white border-principal"
                      : "border-gray-200 text-titulo hover:border-principal"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Localização" desc="Onde tutores encontram a clínica">
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, complemento"
              rightSlot={<PinIcon />}
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="sm:col-span-1">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: Palmas"
              />
            </div>
            <div className="sm:col-span-1">
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
        </Section>

        <Section title="Contato" desc="Como tutores falam com a clínica">
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
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="emailContato">Email de contato (opcional)</Label>
              <Input
                id="emailContato"
                type="email"
                value={emailContato}
                onChange={(e) => setEmailContato(e.target.value)}
                placeholder="contato@suaclinica.com.br"
              />
            </div>
            <div>
              <Label htmlFor="site">Site (opcional)</Label>
              <Input
                id="site"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="www.suaclinica.com.br"
              />
            </div>
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
            {/* TODO: persistir em clinic_profiles (migration 029/031) */}
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
            <div className="w-16 h-16 rounded-2xl bg-fundo-destaque text-principal flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {inicial}
            </div>
            <div className="font-bold text-xl text-titulo mb-3">{nomePreview}</div>

            {servicos.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {servicos.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="rounded-pill bg-fundo-destaque text-principal text-[11px] font-medium px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-corpo-texto/60 mb-4">
                Selecione os serviços oferecidos
              </p>
            )}

            <div className="border-t border-gray-100 pt-4 text-left">
              <div className="flex items-center gap-2 text-[13px] text-corpo-texto">
                <span className="text-corpo-texto/60 shrink-0">
                  <PinIcon />
                </span>
                {cidade || estado
                  ? [cidade, estado].filter(Boolean).join(", ")
                  : "Localização não informada"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-fundo-claro/60 border border-gray-100 p-4">
          <p className="text-[12px] text-corpo-texto leading-relaxed">
            A clínica <strong className="text-titulo">ainda não está pública</strong>.
            Quando a busca da Vetria for ao ar, ela aparece pra tutores da região.
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

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
