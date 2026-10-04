import { evaluationSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildDashboardStats, buildMesaRanking, toCsv } from "@/lib/stats";
import { clientIp } from "@/lib/client-ip";
import {
  evaluationRepository,
  type EvaluationFilters,
} from "@/lib/repositories/evaluation-repository";

export type ServiceResult<T> =
  | { ok: true; data: T; status?: number }
  | { ok: false; error: string; status: number };

export const evaluationService = {
  async createFromRequest(input: {
    body: unknown;
    headers: Headers;
    ipFallback?: string | null;
  }): Promise<ServiceResult<{ id: string } | { discarded: true }>> {
    const ip = clientIp(input.headers, input.ipFallback);
    const limit = await checkRateLimit(`avaliacao:${ip}`, 30, 60_000);

    if (!limit.allowed) {
      return {
        ok: false,
        status: 429,
        error: `Muitas avaliações em pouco tempo. Tente novamente em ${limit.retryAfterSeconds}s.`,
      };
    }

    const parsed = evaluationSchema.safeParse(input.body);
    if (!parsed.success) {
      return {
        ok: false,
        status: 400,
        error: "Dados inválidos. Verifique as notas e tente novamente.",
      };
    }

    if (parsed.data.website) {
      return { ok: true, data: { discarded: true }, status: 200 };
    }

    const evaluation = await evaluationRepository.create({
      mesa: parsed.data.mesa ?? null,
      produtos: parsed.data.produtos,
      atendimento: parsed.data.atendimento,
      limpeza: parsed.data.limpeza,
      espera: parsed.data.espera,
      nps: parsed.data.nps,
      comentario: parsed.data.comentario ?? null,
      nome: parsed.data.nome ?? null,
      contato: parsed.data.contato ?? null,
      userAgent: input.headers.get("user-agent")?.slice(0, 300) || null,
    });

    return { ok: true, data: { id: evaluation.id }, status: 201 };
  },

  async listForAdmin(filters: EvaluationFilters) {
    const evaluations = await evaluationRepository.findMany(filters);
    return {
      stats: buildDashboardStats(evaluations),
      porMesa: buildMesaRanking(evaluations),
      evaluations,
    };
  },

  async exportCsv(filters: EvaluationFilters) {
    const evaluations = await evaluationRepository.findMany(filters);
    return toCsv(evaluations);
  },
};
