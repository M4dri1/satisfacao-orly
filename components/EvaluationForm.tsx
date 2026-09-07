"use client";

import { FormEvent, useState } from "react";
import { StarRating } from "./StarRating";
import { NpsScale } from "./NpsScale";
import { BrandMark } from "./BrandMark";

type EvaluationFormProps = {
  mesa?: number | null;
};

type FormState = {
  produtos: number | null;
  atendimento: number | null;
  limpeza: number | null;
  espera: number | null;
  nps: number | null;
  comentario: string;
  nome: string;
  contato: string;
  website: string;
};

const initialState: FormState = {
  produtos: null,
  atendimento: null,
  limpeza: null,
  espera: null,
  nps: null,
  comentario: "",
  nome: "",
  contato: "",
  website: "",
};

export function EvaluationForm({ mesa = null }: EvaluationFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (
      form.produtos === null ||
      form.atendimento === null ||
      form.limpeza === null ||
      form.espera === null ||
      form.nps === null
    ) {
      setError("Preencha todas as notas antes de enviar.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesa,
          produtos: form.produtos,
          atendimento: form.atendimento,
          limpeza: form.limpeza,
          espera: form.espera,
          nps: form.nps,
          comentario: form.comentario,
          nome: form.nome,
          contato: form.contato,
          website: form.website,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Não foi possível enviar sua avaliação.");
        return;
      }

      setDone(true);
    } catch {
      setError("Falha de conexão. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="orly-card space-y-4 p-8 text-center sm:p-10">
        <BrandMark size="md" align="center" />
        <div className="space-y-2 pt-2">
          <p className="brand-display text-2xl text-orly-ink">Obrigado</p>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-orly-muted">
            Sua opinião ajuda a Orly a continuar oferecendo o melhor em
            panificação e gastronomia.
          </p>
        </div>
        {mesa ? (
          <p className="text-xs font-medium tracking-wide text-orly-gold">
            Mesa {mesa}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="orly-card relative space-y-6 p-5 sm:p-7"
    >
      <div className="space-y-3 border-b border-orly-line pb-5">
        <BrandMark
          size="sm"
          subtitle={
            mesa
              ? `Mesa ${mesa} · Paes Leme, 88`
              : "Paes Leme, 88 · Marília"
          }
        />
        <div className="pt-1">
          <h1 className="brand-display text-2xl text-orly-ink sm:text-[1.65rem]">
            Como foi sua visita?
          </h1>
          <p className="mt-1 text-sm text-orly-muted">
            Leva cerca de 30 segundos
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <StarRating
          label="Qualidade dos produtos"
          value={form.produtos}
          onChange={(value) => setForm((prev) => ({ ...prev, produtos: value }))}
        />
        <StarRating
          label="Atendimento"
          value={form.atendimento}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, atendimento: value }))
          }
        />
        <StarRating
          label="Limpeza e organização"
          value={form.limpeza}
          onChange={(value) => setForm((prev) => ({ ...prev, limpeza: value }))}
        />
        <StarRating
          label="Tempo de espera"
          value={form.espera}
          onChange={(value) => setForm((prev) => ({ ...prev, espera: value }))}
        />
      </div>

      <div className="rounded-xl bg-orly-cream/60 p-4">
        <NpsScale
          value={form.nps}
          onChange={(value) => setForm((prev) => ({ ...prev, nps: value }))}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comentario" className="text-sm font-medium text-orly-ink">
          Comentário{" "}
          <span className="font-normal text-orly-muted">(opcional)</span>
        </label>
        <textarea
          id="comentario"
          rows={3}
          maxLength={1000}
          value={form.comentario}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, comentario: event.target.value }))
          }
          placeholder="O que mais gostou? O que podemos melhorar?"
          className="orly-input resize-none"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-dashed border-orly-sand bg-orly-paper/50 p-4">
        <p className="text-xs leading-relaxed text-orly-muted">
          Opcional — deixe um contato se quiser que a Orly retorne
        </p>
        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-sm font-medium text-orly-ink">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            maxLength={120}
            value={form.nome}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, nome: event.target.value }))
            }
            placeholder="Seu nome"
            className="orly-input"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contato" className="text-sm font-medium text-orly-ink">
            Contato
          </label>
          <input
            id="contato"
            type="text"
            maxLength={120}
            value={form.contato}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, contato: event.target.value }))
            }
            placeholder="WhatsApp, telefone ou e-mail"
            className="orly-input"
            autoComplete="tel"
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, website: event.target.value }))
          }
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button type="submit" className="orly-btn w-full py-3.5" disabled={loading}>
        {loading ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
