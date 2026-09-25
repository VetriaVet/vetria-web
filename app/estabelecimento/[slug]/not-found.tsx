import { PerfilNaoEncontrado } from "@/components/publico/Perfil";

// Slug inexistente e conta fora do ar caem aqui com a mesma frase (a RLS não
// distingue, e a tela também não deve distinguir).
export default function NaoEncontrado() {
  return <PerfilNaoEncontrado />;
}
