"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardStats } from "@/lib/stats";

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
        setError(payload.error || "Erro ao carregar dados.");
        return;
      }
      setStats(payload.stats);
      setEvaluations(payload.evaluations);
    } catch {
      setError("Falha de conexão ao carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function exportCsv() {
    const url = `/api/avaliacoes?format=csv${queryString ? `&${queryString}` : ""}`;
    window.open(url, "_blank");
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold">Painel — Orly</h1>
          <p className="text-sm text-gray-600">Olá, {adminName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/qr" className="btn-secondary">
            QR das mesas
          </Link>
          <button type="button" className="btn-secondary" onClick={exportCsv}>
            Exportar CSV
          </button>
          <button type="button" className="btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Mesa</span>
          <input
            type="number"
            min={1}
            value={filters.mesa}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, mesa: event.target.value }))
            }
            className="input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Nota mínima</span>
          <input
            type="number"
            min={1}
            max={5}
            step={0.5}
            value={filters.minNota}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, minNota: event.target.value }))
            }
            className="input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">De</span>
          <input
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, from: event.target.value }))
            }
            className="input"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">Até</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, to: event.target.value }))
            }
            className="input"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() =>
              setFilters({ mesa: "", minNota: "", from: "", to: "" })
            }
          >
            Limpar
          </button>
        </div>
      </section>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-gray-500">Respostas</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "…" : stats.total}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Média geral</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "…" : stats.mediaGeral.toFixed(1)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">NPS médio</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "…" : stats.mediaNps.toFixed(1)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Score NPS</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "…" : stats.npsScore}
          </p>
        </div>
      </section>

      <section className="card mb-4">
        <h2 className="mb-3 font-semibold">Médias por critério</h2>
        <ul className="space-y-1 text-sm">
          <li>Produtos: {stats.mediaProdutos.toFixed(1)}</li>
          <li>Atendimento: {stats.mediaAtendimento.toFixed(1)}</li>
          <li>Limpeza: {stats.mediaLimpeza.toFixed(1)}</li>
          <li>Espera: {stats.mediaEspera.toFixed(1)}</li>
        </ul>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">Avaliações recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Mesa</th>
                <th className="px-3 py-2 font-medium">Média</th>
                <th className="px-3 py-2 font-medium">NPS</th>
                <th className="px-3 py-2 font-medium">Comentário</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={5}>
                    Carregando...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={5}>
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              ) : (
                evaluations.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">{item.mesa ?? "—"}</td>
                    <td className="px-3 py-2">{mediaGeral(item)}</td>
                    <td className="px-3 py-2">{item.nps}</td>
                    <td className="max-w-sm px-3 py-2">
                      {item.comentario || "—"}
                      {(item.nome || item.contato) && (
                        <div className="text-xs text-gray-500">
                          {[item.nome, item.contato].filter(Boolean).join(" · ")}
                        </div>
                      )}
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
