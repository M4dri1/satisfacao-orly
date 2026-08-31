"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type QrCard = {
  mesa: number;
  url: string;
  qr: string;
};

export function QrPrintPanel() {
  const [fromMesa, setFromMesa] = useState(1);
  const [toMesa, setToMesa] = useState(12);
  const [cards, setCards] = useState<QrCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateCards(start = fromMesa, end = toMesa) {
    setLoading(true);
    setError(null);
    try {
      const rangeStart = Math.min(start, end);
      const rangeEnd = Math.max(start, end);
      const nextCards: QrCard[] = [];

      for (let mesa = rangeStart; mesa <= rangeEnd; mesa += 1) {
        const response = await fetch(`/api/qr?mesa=${mesa}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Falha ao gerar QR.");
        }
        nextCards.push({
          mesa,
          url: payload.url,
          qr: payload.qr,
        });
      }

      setCards(nextCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar QRs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generateCards(1, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold">QR Code por mesa</h1>
          <p className="text-sm text-gray-600">Gere e imprima os cartões.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-secondary">
            Voltar
          </Link>
          <button
            type="button"
            className="btn"
            onClick={() => window.print()}
            disabled={cards.length === 0}
          >
            Imprimir
          </button>
        </div>
      </div>

      <section className="card no-print mb-6 grid gap-3 sm:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Mesa inicial</span>
          <input
            type="number"
            min={1}
            max={200}
            value={fromMesa}
            onChange={(event) => setFromMesa(Number(event.target.value))}
            className="input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Mesa final</span>
          <input
            type="number"
            min={1}
            max={200}
            value={toMesa}
            onChange={(event) => setToMesa(Number(event.target.value))}
            className="input"
          />
        </label>
        <div className="flex items-end sm:col-span-2">
          <button
            type="button"
            className="btn w-full"
            onClick={() => generateCards()}
            disabled={loading}
          >
            {loading ? "Gerando..." : "Gerar"}
          </button>
        </div>
      </section>

      {error ? <p className="no-print mb-4 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.mesa}
            className="break-inside-avoid rounded-lg border border-gray-200 bg-white p-4 text-center"
          >
            <p className="font-semibold">Orly Bagueteria</p>
            <p className="mt-1 text-sm text-gray-600">Avalie sua visita</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.qr}
              alt={`QR Code mesa ${card.mesa}`}
              className="mx-auto mt-3 h-36 w-36 border border-gray-200 bg-white p-1"
            />
            <p className="mt-3 font-medium">Mesa {card.mesa}</p>
            <p className="mt-1 break-all text-[10px] text-gray-500">{card.url}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
