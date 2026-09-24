"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

// O botão trava enquanto o pedido está no ar: o `token_hash` é de uso único,
// e um segundo clique chegaria ao servidor com o link já gasto e mandaria a
// pessoa para a tela de "link expirado" depois de ter dado certo.
export function BotaoContinuar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="cursor-pointer">
      Continuar
    </Button>
  );
}
