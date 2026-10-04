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

const DEFAULT_LAST_MESA = 30;
const MAX_MESA = 200;

function clampMesa(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.trunc(value), 1), MAX_MESA);
}

async function fetchCards(start: number, end: number): Promise<QrCard[]> {
  const rangeStart = Math.min(clampMesa(start), clampMesa(end));
  const rangeEnd = Math.max(clampMesa(start), clampMesa(end));
  const mesas = Array.from(
    { length: rangeEnd - rangeStart + 1 },
    (_, index) => rangeStart + index
  );

  return Promise.all(
    mesas.map(async (mesa) => {
      const response = await fetch(`/api/qr?mesa=${mesa}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Falha ao gerar QR.");
      }
      return { mesa, url: payload.url, qr: payload.qr };
    })
  );
}

function QrCardView({ card }: { card: QrCard }) {
  return (
    <article className="break-inside-avoid rounded-2xl border border-orly-line bg-orly-paper p-6 text-center">
      <p className="brand-mark text-3xl">Orly</p>
      <p className="brand-sub mt-1">Bagueteria</p>
      <p className="mt-4 text-sm text-orly-ink">Avalie sua visita — 30 segundos</p>
      <Image
        src={card.qr}
        alt={`QR Code mesa ${card.mesa}`}
        width={160}
        height={160}
        unoptimized
        loading="eager"
        className="mx-auto mt-4 h-40 w-40 border border-orly-line bg-white p-2"
      />
      <p className="mt-4 font-display text-xl text-orly-ink">Mesa {card.mesa}</p>
      <p className="mt-1 break-all text-[10px] text-orly-muted">{card.url}</p>
    </article>
  );
}

export function QrPrintPanel() {
  const [cards, setCards] = useState<QrCard[]>([]);
  const [printCards, setPrintCards] = useState<QrCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromMesa, setFromMesa] = useState(1);
  const [toMesa, setToMesa] = useState(DEFAULT_LAST_MESA);
  const [preparing, setPreparing] = useState(false);
  const [printRequested, setPrintRequested] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchCards(1, DEFAULT_LAST_MESA)
      .then((nextCards) => {
        if (!cancelled) setCards(nextCards);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao gerar QRs.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!printRequested) return;

    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>(".print-only img")
    );
    void Promise.all(images.map((image) => image.decode().catch(() => undefined))).then(
      () => {
        setPrintRequested(false);
        window.print();
      }
    );
  }, [printRequested, printCards]);

  async function confirmPrint() {
    setPreparing(true);
    setError(null);
    try {
      const start = Math.min(clampMesa(fromMesa), clampMesa(toMesa));
      const end = Math.max(clampMesa(fromMesa), clampMesa(toMesa));
      const loaded = cards.filter((card) => card.mesa >= start && card.mesa <= end);
      const selected =
        loaded.length === end - start + 1 ? loaded : await fetchCards(start, end);
      setPrintCards(selected);
      setDialogOpen(false);
      setPrintRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao preparar impressão.");
    } finally {
      setPreparing(false);
    }
  }

  const total = Math.abs(clampMesa(toMesa) - clampMesa(fromMesa)) + 1;

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
              Um cartão por mesa. Imprima e coloque em cada mesa.
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
            onClick={() => setDialogOpen(true)}
            disabled={loading}
          >
            Imprimir
          </button>
        </div>
      </div>

      {error ? (
        <p className="no-print mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="no-print text-sm text-orly-muted">Gerando QR Codes...</p>
      ) : (
        <section className="no-print grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <QrCardView key={card.mesa} card={card} />
          ))}
        </section>
      )}

      <section className="print-only grid-cols-2 gap-4">
        {printCards.map((card) => (
          <QrCardView key={card.mesa} card={card} />
        ))}
      </section>

      {dialogOpen ? (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-dialog-title"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="orly-card w-full max-w-sm p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="print-dialog-title" className="brand-display text-xl text-orly-ink">
              Quais mesas imprimir?
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="text-orly-muted">Da mesa</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_MESA}
                  value={fromMesa}
                  onChange={(event) => setFromMesa(Number(event.target.value))}
                  className="orly-input"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-orly-muted">Até a mesa</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_MESA}
                  value={toMesa}
                  onChange={(event) => setToMesa(Number(event.target.value))}
                  className="orly-input"
                />
              </label>
            </div>
            <p className="mt-3 text-sm text-orly-muted">
              {total} {total === 1 ? "cartão" : "cartões"} para imprimir.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="orly-btn-secondary"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="orly-btn"
                onClick={confirmPrint}
                disabled={preparing}
              >
                {preparing ? "Preparando..." : "Imprimir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
