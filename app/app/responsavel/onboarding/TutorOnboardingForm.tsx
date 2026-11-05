"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { ESPECIES, IDADES, LIMITES, PESOS } from "./campos";

// T-065: a Action devolve a frase quando recusa; no sucesso ela redireciona.
// DL-016: nenhum try/catch em volta da Action.
type Props = {
  action: (formData: FormData) => Promise<{ erro: string } | void>;
};

// Verdadeiro só depois da hidratação, sem `setState` em efeito (o mesmo
// recurso de `VetOnboardingForm.tsx`).
const semAssinatura = () => () => {};

const inputClass =
  "w-full rounded-pill bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition";

const labelClass = "text-titulo font-medium text-sm mb-1.5 block";

export default function TutorOnboardingForm({ action }: Props) {
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [cidade, setCidade] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  // `data-hidratado`, o mesmo sinal dos outros onboardings (T-051): o teste
  // só envia depois que o React assumiu o formulário.
  const hidratado = useSyncExternalStore(semAssinatura, () => true, () => false);

  function handleAction(formData: FormData) {
    setMsg("");
    startTransition(async () => {
      const r = await action(formData);
      if (r && r.erro) setMsg(r.erro);
    });
  }

  return (
    // `onSubmit` e não `action`: o `action` do React 19 limpa o formulário
    // depois de cada envio, e uma recusa do servidor apagaria o que a pessoa
    // digitou. Aqui a recusa volta e os campos continuam preenchidos.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleAction(new FormData(e.currentTarget));
      }}
      data-hidratado={hidratado ? "sim" : "nao"}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="petName" className={labelClass}>
          Nome do animal
        </label>
        <input
          id="petName"
          name="petName"
          type="text"
          required
          maxLength={LIMITES.nome}
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Ex: Thor, Luna, Mel..."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="petSpecies" className={labelClass}>
          Espécie
        </label>
        <SelectPill
          id="petSpecies"
          name="petSpecies"
          required
          value={petSpecies}
          onChange={(e) => setPetSpecies(e.target.value)}
          options={ESPECIES}
        />
      </div>

      <div>
        <label htmlFor="petAge" className={labelClass}>
          Idade aproximada
        </label>
        <SelectPill
          id="petAge"
          name="petAge"
          required
          value={petAge}
          onChange={(e) => setPetAge(e.target.value)}
          options={IDADES}
        />
      </div>

      <div>
        <label htmlFor="petWeight" className={labelClass}>
          Peso aproximado
        </label>
        <SelectPill
          id="petWeight"
          name="petWeight"
          required
          value={petWeight}
          onChange={(e) => setPetWeight(e.target.value)}
          options={PESOS}
        />
      </div>

      <div>
        <label htmlFor="cidade" className={labelClass}>
          Cidade onde mora
        </label>
        <input
          id="cidade"
          name="cidade"
          type="text"
          required
          maxLength={LIMITES.cidade}
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Ex: Palmas, TO"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-[#142E33] transition disabled:opacity-50 mt-2"
      >
        {isPending ? "Salvando..." : "Concluir cadastro"}
      </button>

      {msg && (
        <p role="alert" className="text-red-600 font-medium text-sm mt-1">
          {msg}
        </p>
      )}
    </form>
  );
}

type SelectPillProps = {
  id: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
};

function SelectPill({
  id,
  name,
  required,
  value,
  onChange,
  options,
}: SelectPillProps) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-12 cursor-pointer`}
      >
        <option value="" disabled>
          Selecione...
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-corpo-texto"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
