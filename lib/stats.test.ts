import { describe, expect, it } from "vitest";
import type { Evaluation } from "@prisma/client";
import {
  buildDashboardStats,
  dayKeySaoPaulo,
  scoreGeral,
  toCsv,
} from "@/lib/stats";
import { evaluationSchema } from "@/lib/validation";

function evalFixture(
  partial: Partial<Evaluation> &
    Pick<Evaluation, "produtos" | "atendimento" | "limpeza" | "espera" | "nps">
): Evaluation {
  return {
    id: partial.id ?? "id",
    mesa: partial.mesa ?? null,
    produtos: partial.produtos,
    atendimento: partial.atendimento,
    limpeza: partial.limpeza,
    espera: partial.espera,
    nps: partial.nps,
    comentario: partial.comentario ?? null,
    nome: partial.nome ?? null,
    contato: partial.contato ?? null,
    userAgent: partial.userAgent ?? null,
    createdAt: partial.createdAt ?? new Date("2026-08-11T15:00:00.000Z"),
  };
}

describe("scoreGeral", () => {
  it("média aritmética das 4 notas", () => {
    expect(
      scoreGeral({ produtos: 5, atendimento: 4, limpeza: 3, espera: 2 })
    ).toBe(3.5);
  });
});

describe("buildDashboardStats", () => {
  it("retorna zeros sem avaliações", () => {
    expect(buildDashboardStats([])).toEqual({
      total: 0,
      mediaGeral: 0,
      mediaProdutos: 0,
      mediaAtendimento: 0,
      mediaLimpeza: 0,
      mediaEspera: 0,
      mediaNps: 0,
      npsScore: 0,
      tendencia: [],
    });
  });

  it("calcula médias, NPS e tendência com fixture conhecida", () => {
    const evaluations = [
      evalFixture({
        id: "a",
        produtos: 5,
        atendimento: 5,
        limpeza: 5,
        espera: 5,
        nps: 10,
        createdAt: new Date("2026-08-10T18:00:00.000Z"),
      }),
      evalFixture({
        id: "b",
        produtos: 4,
        atendimento: 4,
        limpeza: 4,
        espera: 4,
        nps: 8,
        createdAt: new Date("2026-08-11T12:00:00.000Z"),
      }),
      evalFixture({
        id: "c",
        produtos: 3,
        atendimento: 3,
        limpeza: 3,
        espera: 3,
        nps: 5,
        createdAt: new Date("2026-08-11T20:00:00.000Z"),
      }),
    ];

    const stats = buildDashboardStats(evaluations);

    expect(stats.total).toBe(3);
    expect(stats.mediaProdutos).toBe(4);
    expect(stats.mediaAtendimento).toBe(4);
    expect(stats.mediaLimpeza).toBe(4);
    expect(stats.mediaEspera).toBe(4);
    expect(stats.mediaGeral).toBe(4);
    expect(stats.mediaNps).toBe(7.7);
    expect(stats.npsScore).toBe(0);
    expect(stats.tendencia).toEqual([
      { data: "2026-08-10", total: 1, media: 5 },
      { data: "2026-08-11", total: 2, media: 3.5 },
    ]);
  });

  it("NPS = 100 quando todos são promotores", () => {
    const evaluations = [
      evalFixture({
        produtos: 5,
        atendimento: 5,
        limpeza: 5,
        espera: 5,
        nps: 9,
      }),
      evalFixture({
        id: "2",
        produtos: 5,
        atendimento: 5,
        limpeza: 5,
        espera: 5,
        nps: 10,
      }),
    ];
    expect(buildDashboardStats(evaluations).npsScore).toBe(100);
  });

  it("lote auditado: médias 3.6 / NPS 25", () => {
    const evaluations = [
      evalFixture({
        produtos: 5,
        atendimento: 5,
        limpeza: 4,
        espera: 4,
        nps: 10,
      }),
      evalFixture({
        id: "b",
        produtos: 3,
        atendimento: 4,
        limpeza: 5,
        espera: 2,
        nps: 7,
      }),
      evalFixture({
        id: "c",
        produtos: 1,
        atendimento: 2,
        limpeza: 2,
        espera: 1,
        nps: 4,
      }),
      evalFixture({
        id: "d",
        produtos: 5,
        atendimento: 5,
        limpeza: 5,
        espera: 5,
        nps: 9,
      }),
    ];
    const stats = buildDashboardStats(evaluations);
    expect(stats.mediaGeral).toBe(3.6);
    expect(stats.mediaProdutos).toBe(3.5);
    expect(stats.mediaAtendimento).toBe(4);
    expect(stats.mediaLimpeza).toBe(4);
    expect(stats.mediaEspera).toBe(3);
    expect(stats.mediaNps).toBe(7.5);
    expect(stats.npsScore).toBe(25);
  });

  it("NPS = -100 quando todos são detratores", () => {
    const evaluations = [
      evalFixture({
        produtos: 1,
        atendimento: 1,
        limpeza: 1,
        espera: 1,
        nps: 0,
      }),
      evalFixture({
        id: "2",
        produtos: 2,
        atendimento: 2,
        limpeza: 2,
        espera: 2,
        nps: 6,
      }),
    ];
    expect(buildDashboardStats(evaluations).npsScore).toBe(-100);
  });
});

describe("dayKeySaoPaulo", () => {
  it("não usa UTC puro perto da meia-noite", () => {
    const lateUtc = new Date("2026-08-12T02:30:00.000Z");
    expect(dayKeySaoPaulo(lateUtc)).toBe("2026-08-11");
  });
});

describe("toCsv", () => {
  it("gera cabeçalho e linha com escape de aspas", () => {
    const csv = toCsv([
      evalFixture({
        id: "x1",
        mesa: 3,
        produtos: 5,
        atendimento: 4,
        limpeza: 4,
        espera: 3,
        nps: 9,
        nome: 'Ana "Aninha"',
        comentario: "Bom",
      }),
    ]);
    expect(csv.split("\n")[0]).toContain("produtos");
    expect(csv).toContain('"Ana ""Aninha"""');
    expect(csv).toContain(",3,");
  });
});

describe("evaluationSchema", () => {
  it("aceita payload válido", () => {
    const parsed = evaluationSchema.safeParse({
      mesa: 4,
      produtos: 5,
      atendimento: 4,
      limpeza: 5,
      espera: 3,
      nps: 9,
      comentario: "  ótimo  ",
      nome: "",
      contato: null,
      website: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.comentario).toBe("ótimo");
      expect(parsed.data.nome).toBeNull();
    }
  });

  it("rejeita nota fora da faixa", () => {
    const parsed = evaluationSchema.safeParse({
      produtos: 6,
      atendimento: 4,
      limpeza: 5,
      espera: 3,
      nps: 9,
    });
    expect(parsed.success).toBe(false);
  });

  it("aceita honeypot preenchido (API descarta sem gravar)", () => {
    const parsed = evaluationSchema.safeParse({
      produtos: 5,
      atendimento: 5,
      limpeza: 5,
      espera: 5,
      nps: 10,
      website: "http://spam",
    });
    expect(parsed.success).toBe(true);
  });
});
