import type { Evaluation, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EvaluationFilters = {
  mesa?: number;
  from?: string;
  to?: string;
  minNota?: number;
};

export type CreateEvaluationData = {
  mesa?: number | null;
  produtos: number;
  atendimento: number;
  limpeza: number;
  espera: number;
  nps: number;
  comentario?: string | null;
  nome?: string | null;
  contato?: string | null;
  userAgent?: string | null;
};

function buildWhere(filters: EvaluationFilters): Prisma.EvaluationWhereInput {
  const where: Prisma.EvaluationWhereInput = {};

  if (typeof filters.mesa === "number" && Number.isInteger(filters.mesa)) {
    where.mesa = filters.mesa;
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00.000`);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(`${filters.to}T23:59:59.999`);
    }
  }

  return where;
}

export const evaluationRepository = {
  async create(data: CreateEvaluationData): Promise<Evaluation> {
    return prisma.evaluation.create({
      data: {
        mesa: data.mesa ?? null,
        produtos: data.produtos,
        atendimento: data.atendimento,
        limpeza: data.limpeza,
        espera: data.espera,
        nps: data.nps,
        comentario: data.comentario ?? null,
        nome: data.nome ?? null,
        contato: data.contato ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  },

  async findMany(filters: EvaluationFilters = {}): Promise<Evaluation[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: buildWhere(filters),
      orderBy: { createdAt: "desc" },
    });

    if (typeof filters.minNota !== "number" || Number.isNaN(filters.minNota)) {
      return evaluations;
    }

    const minimum = filters.minNota;
    return evaluations.filter(
      (item) =>
        (item.produtos + item.atendimento + item.limpeza + item.espera) / 4 >=
        minimum
    );
  },
};
