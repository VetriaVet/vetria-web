"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Input } from "../../../../components/ui/Input";
import { Label } from "../../../../components/ui/Label";
import { Select } from "../../../../components/ui/Select";

// Onboarding clínica multi-step — casca fiel (DL-020), mesmo padrão do vet.
// Campos só no estado client (clinic_profiles é migration 031). "Concluir"
// chama a Server Action que apenas marca onboarding_completed (DL-016).

const STEPS = [
  { n: 1, title: "Dados da clínica", desc: "Razão social, CNPJ" },
  { n: 2, title: "Localização", desc: "Endereço e cidade" },
  { n: 3, title: "Perfil público", desc: "Sobre, serviços, contato" },
  { n: 4, title: "Validação", desc: "Documentos" },
];

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
].map((uf) => ({ value: uf, label: uf }));

const SERVICOS = [
  "Emergência 24h", "Internação", "Centro cirúrgico", "Laboratório",
  "Diagnóstico por imagem", "Vacinação", "Banho & tosa", "Pet shop", "Farmácia",
];

export default function ClinicOnboardingForm({
  initialName,
  action,
}: {
  initialName: string;
  action: () => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [nomeFantasia, setNomeFantasia] = useState(initialName);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [sobre, setSobre] = useState("");
  const [servicos, setServicos] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState("");

  function toggleServico(s: string) {
    setServicos((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  }
  function next() {
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }
  function finish() {
    startTransition(() => {
      action(); // DL-016
    });
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] -m-6 sm:-m-8 min-h-[calc(100vh-4rem)]">
      <aside className="bg-principal text-white p-8 flex flex-col">
        <div className="flex items-center gap-2.5 mb-10">
          <Image src="/vetria/logo-square.png" alt="Vetria" width={32} height={32} className="rounded-md" />
          <span className="font-bold text-xl">Vetria</span>
        </div>

        <h1 className="font-bold text-[24px] leading-tight mb-3">
          Vamos cadastrar a sua clínica.
        </h1>
        <p className="text-[13px] text-white/70 leading-relaxed mb-8">
          Em poucos minutos o cadastro fica pronto pra validação. Você pode
          pausar e voltar quando quiser.
        </p>

        <ol className="flex flex-col gap-1">
          {STEPS.map((s) => {
            const state = s.n < step ? "done" : s.n === step ? "active" : "todo";
            return (
              <li
                key={s.n}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  state === "active" ? "bg-white/10" : ""
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0 ${
                    state === "done"
                      ? "bg-fundo-destaque text-principal"
                      : state === "active"
                        ? "bg-fundo-claro text-principal"
                        : "bg-white/15 text-white/60"
                  }`}
                >
                  {state === "done" ? <CheckIcon /> : s.n}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${state === "todo" ? "text-white/60" : "text-white"}`}>
                    {s.title}
                  </div>
                  <div className="text-[12px] text-white/45">{s.desc}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="p-8 sm:p-12 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-principal font-medium mb-3">
            Passo {step} de 4 · {STEPS[step - 1].title}
          </div>

          {step === 1 && (
            <StepWrap
              title="Dados da clínica."
              desc="Informações institucionais que validam a clínica. O CNPJ é usado só pra confirmação."
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nf">Nome fantasia</Label>
                  <Input id="nf" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Como tutores conhecem a clínica" />
                </div>
                <div>
                  <Label htmlFor="rs">Razão social</Label>
                  <Input id="rs" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Nome jurídico" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <Label htmlFor="resp">Responsável técnico</Label>
                  <Input id="resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Veterinário responsável" />
                </div>
              </div>
            </StepWrap>
          )}

          {step === 2 && (
            <StepWrap title="Onde fica a clínica." desc="O endereço aparece pra tutores encontrarem vocês.">
              <div>
                <Label htmlFor="end">Endereço</Label>
                <Input id="end" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, complemento" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
                </div>
                <div>
                  <Label htmlFor="cid">Cidade</Label>
                  <Input id="cid" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Palmas" />
                </div>
                <div>
                  <Label htmlFor="uf">Estado</Label>
                  <Select id="uf" options={ESTADOS} value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="UF" />
                </div>
              </div>
            </StepWrap>
          )}

          {step === 3 && (
            <StepWrap title="Perfil público da clínica." desc="É o que tutores veem ao encontrar a clínica na busca.">
              <div className="mb-4">
                <Label>Logo da clínica</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-corpo-texto/60">
                  {/* TODO: upload pra Supabase Storage (migration 031) */}
                  <p className="text-sm">Upload de logo chega em breve</p>
                </div>
              </div>
              <div className="mb-4">
                <Label htmlFor="sobre">Sobre a clínica</Label>
                <textarea
                  id="sobre"
                  rows={5}
                  maxLength={600}
                  value={sobre}
                  onChange={(e) => setSobre(e.target.value)}
                  placeholder="História, estrutura e diferenciais da clínica."
                  className="w-full rounded-2xl bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition resize-none"
                />
                <div className="text-right text-[11px] text-corpo-texto/60 mt-1">{sobre.length} / 600</div>
              </div>
              <div className="mb-4">
                <Label>Serviços e estrutura</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1.5">
                  {SERVICOS.map((s) => {
                    const on = servicos.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleServico(s)}
                        className={`rounded-xl border-2 px-3.5 py-2.5 text-[13px] text-left transition ${
                          on ? "bg-principal text-white border-principal" : "border-gray-200 text-titulo hover:border-principal"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="wpp">WhatsApp</Label>
                <Input id="wpp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </StepWrap>
          )}

          {step === 4 && (
            <StepWrap
              title="Quase lá: validação."
              desc="Ao concluir, enviamos o cadastro pra validação da equipe Vetria. Vocês recebem um email quando a clínica for aprovada."
            >
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-corpo-texto/60 mb-4">
                {/* TODO: upload de documentos da clínica (migration 031) */}
                <p className="text-sm">Envio de documentos chega em breve</p>
              </div>
              <div className="flex gap-3 rounded-xl bg-fundo-destaque p-4">
                <span className="text-principal shrink-0 mt-0.5">
                  <LockIcon />
                </span>
                <p className="text-[13px] text-corpo-texto leading-relaxed">
                  <strong className="text-titulo">Dados protegidos pela LGPD.</strong>{" "}
                  As informações são usadas apenas para validação da clínica.
                </p>
              </div>
            </StepWrap>
          )}

          <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-gray-100">
            <span className="text-[12px] text-corpo-texto/70">{step * 25}% concluído</span>
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-pill border border-gray-200 text-corpo-texto px-5 py-2.5 text-sm font-medium hover:border-principal hover:text-principal transition"
                >
                  Voltar
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 rounded-pill bg-principal text-white px-6 py-2.5 font-semibold text-sm hover:bg-[#142E33] transition"
                >
                  Continuar
                  <ArrowRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={isPending}
                  aria-busy={isPending}
                  className="inline-flex items-center gap-2 rounded-pill bg-principal text-white px-6 py-2.5 font-semibold text-sm hover:bg-[#142E33] transition disabled:opacity-50"
                >
                  {isPending ? "Enviando..." : "Concluir cadastro"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StepWrap({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-bold text-[26px] leading-tight text-titulo mb-2">{title}</h2>
      <p className="text-[15px] text-corpo-texto leading-relaxed mb-8">{desc}</p>
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
