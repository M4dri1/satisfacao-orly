"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@orly.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Falha no login.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell relative z-10 mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="orly-card w-full space-y-6 p-6 sm:p-8"
      >
        <div className="space-y-4">
          <BrandMark size="md" />
          <div>
            <h1 className="brand-display text-2xl text-orly-ink">
              Painel de satisfação
            </h1>
            <p className="mt-1 text-sm text-orly-muted">
              Acesso interno para acompanhar as avaliações dos clientes.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="orly-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="orly-input"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button type="submit" className="orly-btn w-full" disabled={loading}>
          {loading ? "Entrando..." : "Acessar painel"}
        </button>
      </form>
    </main>
  );
}
