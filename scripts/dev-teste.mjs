// npm run dev:teste: site local (http://localhost:3001) contra o projeto de TESTE (vetria-e2e).
//
// Por que um script e nao `node --env-file=...`: o Next abre um processo filho e
// repassa as opcoes do Node por NODE_OPTIONS, onde o Node recusa --env-file
// ("--env-file= is not allowed in NODE_OPTIONS"). Aqui o arquivo e lido antes,
// vira variavel de ambiente de verdade e tem prioridade sobre o .env.local
// (que e de PRODUCAO), inclusive os valores vazios.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const ARQUIVO = ".env.teste.local";
const REF_TESTE = "uckvgeibxfzmyytqrmae";
const REF_PRODUCAO = "gdqnnrozbxrtaaquarnd";

if (!existsSync(ARQUIVO)) {
  console.error(`Falta o arquivo ${ARQUIVO} na pasta do projeto.`);
  process.exit(1);
}
process.loadEnvFile(ARQUIVO);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (url.includes(REF_PRODUCAO) || !url.includes(REF_TESTE)) {
  console.error("RECUSADO: o .env.teste.local nao aponta para o vetria-e2e.");
  process.exit(1);
}

console.log("Banco: vetria-e2e (teste). Abra http://localhost:3001");
const filho = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-p", "3001"],
  { stdio: "inherit", env: process.env },
);
filho.on("exit", (codigo) => process.exit(codigo ?? 0));
for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, () => filho.kill(sinal));
}
