"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "./BrandMark";

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
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const nextCards: QrCard[] = [];
        for (let mesa = 1; mesa <= 12; mesa += 1) {
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
        if (!cancelled) {
          setCards(nextCards);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao gerar QRs.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell relative z-10 mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-orly-line pb-6">
        <div className="space-y-3">
          <BrandMark size="sm" />
          <div>
            <h1 className="brand-display text-2xl text-orly-ink sm:text-3xl">
              QR Code por mesa
            </h1>
            <p className="mt-1 text-sm text-orly-muted">
              Gere os cartões, imprima e coloque em cada mesa.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="orly-btn-secondary">
            Voltar ao painel
          </Link>
          <button
            type="button"
            className="orly-btn"
            onClick={() => window.print()}
            disabled={cards.length === 0}
          >
            Imprimir
          </button>
        </div>
      </div>

      <section className="orly-card no-print mb-8 grid gap-3 p-4 sm:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-orly-muted">Mesa inicial</span>
          <input
            type="number"
            min={1}
            max={200}
            value={fromMesa}
            onChange={(event) => setFromMesa(Number(event.target.value))}
            className="orly-input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-orly-muted">Mesa final</span>
          <input
            type="number"
            min={1}
            max={200}
            value={toMesa}
            onChange={(event) => setToMesa(Number(event.target.value))}
            className="orly-input"
          />
        </label>
        <div className="flex items-end sm:col-span-2">
          <button
            type="button"
            className="orly-btn w-full"
            onClick={() => generateCards()}
            disabled={loading}
          >
            {loading ? "Gerando..." : "Gerar cartões"}
          </button>
        </div>
      </section>

      {error ? (
        <p className="no-print mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.mesa}
            className="break-inside-avoid rounded-2xl border border-orly-line bg-orly-paper p-6 text-center"
          >
            <p className="brand-mark text-3xl">Orly</p>
            <p className="brand-sub mt-1">Bagueteria</p>
            <p className="mt-4 text-sm text-orly-ink">
              Avalie sua visita — 30 segundos
            </p>
            <Image
              src={card.qr}
              alt={`QR Code mesa ${card.mesa}`}
              width={160}
              height={160}
              unoptimized
              className="mx-auto mt-4 h-40 w-40 border border-orly-line bg-white p-2"
            />
            <p className="mt-4 font-display text-xl text-orly-ink">
              Mesa {card.mesa}
            </p>
            <p className="mt-1 break-all text-[10px] text-orly-muted">
              {card.url}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
