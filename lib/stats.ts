import { Evaluation } from "@prisma/client";

export type DashboardStats = {
  total: number;
  mediaGeral: number;
  mediaProdutos: number;
  mediaAtendimento: number;
  mediaLimpeza: number;
  mediaEspera: number;
  mediaNps: number;
  npsScore: number;
  tendencia: Array<{ data: string; total: number; media: number }>;
};

export type Criterio = "produtos" | "atendimento" | "limpeza" | "espera";

export type MesaStats = {
  mesa: number | null;
  total: number;
  mediaGeral: number;
  mediaProdutos: number;
  mediaAtendimento: number;
  mediaLimpeza: number;
  mediaEspera: number;
  npsScore: number;
  piorCriterio: Criterio;
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function dayKeySaoPaulo(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function scoreGeral(item: {
  produtos: number;
  atendimento: number;
  limpeza: number;
  espera: number;
}) {
  return (item.produtos + item.atendimento + item.limpeza + item.espera) / 4;
}

export function buildDashboardStats(
  evaluations: Evaluation[]
): DashboardStats {
  const total = evaluations.length;
  if (total === 0) {
    return {
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
  }

  const gerais = evaluations.map((item) => scoreGeral(item));

  const promoters = evaluations.filter((item) => item.nps >= 9).length;
  const detractors = evaluations.filter((item) => item.nps <= 6).length;
  const npsScore = ((promoters - detractors) / total) * 100;

  const byDay = new Map<string, { total: number; sum: number }>();
  for (const item of evaluations) {
    const day = dayKeySaoPaulo(item.createdAt);
    const general = scoreGeral(item);
    const current = byDay.get(day) || { total: 0, sum: 0 };
    current.total += 1;
    current.sum += general;
    byDay.set(day, current);
  }

  const tendencia = Array.from(byDay.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-14)
    .map(([data, bucket]) => ({
      data,
      total: bucket.total,
      media: roundOne(bucket.sum / bucket.total),
    }));

  return {
    total,
    mediaGeral: roundOne(average(gerais)),
    mediaProdutos: roundOne(average(evaluations.map((item) => item.produtos))),
    mediaAtendimento: roundOne(
      average(evaluations.map((item) => item.atendimento))
    ),
    mediaLimpeza: roundOne(average(evaluations.map((item) => item.limpeza))),
    mediaEspera: roundOne(average(evaluations.map((item) => item.espera))),
    mediaNps: roundOne(average(evaluations.map((item) => item.nps))),
    npsScore: Math.round(npsScore),
    tendencia,
  };
}

export function buildMesaRanking(evaluations: Evaluation[]): MesaStats[] {
  const groups = new Map<number | null, Evaluation[]>();
  for (const item of evaluations) {
    const list = groups.get(item.mesa) || [];
    list.push(item);
    groups.set(item.mesa, list);
  }

  const criterios: Criterio[] = ["produtos", "atendimento", "limpeza", "espera"];

  return Array.from(groups.entries())
    .map(([mesa, items]) => {
      const stats = buildDashboardStats(items);
      const medias: Record<Criterio, number> = {
        produtos: stats.mediaProdutos,
        atendimento: stats.mediaAtendimento,
        limpeza: stats.mediaLimpeza,
        espera: stats.mediaEspera,
      };
      const piorCriterio = criterios.reduce((worst, key) =>
        medias[key] < medias[worst] ? key : worst
      );

      return {
        mesa,
        total: stats.total,
        mediaGeral: stats.mediaGeral,
        mediaProdutos: stats.mediaProdutos,
        mediaAtendimento: stats.mediaAtendimento,
        mediaLimpeza: stats.mediaLimpeza,
        mediaEspera: stats.mediaEspera,
        npsScore: stats.npsScore,
        piorCriterio,
      };
    })
    .sort(
      (left, right) =>
        left.mediaGeral - right.mediaGeral ||
        left.npsScore - right.npsScore ||
        (left.mesa ?? Infinity) - (right.mesa ?? Infinity)
    );
}

export function toCsv(evaluations: Evaluation[]) {
  const header = [
    "id",
    "mesa",
    "produtos",
    "atendimento",
    "limpeza",
    "espera",
    "nps",
    "nome",
    "contato",
    "comentario",
    "createdAt",
  ];

  const rows = evaluations.map((item) =>
    [
      item.id,
      item.mesa ?? "",
      item.produtos,
      item.atendimento,
      item.limpeza,
      item.espera,
      item.nps,
      `"${(item.nome || "").replace(/"/g, '""')}"`,
      `"${(item.contato || "").replace(/"/g, '""')}"`,
      `"${(item.comentario || "").replace(/"/g, '""')}"`,
      item.createdAt.toISOString(),
    ].join(",")
  );

  return [header.join(","), ...rows].join("\n");
}
