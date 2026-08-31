"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
  ESPECIALIDADES,
  ESTADOS,
  EXPERIENCIA,
  STEPS,
  TITULOS,
  type ResultadoOnboarding,
  type VetOnboardingInicial,
  type VetOnboardingPayload,
} from "./campos";

// Onboarding vet multi-step. Os 4 passos guardam estado no cliente e o
// "Concluir" manda tudo pra Server Action, que valida de novo, grava em
// `vet_profiles` e `perfil_privado` e chama a RPC da fila de validação (T-006).
//
// As listas de valores mudaram de lugar: vivem em `campos.ts`, porque o
// servidor valida contra as mesmas listas. Duas cópias divergem, e a que
// diverge é sempre a do servidor.
//
// DL-016: nenhum try/catch em volta da Action. O caminho de sucesso termina em
// redirect() do servidor, e o caminho de falha volta como VALOR de retorno.

export default function VetOnboardingForm({
  inicial,
  modo,
  action,
}: {
  inicial: VetOnboardingInicial;
  modo: "novo" | "revisao";
  action: (
    payload: VetOnboardingPayload
  ) => Promise<ResultadoOnboarding | void>;
}) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(inicial.nome);
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [crmv, setCrmv] = useState(inicial.crmv);
  const [uf, setUf] = useState(inicial.crmvUf);
  const [especialidades, setEspecialidades] = useState<string[]>(inicial.especialidades);
  const [experiencia, setExperiencia] = useState(inicial.experiencia);
  const [cidade, setCidade] = useState(inicial.cidade);
  const [estado, setEstado] = useState(inicial.estado);
  const [bairro, setBairro] = useState(inicial.bairro);
  const [modos, setModos] = useState({
    presencial: inicial.atendePresencial,
    domiciliar: inicial.atendeDomiciliar,
    tele: inicial.atendeTeleorientacao,
  });
  const [bio, setBio] = useState(inicial.bio);
  const [whatsapp, setWhatsapp] = useState(inicial.whatsapp);

  const emRevisao = modo === "revisao";

  // Pelo menos um modo de atendimento é obrigatório (decisão do Elber, 26/08).
  // Bloquear aqui evita que a pessoa chegue ao passo 4 e tome o erro do
  // servidor. A regra que VALE continua sendo a da Server Action: esta é
  // conveniência, não autorização.
  const algumModo = modos.presencial || modos.domiciliar || modos.tele;
  const podeAvancar = step === 2 ? algumModo : true;

  function toggleEsp(e: string) {
    setEspecialidades((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));
  }
  function toggleModo(k: keyof typeof modos) {
    setModos((p) => ({ ...p, [k]: !p[k] }));
  }

  function next() {
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  function finish() {
    setErro(null);
    // DL-016: sem try/catch. O `await` existe só pra ler o erro que a Action
    // devolve como valor; no sucesso ela redireciona e esta linha nunca
    // resolve com objeto.
    startTransition(async () => {
      const r = await action({
        nome,
        titulo,
        crmv,
        crmvUf: uf,
        especialidades,
        experiencia,
        cidade,
        estado,
        bairro,
        atendePresencial: modos.presencial,
        atendeDomiciliar: modos.domiciliar,
        atendeTeleorientacao: modos.tele,
        bio,
        whatsapp,
      });
      if (r && r.ok === false) setErro(r.mensagem);
    });
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] min-h-screen">
      {/* Sidebar de progresso */}
      <aside className="bg-principal text-white p-8 flex flex-col">
        <div className="flex items-center gap-2.5 mb-10">
          <Image src="/vetria/logo-vetria-fundo-escuro.svg" alt="Vetria" width={178} height={29} className="h-7 w-auto" />
        </div>

        <h1 className="font-bold text-[24px] leading-tight mb-3">
          {emRevisao
            ? "Seu cadastro está em validação."
            : "Vamos configurar seu perfil profissional."}
        </h1>
        <p className="text-[13px] text-white/70 leading-relaxed mb-8">
          {emRevisao
            ? "Você pode corrigir e completar os dados enquanto nossa equipe confere seu CRMV. As alterações são salvas quando você chega ao fim."
            : "Em poucos minutos seu perfil fica pronto pra validação. Você pode pausar e voltar quando quiser."}
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
                  <div
                    className={`text-sm font-medium ${
                      state === "todo" ? "text-white/60" : "text-white"
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[12px] text-white/45">{s.desc}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Conteúdo do passo */}
      <main className="p-8 sm:p-12 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-principal font-medium mb-3">
            Passo {step} de 4 · {STEPS[step - 1].title}
          </div>

          {step === 1 && (
            <StepWrap
              title="Vamos começar pelo essencial."
              desc="Esses dados validam você como profissional. O CRMV é usado só pra confirmação. Só o estado e o número validado aparecem no perfil."
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como no CRMV" />
                </div>
                <div>
                  <Label htmlFor="titulo">Título profissional</Label>
                  <Select id="titulo" options={TITULOS} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Selecione..." />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="crmv">Número do CRMV</Label>
                  <Input id="crmv" value={crmv} onChange={(e) => setCrmv(e.target.value)} placeholder="Ex: 1234" />
                </div>
                <div>
                  <Label htmlFor="uf">Estado de registro</Label>
                  <Select id="uf" options={ESTADOS} value={uf} onChange={(e) => setUf(e.target.value)} placeholder="UF" />
                </div>
              </div>
              <div className="mt-4">
                <Label>Especialidades</Label>
                <p className="text-[12px] text-corpo-texto/70 mb-3">
                  1 principal e até 3 secundárias. Dá pra ajustar depois.
                </p>
                <Chips items={ESPECIALIDADES} selected={especialidades} onToggle={toggleEsp} />
              </div>
              <div className="mt-4">
                <Label htmlFor="exp">Anos de experiência</Label>
                <Select id="exp" options={EXPERIENCIA} value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="Selecione..." />
              </div>
            </StepWrap>
          )}

          {step === 2 && (
            <StepWrap
              title="Onde e como você atende."
              desc="Responsáveis filtram por cidade e modo de atendimento."
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Palmas" />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select id="estado" options={ESTADOS} value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="UF" />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="bairro">Bairro ou região (opcional)</Label>
                <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Regiões que atende, separadas por vírgula" />
              </div>
              <div className="mt-5">
                <Label>Como você atende</Label>
                <p className="text-[12px] text-corpo-texto/70 mb-3">
                  Marque pelo menos uma. É por aqui que responsáveis filtram a
                  busca, e dá pra marcar mais de uma.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mt-1.5">
                  <ModeCard active={modos.presencial} onClick={() => toggleModo("presencial")} title="Presencial" desc="Em estabelecimento ou consultório" />
                  <ModeCard active={modos.domiciliar} onClick={() => toggleModo("domiciliar")} title="Domiciliar" desc="Visitas na casa do responsável" />
                  <ModeCard active={modos.tele} onClick={() => toggleModo("tele")} title="Teleorientação" desc="Consulta online por vídeo" />
                </div>
              </div>
            </StepWrap>
          )}

          {step === 3 && (
            <StepWrap
              title="Seu perfil público."
              desc="É o que responsáveis veem ao te encontrar na busca."
            >
              <div className="mb-4">
                <Label>Foto de perfil</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-corpo-texto/60">
                  {/* Foto de perfil está fora dos 3 meses (R-019): não existe
                      coluna em `vet_profiles` nem bucket público. Volta na F4/S7. */}
                  <p className="text-sm">Upload de foto chega em breve</p>
                </div>
              </div>
              <div className="mb-4">
                <Label htmlFor="bio">Bio profissional</Label>
                <textarea
                  id="bio"
                  rows={5}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte sobre sua atuação e jeito de atender. Fale com naturalidade."
                  className="w-full rounded-2xl bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition resize-none"
                />
                <div className="text-right text-[11px] text-corpo-texto/60 mt-1">{bio.length} / 500</div>
              </div>
              <div>
                <Label htmlFor="wpp">WhatsApp</Label>
                <Input id="wpp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </StepWrap>
          )}

          {step === 4 && (
            <StepWrap
              title={emRevisao ? "Revise e salve." : "Quase lá: validação do CRMV."}
              desc={
                emRevisao
                  ? "Ao salvar, seus dados são atualizados e seguem na fila de validação da equipe Vetria. Você recebe um email quando o perfil for aprovado."
                  : "Ao concluir, enviamos seu cadastro pra validação da equipe Vetria. Você recebe um email quando o perfil for aprovado."
              }
            >
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-corpo-texto/60 mb-4">
                {/* Upload do documento do CRMV é a T-008: o bucket privado
                    `documentos` já existe e a rota de envio ainda não. */}
                <p className="text-sm">Envio de documentos do CRMV chega em breve</p>
              </div>
              <div className="flex gap-3 rounded-xl bg-fundo-destaque p-4">
                <span className="text-principal shrink-0 mt-0.5">
                  <LockIcon />
                </span>
                <p className="text-[13px] text-corpo-texto leading-relaxed">
                  <strong className="text-titulo">Seus dados são protegidos pela LGPD.</strong>{" "}
                  O número do CRMV é usado apenas para validação.
                </p>
              </div>
            </StepWrap>
          )}

          {/* Erro honesto: o que o servidor recusou, dito com todas as letras.
              Nada é perdido — o estado do formulário continua na tela. */}
          {erro && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-800 leading-relaxed"
            >
              <strong className="block font-semibold mb-0.5">
                Não deu pra salvar.
              </strong>
              {erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-gray-100">
            <span className="text-[12px] text-corpo-texto/70">
              {step * 25}% concluído
            </span>
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
                  disabled={!podeAvancar}
                  title={
                    podeAvancar
                      ? undefined
                      : "Marque pelo menos uma forma de atendimento para continuar."
                  }
                  className="inline-flex items-center gap-2 rounded-pill bg-principal text-white px-6 py-2.5 font-semibold text-sm hover:bg-[#142E33] transition disabled:opacity-50"
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
                  {isPending
                    ? "Salvando..."
                    : emRevisao
                      ? "Salvar alterações"
                      : "Concluir cadastro"}
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

function Chips({
  items,
  selected,
  onToggle,
}: {
  items: readonly string[];
  selected: string[];
  onToggle: (s: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {items.map((s) => {
        const on = selected.includes(s);
        const principal = selected[0] === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onToggle(s)}
            className={`rounded-xl border-2 px-3.5 py-2.5 text-[13px] text-left transition ${
              on ? "bg-principal text-white border-principal" : "border-gray-200 text-titulo hover:border-principal"
            }`}
          >
            {s}
            {principal && (
              <span className="ml-1.5 text-[9px] uppercase tracking-wider rounded-pill bg-white/20 px-1.5 py-0.5">
                principal
              </span>
            )}
          </button>
        );
      })}
    </div>
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
      className={`rounded-2xl border-2 p-4 text-left transition ${
        active ? "border-principal bg-fundo-destaque" : "border-gray-200 hover:border-principal/50"
      }`}
    >
      <div className="font-medium text-sm text-titulo mb-0.5">{title}</div>
      <div className="text-[12px] text-corpo-texto leading-snug">{desc}</div>
    </button>
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
