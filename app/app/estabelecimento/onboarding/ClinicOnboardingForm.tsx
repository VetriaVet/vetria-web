"use client";

import { useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { CampoMascarado } from "@/components/ui/CampoMascarado";
import { erroDoCampo } from "@/lib/campos/mascaras";
import EnvioDeDocumento from "@/components/app/EnvioDeDocumento";
import {
  ESTADOS,
  LIMITES,
  SERVICOS,
  STEPS,
  type ClinicOnboardingInicial,
  type ClinicOnboardingPayload,
  type ResultadoOnboarding,
} from "./campos";

// Onboarding do estabelecimento, 4 passos. O estado vive no cliente e o
// "Concluir" manda tudo pra Server Action, que valida de novo, grava o que é
// público em `clinic_profiles`, o que é privado em `perfil_privado` e chama a
// RPC da fila de validação (T-007).
//
// As listas de valores vivem em `campos.ts`, porque o servidor valida contra as
// mesmas listas. Duas cópias divergem, e a que diverge é sempre a do servidor.
//
// DL-016: nenhum try/catch em volta da Action. O caminho de sucesso termina em
// redirect() do servidor, e o caminho de falha volta como VALOR de retorno.

export default function ClinicOnboardingForm({
  inicial,
  modo,
  documentoEnviadoEm,
  motivoReprova,
  action,
}: {
  inicial: ClinicOnboardingInicial;
  modo: "novo" | "revisao";
  /** `perfil_privado.documento_enviado_em`, lido pelo Server Component. É o
   *  sinal de que existe documento no bucket, e vem do BANCO: o cliente nunca
   *  carimba essa data (o trigger `trg_perfil_privado_carimbo` carimba). */
  documentoEnviadoEm: string | null;
  /** T-024 / R-051 — `profiles.status_motivo`, lido pelo Server Component SÓ
   *  quando `status = 'incomplete'`: é o motivo da reprova, escrito pelo admin
   *  pela RPC `admin_definir_status`. Nulo = nunca foi reprovado, ou foi e o
   *  admin não deixou motivo (o que a Action da T-024 não permite mais). */
  motivoReprova: string | null;
  action: (
    payload: ClinicOnboardingPayload
  ) => Promise<ResultadoOnboarding | void>;
}) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [docEnviadoEm, setDocEnviadoEm] = useState<string | null>(
    documentoEnviadoEm
  );

  const [nomeFantasia, setNomeFantasia] = useState(inicial.nomeFantasia);
  const [razaoSocial, setRazaoSocial] = useState(inicial.razaoSocial);
  const [cnpj, setCnpj] = useState(inicial.cnpj);
  const [responsavel, setResponsavel] = useState(inicial.responsavelTecnico);
  const [endereco, setEndereco] = useState(inicial.endereco);
  const [cep, setCep] = useState(inicial.cep);
  const [cidade, setCidade] = useState(inicial.cidade);
  const [estado, setEstado] = useState(inicial.estado);
  const [sobre, setSobre] = useState(inicial.sobre);
  const [servicos, setServicos] = useState<string[]>(inicial.servicos);
  const [whatsapp, setWhatsapp] = useState(inicial.whatsapp);

  const emRevisao = modo === "revisao";

  // T-008 — SEM DOCUMENTO NÃO HÁ CONCLUSÃO, e isso é o critério do card:
  // "falha de upload impede a conclusão; o profissional não pode sair achando
  // que enviou o documento quando não enviou".
  //
  // O sinal é `docEnviadoEm`, que só muda quando o SERVIDOR respondeu que a
  // linha foi gravada com as três colunas do documento. Quem já enviou antes
  // (revisão) chega aqui com o valor vindo do banco e não precisa reenviar.
  //
  // ⚠️ Isto é conveniência de tela, não autorização. Desde a T-024 (DL-061,
  // T-022 opção a) a Server Action também recusa concluir sem documento, e
  // este `disabled` só evita a ida e volta. Desde a 0004 (T-027, aplicada em
  // 23/09/2026) a regra também vive no banco: `concluir_onboarding_profissional()`
  // exige o objeto do documento no bucket (SEC-098), então nem a chamada direta
  // pelo PostgREST entra na fila sem documento.
  const temDocumento = Boolean(docEnviadoEm);

  // T-035 — campo com máscara fora da regra segura o passo, com o motivo
  // embaixo do próprio campo. Conveniência de tela: quem decide é a Action.
  //
  // R-060 conferido aqui também: serviços NÃO têm o mesmo defeito, porque o
  // teto (`MAX_SERVICOS`) é o tamanho da lista inteira. Marcar todos é válido.
  const motivoParado =
    step === 1 && erroDoCampo("cnpj", cnpj)
      ? "Confira o CNPJ para continuar."
      : step === 2 && erroDoCampo("cep", cep)
        ? "Confira o CEP para continuar."
        : step === 3 && erroDoCampo("telefone", whatsapp)
          ? "Confira o WhatsApp para continuar."
          : null;

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
    setErro(null);
    // DL-016: sem try/catch. O `await` existe só pra ler o erro que a Action
    // devolve como valor; no sucesso ela redireciona e esta linha nunca resolve
    // com objeto.
    startTransition(async () => {
      const r = await action({
        nomeFantasia,
        razaoSocial,
        cnpj,
        responsavelTecnico: responsavel,
        endereco,
        cep,
        cidade,
        estado,
        sobre,
        servicos,
        whatsapp,
      });
      if (r && r.ok === false) setErro(r.mensagem);
    });
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] min-h-screen">
      <aside className="bg-principal text-white p-8 flex flex-col">
        <div className="flex items-center gap-2.5 mb-10">
          <Image src="/vetria/logo-vetria-fundo-escuro.svg" alt="Vetria" width={178} height={29} className="h-7 w-auto" />
        </div>

        <h1 className="font-bold text-[24px] leading-tight mb-3">
          {emRevisao
            ? "O cadastro está em validação."
            : "Vamos cadastrar o seu estabelecimento."}
        </h1>
        <p className="text-[13px] text-white/70 leading-relaxed mb-8">
          {emRevisao
            ? "Você pode corrigir e completar os dados enquanto nossa equipe confere o cadastro. As alterações são salvas quando você chega ao fim."
            : "Em poucos minutos o cadastro fica pronto pra validação. Você pode pausar e voltar quando quiser."}
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
          {/* T-024 / R-051 — a outra metade do laço: o reprovado vê POR QUE
              voltou. Sem isto ele recebia o formulário em modo "novo",
              reenviava o mesmo dado e a fila reciclava. O texto é do admin e
              entra como texto (React escapa), nunca como HTML. */}
          {motivoReprova && (
            <div
              role="status"
              className="mb-8 flex gap-3 rounded-xl bg-warning-soft p-4"
            >
              <TriangleAlert
                size={18}
                className="mt-0.5 shrink-0 text-warning"
                aria-hidden="true"
              />
              <div className="text-[13px] leading-relaxed text-corpo-texto">
                <strong className="block text-titulo mb-1">
                  A equipe Vetria devolveu o cadastro para ajuste.
                </strong>
                <span className="whitespace-pre-line">{motivoReprova}</span>
                <span className="block mt-2">
                  Corrija o que foi apontado e conclua de novo: o cadastro volta
                  para a fila de validação.
                </span>
              </div>
            </div>
          )}
          <div className="text-[11px] uppercase tracking-[0.18em] text-principal font-medium mb-3">
            Passo {step} de 4 · {STEPS[step - 1].title}
          </div>

          {step === 1 && (
            <StepWrap
              title="Dados do estabelecimento."
              desc="Informações institucionais que validam o estabelecimento. CNPJ, razão social e responsável técnico não aparecem no seu perfil público: são usados só pela nossa equipe, na validação."
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nf">Nome fantasia</Label>
                  <Input id="nf" value={nomeFantasia} maxLength={LIMITES.nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Como responsáveis conhecem o estabelecimento" />
                </div>
                <div>
                  <Label htmlFor="rs">Razão social</Label>
                  <Input id="rs" value={razaoSocial} maxLength={LIMITES.razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Nome jurídico" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <CampoMascarado id="cnpj" mascara="cnpj" valor={cnpj} onValor={setCnpj} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <Label htmlFor="resp">Responsável técnico (opcional)</Label>
                  <Input id="resp" value={responsavel} maxLength={LIMITES.responsavelTecnico} onChange={(e) => setResponsavel(e.target.value)} placeholder="Veterinário responsável" />
                </div>
              </div>

              {/* ⚠️ R-043 / SEC-064 — o responsável técnico é uma PESSOA FÍSICA
                  que pode nem ser a titular desta conta e não está nesta tela
                  para consentir. Este é o primeiro ponto do produto em que a
                  Vetria coleta dado pessoal de terceiro, e a frase abaixo é o
                  que o card pede: uma declaração explícita de quem digita. Não
                  é a rotina de consentimento versionado, que é F6/S11. */}
              <p className="mt-3 text-[12px] text-corpo-texto/80 leading-relaxed">
                Ao informar o responsável técnico, você declara ter autorização
                dele para compartilhar o nome com a Vetria. Usamos o dado apenas
                para validar o estabelecimento, ele não vai para o perfil
                público e pode ser removido a pedido.
              </p>
            </StepWrap>
          )}

          {step === 2 && (
            <StepWrap title="Onde fica o estabelecimento." desc="O endereço aparece pra responsáveis encontrarem vocês.">
              <div>
                <Label htmlFor="end">Endereço</Label>
                <Input id="end" value={endereco} maxLength={LIMITES.endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, complemento" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  {/* T-028 vai preencher cidade e estado a partir do CEP. O gancho
                      é o `onValor`: com 8 dígitos, consultar e preencher. */}
                  <CampoMascarado id="cep" mascara="cep" valor={cep} onValor={setCep} placeholder="00000-000" />
                </div>
                <div>
                  <Label htmlFor="cid">Cidade</Label>
                  <Input id="cid" value={cidade} maxLength={LIMITES.cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Palmas" />
                </div>
                <div>
                  <Label htmlFor="uf">Estado</Label>
                  <Select id="uf" options={ESTADOS} value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="UF" />
                </div>
              </div>
            </StepWrap>
          )}

          {step === 3 && (
            <StepWrap title="Perfil público do estabelecimento." desc="É o que responsáveis veem ao encontrar o estabelecimento na busca.">
              <div className="mb-4">
                <Label>Logo do estabelecimento</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-corpo-texto/60">
                  {/* Logo está fora dos 3 meses (R-019): não existe coluna em
                      `clinic_profiles` nem bucket público. Volta na F4/S7. */}
                  <p className="text-sm">Upload de logo chega em breve</p>
                </div>
              </div>
              <div className="mb-4">
                <Label htmlFor="sobre">Sobre o estabelecimento</Label>
                <textarea
                  id="sobre"
                  rows={5}
                  maxLength={LIMITES.sobre}
                  value={sobre}
                  onChange={(e) => setSobre(e.target.value)}
                  placeholder="História, estrutura e diferenciais do estabelecimento."
                  className="w-full rounded-2xl bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition resize-none"
                />
                <div className="text-right text-[11px] text-corpo-texto/60 mt-1">{sobre.length} / {LIMITES.sobre}</div>
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
                <CampoMascarado id="wpp" mascara="telefone" valor={whatsapp} onValor={setWhatsapp} placeholder="(00) 00000-0000" aria-describedby="wpp-nota" />
                <p id="wpp-nota" className="mt-1.5 text-[12px] text-corpo-texto/70 leading-relaxed">
                  Precisa ser um número com DDD que receba mensagem no WhatsApp.
                  Números 0800 não servem. Guardamos só os dígitos, e o número
                  nunca aparece na página: ele é revelado quando o responsável
                  clica para falar com vocês.
                </p>
              </div>
            </StepWrap>
          )}

          {step === 4 && (
            <StepWrap
              title={emRevisao ? "Revise e salve." : "Quase lá: validação."}
              desc={
                emRevisao
                  ? "Ao salvar, os dados são atualizados e o cadastro segue na fila de validação da equipe Vetria. Vocês recebem um email quando o estabelecimento for aprovado."
                  : "Ao concluir, enviamos o cadastro pra validação da equipe Vetria. Vocês recebem um email quando o estabelecimento for aprovado."
              }
            >
              {/* T-008 — o envio de verdade. Os bytes vão por POST para
                  `/api/documentos/upload`, que confere sessão, role e status,
                  lê o tipo real pelos primeiros bytes, gera o nome do arquivo e
                  só então grava a linha. Nada disso acontece aqui no cliente. */}
              <EnvioDeDocumento
                enviadoEmInicial={documentoEnviadoEm}
                onEnviado={setDocEnviadoEm}
                descricao="Envie o documento que comprova o estabelecimento. É por ele que a equipe confere o CNPJ e a razão social informados."
                exemplos="Cartão CNPJ, contrato social ou alvará de funcionamento."
              />
              <div className="flex gap-3 rounded-xl bg-fundo-destaque p-4">
                <span className="text-principal shrink-0 mt-0.5">
                  <LockIcon />
                </span>
                <p className="text-[13px] text-corpo-texto leading-relaxed">
                  <strong className="text-titulo">Dados protegidos pela LGPD.</strong>{" "}
                  CNPJ, razão social e o nome do responsável técnico ficam
                  guardados fora do perfil público e são usados apenas na
                  validação do estabelecimento.
                </p>
              </div>
            </StepWrap>
          )}

          {/* Erro honesto: o que o servidor recusou, dito com todas as letras.
              Nada é perdido, o estado do formulário continua na tela. */}
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

          <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-gray-100">
            <span className="text-[12px] text-corpo-texto/70">
              {step === 4 && !temDocumento
                ? "Falta enviar o documento do estabelecimento."
                : (motivoParado ?? `${step * 25}% concluído`)}
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
                  disabled={motivoParado !== null}
                  title={motivoParado ?? undefined}
                  className="inline-flex items-center gap-2 rounded-pill bg-principal text-white px-6 py-2.5 font-semibold text-sm hover:bg-[#142E33] transition disabled:opacity-50"
                >
                  Continuar
                  <ArrowRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={isPending || !temDocumento}
                  aria-busy={isPending}
                  title={
                    temDocumento
                      ? undefined
                      : "Envie o documento do estabelecimento para concluir."
                  }
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
