import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // T-014 — o protótipo estático não é código do app. Está no `.gitignore`,
    // não existe no CI, e o `lucide.min.js` dele derruba o parser do ESLint
    // ("Maximum call stack size exceeded"). O erro só aparecia na máquina do
    // Elber, e escondia os erros reais no meio do ruído.
    "vetria-proto/**",
  ]),
]);

export default eslintConfig;
