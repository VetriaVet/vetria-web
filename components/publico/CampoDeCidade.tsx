"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { CampoSelecao, classeDoCampoDeTexto } from "./CampoSelecao";

// Cidade + estado da /buscar, com sugestões da lista do IBGE
// (GET /api/cidades, que lê `sugerirCidades`).
//
// Funciona SEM JavaScript e sem a rota: são dois campos comuns do formulário
// GET (`cidade` e `uf`). O JavaScript só acrescenta a lista de sugestões; ao
// escolher uma, o nome vai para `cidade` e a sigla para `uf`, que é a forma
// de a busca nunca cair em "cidade com esse nome em mais de um estado".
//
// Acessível como combobox (padrão ARIA 1.2): setas percorrem, Enter escolhe,
// Esc fecha, e o leitor de tela ouve quantas sugestões apareceram.

type Sugestao = { nome: string; uf: string; slug: string };

const ESPERA_MS = 220;

export function CampoDeCidade({
  cidadeInicial,
  ufInicial,
  ufs,
}: {
  cidadeInicial: string;
  ufInicial: string;
  ufs: readonly string[];
}) {
  const id = useId();
  const idCidade = `${id}-cidade`;
  const idUf = `${id}-uf`;
  const idLista = `${id}-lista`;

  const [texto, setTexto] = useState(cidadeInicial);
  const [uf, setUf] = useState(ufInicial);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);

  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedido = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (relogio.current) clearTimeout(relogio.current);
      pedido.current?.abort();
    },
    []
  );

  function procurar(valor: string, estado: string) {
    if (relogio.current) clearTimeout(relogio.current);
    pedido.current?.abort();

    const limpo = valor.trim();
    if (limpo.length < 2 || limpo.length > 60) {
      setSugestoes([]);
      setAberto(false);
      setAtivo(-1);
      return;
    }

    relogio.current = setTimeout(async () => {
      const controle = new AbortController();
      pedido.current = controle;
      try {
        const qs = new URLSearchParams({ q: limpo });
        if (estado) qs.set("uf", estado);
        const r = await fetch(`/api/cidades?${qs}`, { signal: controle.signal });
        if (!r.ok) throw new Error(String(r.status));
        const corpo = (await r.json()) as { cidades?: Sugestao[] };
        const lista = Array.isArray(corpo.cidades) ? corpo.cidades : [];
        setSugestoes(lista);
        setAberto(lista.length > 0);
        setAtivo(-1);
      } catch {
        // Sem sugestão, o campo continua sendo um campo de texto: a busca
        // confere o nome no servidor e avisa se não achar.
        if (!controle.signal.aborted) {
          setSugestoes([]);
          setAberto(false);
        }
      }
    }, ESPERA_MS);
  }

  function escolher(s: Sugestao) {
    if (relogio.current) clearTimeout(relogio.current);
    pedido.current?.abort();
    setTexto(s.nome);
    setUf(s.uf);
    setAberto(false);
    setAtivo(-1);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (!aberto || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => (i + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
    } else if (e.key === "Enter" && ativo >= 0) {
      // Enter numa sugestão escolhe; Enter sem sugestão marcada envia a busca.
      e.preventDefault();
      escolher(sugestoes[ativo]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setAberto(false);
      setAtivo(-1);
    }
  }

  const mostrarLista = aberto && sugestoes.length > 0;

  return (
    <div className="grid grid-cols-[1fr_7.5rem] gap-3">
      <div className="relative">
        <Label htmlFor={idCidade}>Cidade</Label>
        <div className="relative">
          <MapPin
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-corpo-texto"
          />
          <input
            id={idCidade}
            name="cidade"
            type="text"
            value={texto}
            maxLength={60}
            autoComplete="off"
            placeholder="Ex.: Goiânia"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={mostrarLista}
            aria-controls={idLista}
            aria-activedescendant={mostrarLista && ativo >= 0 ? `${idLista}-${ativo}` : undefined}
            onChange={(e) => {
              setTexto(e.target.value);
              procurar(e.target.value, uf);
            }}
            onKeyDown={aoTeclar}
            onBlur={() => setAberto(false)}
            onFocus={() => sugestoes.length > 0 && setAberto(true)}
            className={`${classeDoCampoDeTexto} pl-10`}
          />
        </div>

        <ul
          id={idLista}
          role="listbox"
          aria-label="Cidades sugeridas"
          hidden={!mostrarLista}
          className="absolute left-0 right-0 z-20 mt-1.5 max-h-72 overflow-auto rounded-2xl border border-neutro-border bg-white py-1.5 shadow-lg"
        >
          {sugestoes.map((s, i) => (
            <li
              key={s.slug}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === ativo}
              // mousedown, e não click: o click chega depois do blur, que já
              // fechou a lista.
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(s);
              }}
              onMouseEnter={() => setAtivo(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-[14px] ${
                i === ativo ? "bg-fundo-destaque text-principal" : "text-titulo"
              }`}
            >
              <span>{s.nome}</span>
              <span className="text-[12px] font-semibold text-corpo-texto">{s.uf}</span>
            </li>
          ))}
        </ul>

        <p aria-live="polite" className="sr-only">
          {mostrarLista
            ? sugestoes.length === 1
              ? "1 cidade sugerida. Use as setas para escolher."
              : `${sugestoes.length} cidades sugeridas. Use as setas para escolher.`
            : ""}
        </p>
      </div>

      <div>
        <Label htmlFor={idUf}>Estado</Label>
        <CampoSelecao
          id={idUf}
          name="uf"
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          todas="Todos"
          opcoes={ufs.map((u) => ({ value: u, label: u }))}
        />
      </div>
    </div>
  );
}
