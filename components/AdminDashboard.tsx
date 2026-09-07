"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardStats } from "@/lib/stats";
import { BrandMark } from "./BrandMark";

type EvaluationRow = {
  id: string;
  mesa: number | null;
  produtos: number;
  atendimento: number;
  limpeza: number;
  espera: number;
  nps: number;
  comentario: string | null;
  nome: string | null;
  contato: string | null;
  createdAt: string;
};

type Filters = {
  mesa: string;
  minNota: string;
  from: string;
  to: string;
};

const emptyStats: DashboardStats = {
  total: 0,
  mediaGeral: 0,
  mediaProdutos: 0,
  mediaAtendimento: 0,
  mediaLimpeza: 0,
  mediaEspera: 0,
  mediaNps: 0,
  npsScore: 0,
  tendencia: [],
};

function mediaGeral(item: EvaluationRow) {
  return (
    (item.produtos + item.atendimento + item.limpeza + item.espera) / 4
  ).toFixed(1);
}

export function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    mesa: "",
    minNota: "",
    from: "",
    to: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.mesa) params.set("mesa", filters.mesa);
    if (filters.minNota) params.set("minNota", filters.minNota);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/avaliacoes${queryString ? `?${queryString}` : ""}`
        );
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        const payload = await response.json();
        if (!response.ok) {
          if (!cancelled) {
            setError(payload.error || "Erro ao carregar dados.");
          }
          return;
        }
        if (!cancelled) {
          setStats(payload.stats);
          setEvaluations(payload.evaluations);
        }
      } catch {
        if (!cancelled) {
          setError("Falha de conexão ao carregar o painel.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [queryString, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function exportCsv() {
    const url = `/api/avaliacoes?format=csv${queryString ? `&${queryString}` : ""}`;
    window.open(url, "_blank");
  }

  const maxTrend = Math.max(...stats.tendencia.map((item) => item.total), 1);

  return (
    <div className="page-shell relative z-10 mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-orly-line pb-6">
        <div className="space-y-3">
          <BrandMark size="sm" />
          <div>
            <h1 className="brand-display text-2xl text-orly-ink sm:text-3xl">
              Painel de satisfação
            </h1>
            <p className="mt-1 text-sm text-orly-muted">Olá, {adminName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/qr" className="orly-btn-secondary">
            QR das mesas
          </Link>
          <button type="button" className="orly-btn-secondary" onClick={exportCsv}>
            Exportar CSV
          </button>
          <button type="button" className="orly-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className="orly-card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span className="text-orly-muted">Mesa</span>
          <input
            type="number"
            min={1}
            value={filters.mesa}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, mesa: event.target.value }))
            }
            className="orly-input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-orly-muted">Nota mínima</span>
          <input
            type="number"
            min={1}
            max={5}
            step={0.5}
            value={filters.minNota}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, minNota: event.target.value }))
            }
            className="orly-input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-orly-muted">De</span>
          <input
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, from: event.target.value }))
            }
            className="orly-input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-orly-muted">Até</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, to: event.target.value }))
            }
            className="orly-input"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="orly-btn-secondary w-full"
            onClick={() =>
              setFilters({ mesa: "", minNota: "", from: "", to: "" })
            }
          >
            Limpar filtros
          </button>
        </div>
      </section>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Respostas", value: String(stats.total) },
          { label: "Média geral", value: stats.mediaGeral.toFixed(1) },
          { label: "NPS médio", value: stats.mediaNps.toFixed(1) },
          { label: "Score NPS", value: `${stats.npsScore}` },
        ].map((card) => (
          <div key={card.label} className="orly-card p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-orly-muted">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl tabular-nums text-orly-ink">
              {loading ? "…" : card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-6 grid gap-3 lg:grid-cols-2">
        <div className="orly-card p-4 sm:p-5">
          <h2 className="brand-display text-xl text-orly-ink">
            Médias por critério
          </h2>
          <div className="mt-5 space-y-4">
            {[
              ["Produtos", stats.mediaProdutos],
              ["Atendimento", stats.mediaAtendimento],
              ["Limpeza", stats.mediaLimpeza],
              ["Espera", stats.mediaEspera],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="tabular-nums text-orly-muted">
                    {Number(value).toFixed(1)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-orly-cream">
                  <div
                    className="h-2 rounded-full bg-orly-gold transition-all"
                    style={{ width: `${(Number(value) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orly-card p-4 sm:p-5">
          <h2 className="brand-display text-xl text-orly-ink">
            Tendência (14 dias)
          </h2>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {stats.tendencia.length === 0 ? (
              <p className="text-sm text-orly-muted">Sem dados no período.</p>
            ) : (
              stats.tendencia.map((item) => (
                <div
                  key={item.data}
                  className="flex flex-1 flex-col items-center gap-2"
                  title={`${item.data}: ${item.total} respostas, média ${item.media}`}
                >
                  <div
                    className="w-full rounded-t-md bg-orly-toast/80"
                    style={{
                      height: `${Math.max((item.total / maxTrend) * 100, 8)}%`,
                    }}
                  />
                  <span className="text-[10px] text-orly-muted">
                    {item.data.slice(5)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="orly-card overflow-hidden">
        <div className="border-b border-orly-line px-4 py-4 sm:px-5">
          <h2 className="brand-display text-xl text-orly-ink">
            Avaliações recentes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-orly-cream/70 text-orly-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Mesa</th>
                <th className="px-4 py-3 font-semibold">Média</th>
                <th className="px-4 py-3 font-semibold">NPS</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Comentário</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-orly-muted" colSpan={6}>
                    Carregando...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-orly-muted" colSpan={6}>
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              ) : (
                evaluations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-orly-line/80 align-top"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{item.mesa ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{mediaGeral(item)}</td>
                    <td className="px-4 py-3">{item.nps}</td>
                    <td className="px-4 py-3">
                      {item.nome || item.contato ? (
                        <div>
                          <div>{item.nome || "—"}</div>
                          {item.contato ? (
                            <div className="text-xs text-orly-muted">
                              {item.contato}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-orly-muted">Anônimo</span>
                      )}
                    </td>
                    <td className="max-w-md px-4 py-3">
                      {item.comentario || (
                        <span className="text-orly-muted">Sem comentário</span>
                      )}
                      <div className="mt-1 text-xs text-orly-muted">
                        P {item.produtos} · A {item.atendimento} · L{" "}
                        {item.limpeza} · E {item.espera}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
