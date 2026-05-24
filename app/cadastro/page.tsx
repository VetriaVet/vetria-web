import { redirect } from "next/navigation";

// `/cadastro` = entrada do TUTOR (lado HUMANO / consumidor).
//
// Decisão de arquitetura (separação tipo Doctoralia): o tutor está com pressa
// (pet doente) → funil direto, SEM escolha de role. Por isso `/cadastro` manda
// reto pro form do tutor.
//
// Vet e clínica são o lado B2B/empresarial e entram por FORA do fluxo do tutor,
// pelas landings de profissionais (prototipadas) → `/cadastro/vet` e
// `/cadastro/clinica`. A escolha "vet ou clínica" vive no lado B2B, nunca aqui.
//
// (Antes esta rota era uma vitrine de 3 cards misturando tutor+vet+clínica —
// removida pra não expor o lado empresarial ao tutor.)
export default function CadastroPage() {
  redirect("/cadastro/tutor");
}
