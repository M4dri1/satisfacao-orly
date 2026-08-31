"use client";

import { FormEvent, useState } from "react";
import { StarRating } from "./StarRating";
import { NpsScale } from "./NpsScale";

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
      <div className="card space-y-2 text-center">
        <h1 className="text-xl font-semibold">Obrigado!</h1>
        <p className="text-sm text-gray-600">
          Sua avaliação foi registrada.
        </p>
        {mesa ? <p className="text-sm text-gray-500">Mesa {mesa}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-800">Orly Bagueteria</p>
        <h1 className="mt-1 text-xl font-semibold">Avaliação</h1>
        <p className="mt-1 text-sm text-gray-600">
          {mesa ? `Mesa ${mesa} · ` : ""}Leva cerca de 1 minuto
        </p>
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

      <NpsScale
        value={form.nps}
        onChange={(value) => setForm((prev) => ({ ...prev, nps: value }))}
      />

      <div className="space-y-1">
        <label htmlFor="comentario" className="text-sm font-medium">
          Comentário (opcional)
        </label>
        <textarea
          id="comentario"
          rows={3}
          maxLength={1000}
          value={form.comentario}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, comentario: event.target.value }))
          }
          className="input resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="nome" className="text-sm font-medium">
            Nome (opcional)
          </label>
          <input
            id="nome"
            type="text"
            maxLength={120}
            value={form.nome}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, nome: event.target.value }))
            }
            className="input"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contato" className="text-sm font-medium">
            Contato (opcional)
          </label>
          <input
            id="contato"
            type="text"
            maxLength={120}
            value={form.contato}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, contato: event.target.value }))
            }
            className="input"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
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

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button type="submit" className="btn w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
