// npm run banco -- <teste|producao> <arquivo.sql> [--so N] [--aplicar-em-producao]
//
// Roda um arquivo SQL do repo direto no banco, sem copiar e colar no SQL
// Editor. Cada bloco "CONSULTA N", "QUERY N" ou "SONDA N" vira uma execucao
// separada, e o resultado de cada um sai na tela e fica salvo em
// supabase/backups/ (pasta no .gitignore).
//
// Conexao: .env.banco.local (no .gitignore), com a URI do "Session pooler"
// de cada projeto (Supabase > Connect):
//   BANCO_TESTE_URL=postgresql://postgres.<ref-do-vetria-e2e>:<senha>@...
//   BANCO_PRODUCAO_URL=postgresql://postgres.<ref-de-producao>:<senha>@...
//
// Travas:
//   - a URL de cada alvo tem que conter o ref certo, senao recusa;
//   - arquivo de supabase/migrations/ em producao exige --aplicar-em-producao
//     (o semaforo continua: migration em producao so com o Elber presente);
//   - migration roda inteira numa conexao: se quebrar no meio, o begin/commit
//     do proprio arquivo desfaz tudo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve, sep } from "node:path";
import pg from "pg";

const REFS = { teste: "uckvgeibxfzmyytqrmae", producao: "gdqnnrozbxrtaaquarnd" };
const VARIAVEL = { teste: "BANCO_TESTE_URL", producao: "BANCO_PRODUCAO_URL" };

function parar(msg) {
  console.error(`\nPAREI: ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const alvo = args[0];
const arquivo = args[1];
const so = args.includes("--so") ? args[args.indexOf("--so") + 1] : null;
const autorizado = args.includes("--aplicar-em-producao");

if (!REFS[alvo] || !arquivo) {
  parar("uso: npm run banco -- <teste|producao> <arquivo.sql> [--so N] [--aplicar-em-producao]");
}
if (!existsSync(".env.banco.local")) parar("falta o arquivo .env.banco.local na pasta do projeto.");
process.loadEnvFile(".env.banco.local");

const url = process.env[VARIAVEL[alvo]] ?? "";
if (!url) parar(`${VARIAVEL[alvo]} esta vazia no .env.banco.local.`);
const outro = alvo === "teste" ? REFS.producao : REFS.teste;
if (!url.includes(REFS[alvo]) || url.includes(outro)) {
  parar(`${VARIAVEL[alvo]} nao aponta para o projeto de ${alvo}.`);
}

const caminho = resolve(arquivo);
if (!existsSync(caminho)) parar(`nao achei ${arquivo}.`);
const ehMigration = caminho.includes(`${sep}supabase${sep}migrations${sep}`);
if (ehMigration && alvo === "producao" && !autorizado) {
  parar("isto e uma MIGRATION em PRODUCAO. So roda com --aplicar-em-producao, com o Elber presente.");
}

// Separa o arquivo em blocos pelo titulo. Migration vai inteira.
const TITULO = /^--\s*(?:#+\s*)?(CONSULTA|QUERY|SONDA)\s+(\d+)\b(.*)$/;
const sql = readFileSync(caminho, "utf8");
let blocos = [];
if (ehMigration) {
  blocos = [{ nome: basename(caminho), numero: null, sql }];
} else {
  let atual = null;
  for (const linha of sql.split(/\r?\n/)) {
    const m = linha.match(TITULO);
    if (m) {
      atual = {
        nome: `${m[1]} ${m[2]}${m[3].replace(/[#]+/g, "").trimEnd()}`,
        numero: m[2],
        sql: "",
      };
      blocos.push(atual);
    } else if (atual) {
      atual.sql += linha + "\n";
    }
  }
  const temCodigo = (s) =>
    s.split("\n").some((l) => l.trim() && !l.trim().startsWith("--"));
  blocos = blocos.filter((b) => temCodigo(b.sql));
  if (!blocos.length) blocos = [{ nome: basename(caminho), numero: null, sql }];
}
if (so) blocos = blocos.filter((b) => b.numero === so);
if (!blocos.length) parar("nenhum bloco para rodar.");

function tabela(res) {
  if (!res.fields?.length) return `(${res.command ?? "ok"}${res.rowCount != null ? `, ${res.rowCount} linha(s)` : ""})`;
  if (!res.rows.length) return "(zero linhas)";
  const cols = res.fields.map((f) => f.name);
  const txt = (v) => (v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v));
  // Coluna estreita fica em tabela; texto longo (corpo de funcao) vira lista.
  const largo = res.rows.some((r) => cols.some((c) => txt(r[c]).length > 120));
  if (largo) {
    return res.rows
      .map((r, i) => `[${i + 1}]\n` + cols.map((c) => `  ${c}: ${txt(r[c])}`).join("\n"))
      .join("\n");
  }
  const w = cols.map((c) => Math.max(c.length, ...res.rows.map((r) => txt(r[c]).length)));
  const lin = (vals) => vals.map((v, i) => v.padEnd(w[i])).join(" | ");
  return [lin(cols), w.map((n) => "-".repeat(n)).join("-+-"), ...res.rows.map((r) => lin(cols.map((c) => txt(r[c]))))].join("\n");
}

const cliente = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  application_name: "vetria-npm-run-banco",
});

const saida = [];
const registrar = (s) => {
  console.log(s);
  saida.push(s);
};

const agora = new Date();
const carimbo = agora.toISOString().replace(/[:]/g, "-").slice(0, 19);
registrar(`# ${alvo.toUpperCase()} · ${arquivo} · ${agora.toISOString()}`);

let falhou = false;
try {
  await cliente.connect();
  const quem = await cliente.query("select current_database() as banco, current_user as papel");
  registrar(`Conectado: banco=${quem.rows[0].banco} papel=${quem.rows[0].papel}\n`);
  for (const b of blocos) {
    registrar(`=== ${b.nome} ===`);
    try {
      const r = await cliente.query(b.sql);
      const lista = Array.isArray(r) ? r : [r];
      const comLinhas = lista.filter((x) => x.fields?.length);
      const mostrar = comLinhas.length ? comLinhas : lista.slice(-1);
      for (const x of mostrar) registrar(tabela(x));
    } catch (e) {
      falhou = true;
      registrar(`ERRO: ${e.message}${e.detail ? `\n  detalhe: ${e.detail}` : ""}${e.hint ? `\n  dica: ${e.hint}` : ""}`);
      if (ehMigration) registrar("A migration foi DESFEITA inteira (nada ficou aplicado).");
      // bloco que falhou deixa a transacao abortada: limpa antes do proximo
      await cliente.query("rollback").catch(() => {});
    }
    registrar("");
  }
} catch (e) {
  falhou = true;
  registrar(`ERRO de conexao: ${e.message}`);
} finally {
  await cliente.end().catch(() => {});
}

mkdirSync("supabase/backups", { recursive: true });
const destino = `supabase/backups/${carimbo}-${alvo}-${basename(arquivo, ".sql")}${so ? `-${so}` : ""}.txt`;
writeFileSync(destino, saida.join("\n") + "\n", "utf8");
console.log(`Salvo em ${destino}`);
process.exit(falhou ? 1 : 0);
