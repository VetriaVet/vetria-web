import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import {
  EXPERIENCIA,
  TITULOS,
} from "@/app/app/veterinario/onboarding/campos";
import BotaoDocumento from "../BotaoDocumento";
import {
  PERSONA_LABEL,
  carregarCadastro,
  formatarCrmv,
  formatarDataHora,
  formatarLocal,
  formatarTamanho,
  texto,
  type Cadastro,
} from "../fila";

export const metadata = { title: "Validação" };

// T-023 — O DETALHE DE UMA CONTA DA FILA.
//
// ⚠️ AQUI VIVE DADO PRIVADO DE TERCEIRO (DL-053 / matriz §3): CNPJ, razão
// social, responsável técnico, WhatsApp e telefone. A matriz §5 dá ao admin e
// ao master o direito de ver isso na fila de validação, e é a razão de esta
// tela existir: sem CRMV e sem CNPJ não há o que validar.
//
// O que NÃO acontece com esse dado, e não pode passar a acontecer:
//   · não vai para log nenhum (ver `registrarErro` em `../fila.ts`, cujo tipo
//     recusa `details` de propósito, SEC-056)
//   · não vai para URL nem para query string. A rota carrega um uuid
//   · WhatsApp aparece como TEXTO, nunca como link `wa.me`. O link no HTML é
//     a base de telefones indo embora com quem raspar a página, e o DL-047 diz
//     que número é revelado por EVENTO DE SERVIDOR, não por HTML
//   · o caminho do documento no bucket não chega ao navegador
//
// ⚠️ É UMA CONTA POR VEZ. O dado privado não aparece na lista: vinte linhas de
// HTML com CNPJ e telefone é uma superfície que ninguém pediu.
//
// ⚠️ NÃO HÁ BOTÃO DE APROVAR NEM DE REPROVAR. É a T-024. Botão morto ensina o
// operador a clicar em algo que não acontece, e é pior que botão nenhum.

type Props = { params: Promise<{ conta: string }> };

export default async function AdminValidacaoDetalhePage({ params }: Props) {
  await requireAdmin();

  const { conta } = await params;
  const cadastro = await carregarCadastro(conta);

  // `null` cobre, de propósito, quatro casos com a mesma resposta: uuid
  // inválido, conta inexistente, conta que não é `vet` nem `clinic`, e conta
  // que a RLS não entrega a quem pediu. Uma tela de "não encontrado" que não
  // distingue esses casos é uma tela que não conta a ninguém o que existe no
  // banco.
  if (!cadastro) notFound();

  const nome = nomeExibido(cadastro);
  const naFila = cadastro.status === "pending_validation";

  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10">
        <Link
          href="/admin/validacoes"
          className="text-[12px] text-white/50 hover:text-white transition no-underline"
        >
          ← Voltar para a fila
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <h1 className="font-bold text-lg text-white m-0">{nome}</h1>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 border border-white/15 rounded-pill px-2 py-0.5">
            {PERSONA_LABEL[cadastro.role]}
          </span>
        </div>
      </header>

      <div className="p-6 max-w-[900px] mx-auto flex flex-col gap-4">
        {cadastro.erroParcial && (
          <Aviso tom="erro">{cadastro.erroParcial}</Aviso>
        )}

        {!naFila && (
          <Aviso tom="atencao">
            Esta conta não está mais na fila. O status dela agora é{" "}
            <b>{cadastro.status}</b>
            {cadastro.statusMotivo ? `, com o motivo: ${cadastro.statusMotivo}` : ""}.
          </Aviso>
        )}

        <Secao titulo="Documento enviado">
          <div className="flex flex-col gap-3">
            <BotaoDocumento
              dono={cadastro.id}
              temDocumento={Boolean(cadastro.privado?.documento_enviado_em)}
            />
            <Campos>
              <Campo
                rotulo="Enviado em"
                valor={formatarDataHora(cadastro.privado?.documento_enviado_em ?? null)}
              />
              <Campo
                rotulo="Tamanho"
                valor={formatarTamanho(cadastro.privado?.documento_tamanho ?? null)}
              />
              <Campo
                rotulo="Identidade dos bytes (sha256)"
                valor={texto(cadastro.privado?.documento_hash)}
                largo
                mono
              />
            </Campos>
          </div>
        </Secao>

        {cadastro.role === "vet" ? (
          <CadastroDoVeterinario cadastro={cadastro} />
        ) : (
          <CadastroDoEstabelecimento cadastro={cadastro} />
        )}

        <Secao
          titulo="Identificação e contato"
          nota="Dado privado. Visível para admin e master (matriz §5), nunca para o público."
        >
          <Campos>
            {cadastro.role === "clinic" && (
              <>
                <Campo rotulo="CNPJ" valor={texto(cadastro.privado?.cnpj)} />
                <Campo
                  rotulo="Razão social"
                  valor={texto(cadastro.privado?.razao_social)}
                />
                <Campo
                  rotulo="Responsável técnico"
                  valor={texto(cadastro.privado?.responsavel_tecnico)}
                  largo
                />
              </>
            )}
            {/* Texto, nunca link. Ver o cabeçalho deste arquivo. */}
            <Campo rotulo="WhatsApp" valor={texto(cadastro.privado?.whatsapp)} />
            <Campo rotulo="Telefone" valor={texto(cadastro.privado?.telefone)} />
            <Campo
              rotulo="Email de contato"
              valor={texto(cadastro.privado?.email_contato)}
              largo
            />
          </Campos>
        </Secao>

        <Secao titulo="A conta">
          <Campos>
            <Campo rotulo="Nome na conta" valor={cadastro.fullName} />
            <Campo rotulo="Status" valor={cadastro.status} />
            <Campo rotulo="Conta criada em" valor={formatarDataHora(cadastro.criadoEm)} />
            <Campo
              rotulo="Cadastro atualizado em"
              valor={formatarDataHora(cadastro.atualizadoEm)}
            />
            {cadastro.statusMotivo && (
              <Campo rotulo="Motivo do status atual" valor={cadastro.statusMotivo} largo />
            )}
          </Campos>
        </Secao>

        <p className="text-[12px] text-white/40 m-0">
          Por enquanto esta tela só lê. Aprovar e reprovar ainda não existem no
          produto, e nenhuma ação desta página muda o status de ninguém.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function nomeExibido(cadastro: Cadastro): string {
  const doPerfil =
    cadastro.role === "vet"
      ? texto(cadastro.vet?.nome_exibicao)
      : texto(cadastro.clinic?.nome_fantasia);

  return doPerfil ?? cadastro.fullName ?? "Cadastro sem nome preenchido";
}

/** Os valores de `titulo` e `experiencia` são códigos (`mv`, `5a10`), não
 *  texto. A lista de rótulos é importada de `campos.ts`, que é a MESMA fonte
 *  que o formulário e a Server Action usam. Uma segunda cópia aqui é como o
 *  R-039 nasceu. */
function rotuloDaOpcao(
  opcoes: { value: string; label: string }[],
  valor: string | null | undefined
): string | null {
  const limpo = texto(valor);
  if (!limpo) return null;
  return opcoes.find((o) => o.value === limpo)?.label ?? limpo;
}

function CadastroDoVeterinario({ cadastro }: { cadastro: Cadastro }) {
  const vet = cadastro.vet;

  if (!vet) {
    return (
      <Secao titulo="Cadastro profissional">
        <p className="text-[13px] text-white/60 m-0">
          Esta conta não tem linha em vet_profiles. O cadastro não foi preenchido
          ou não chegou ao banco.
        </p>
      </Secao>
    );
  }

  const modos = [
    vet.atende_presencial ? "Presencial" : null,
    vet.atende_domiciliar ? "Domiciliar" : null,
    vet.atende_teleorientacao ? "Teleorientação" : null,
  ].filter(Boolean) as string[];

  return (
    <Secao titulo="Cadastro profissional">
      <Campos>
        <Campo rotulo="Nome de exibição" valor={texto(vet.nome_exibicao)} />
        <Campo rotulo="Título" valor={rotuloDaOpcao(TITULOS, vet.titulo)} />
        <Campo rotulo="CRMV" valor={formatarCrmv(vet.crmv, vet.crmv_uf)} />
        <Campo
          rotulo="Experiência"
          valor={rotuloDaOpcao(EXPERIENCIA, vet.experiencia)}
        />
        <Campo rotulo="Cidade e estado" valor={formatarLocal(vet.cidade, vet.estado)} />
        <Campo rotulo="Bairro" valor={texto(vet.bairro)} />
        <Campo
          rotulo="Especialidades"
          valor={(vet.especialidades ?? []).join(" · ") || null}
          largo
        />
        <Campo
          rotulo="Formas de atendimento"
          valor={modos.join(" · ") || null}
          largo
        />
        <Campo rotulo="Bio pública" valor={texto(vet.bio)} largo />
      </Campos>
    </Secao>
  );
}

function CadastroDoEstabelecimento({ cadastro }: { cadastro: Cadastro }) {
  const clinic = cadastro.clinic;

  if (!clinic) {
    return (
      <Secao titulo="Cadastro do estabelecimento">
        <p className="text-[13px] text-white/60 m-0">
          Esta conta não tem linha em clinic_profiles. O cadastro não foi
          preenchido ou não chegou ao banco.
        </p>
      </Secao>
    );
  }

  return (
    <Secao titulo="Cadastro do estabelecimento">
      <Campos>
        <Campo rotulo="Nome fantasia" valor={texto(clinic.nome_fantasia)} />
        <Campo
          rotulo="Cidade e estado"
          valor={formatarLocal(clinic.cidade, clinic.estado)}
        />
        <Campo rotulo="Endereço" valor={texto(clinic.endereco)} largo />
        <Campo rotulo="CEP" valor={texto(clinic.cep)} />
        {/* ⚠️ R-039 / T-017 — `clinic_profiles.site` é URL escrita pelo dono da
            conta e NÃO tem validação de esquema em lugar nenhum: `javascript:`
            e `data:` passam hoje. Enquanto a constraint não existir, este valor
            é TEXTO nesta tela. Transformar em `href` aqui seria abrir, dentro
            do painel administrativo, a porta que a T-017 existe para fechar. */}
        <Campo rotulo="Site informado (não clicável)" valor={texto(clinic.site)} />
        <Campo
          rotulo="Serviços"
          valor={(clinic.servicos ?? []).join(" · ") || null}
          largo
        />
        <Campo rotulo="Sobre" valor={texto(clinic.sobre)} largo />
      </Campos>
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Blocos visuais. Dark admin, mesma linguagem das outras telas de `/admin`.
// ---------------------------------------------------------------------------

function Secao({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-white/[0.06] bg-[#1A2A2D] overflow-hidden">
      <div className="px-[18px] py-3.5 border-b border-white/[0.06]">
        <div className="font-bold text-sm text-white">{titulo}</div>
        {nota && <div className="text-[12px] text-white/50">{nota}</div>}
      </div>
      <div className="p-[18px]">{children}</div>
    </section>
  );
}

function Campos({ children }: { children: React.ReactNode }) {
  return <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5 m-0">{children}</dl>;
}

function Campo({
  rotulo,
  valor,
  largo = false,
  mono = false,
}: {
  rotulo: string;
  valor: string | null;
  largo?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-2" : undefined}>
      <dt className="text-[11px] uppercase tracking-[0.08em] text-white/40 mb-1">
        {rotulo}
      </dt>
      {/* Campo vazio é dito, não escondido: o que falta no cadastro é metade da
          decisão de quem valida. */}
      <dd
        className={`m-0 text-[13px] leading-relaxed break-words ${
          valor ? "text-white/85" : "text-white/35 italic"
        } ${mono && valor ? "font-mono text-[11px]" : ""}`}
      >
        {valor ?? "não preenchido"}
      </dd>
    </div>
  );
}

function Aviso({
  tom,
  children,
}: {
  tom: "erro" | "atencao";
  children: React.ReactNode;
}) {
  const cor =
    tom === "erro"
      ? "border-red-500/30 bg-red-500/[0.08] text-red-200"
      : "border-amber-300/30 bg-amber-300/[0.08] text-amber-100";

  return <div className={`rounded-md border p-4 text-[13px] ${cor}`}>{children}</div>;
}
