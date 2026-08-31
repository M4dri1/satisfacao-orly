import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluationSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildDashboardStats, toCsv } from "@/lib/stats";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.ip ||
    "unknown";

  const limit = checkRateLimit(`avaliacao:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Muitas avaliações em pouco tempo. Tente novamente em ${limit.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = evaluationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos. Verifique as notas e tente novamente." },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      mesa: parsed.data.mesa ?? null,
      produtos: parsed.data.produtos,
      atendimento: parsed.data.atendimento,
      limpeza: parsed.data.limpeza,
      espera: parsed.data.espera,
      nps: parsed.data.nps,
      comentario: parsed.data.comentario ?? null,
      nome: parsed.data.nome ?? null,
      contato: parsed.data.contato ?? null,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) || null,
    },
  });

  return NextResponse.json({ ok: true, id: evaluation.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mesaParam = searchParams.get("mesa");
  const minNota = searchParams.get("minNota");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format");

  const where: {
    mesa?: number;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (mesaParam) {
    const mesa = Number(mesaParam);
    if (Number.isInteger(mesa)) {
      where.mesa = mesa;
    }
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(`${from}T00:00:00.000`);
    }
    if (to) {
      where.createdAt.lte = new Date(`${to}T23:59:59.999`);
    }
  }

  let evaluations = await prisma.evaluation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (minNota) {
    const minimum = Number(minNota);
    if (!Number.isNaN(minimum)) {
      evaluations = evaluations.filter(
        (item) =>
          (item.produtos + item.atendimento + item.limpeza + item.espera) / 4 >=
          minimum
      );
    }
  }

  if (format === "csv") {
    const csv = toCsv(evaluations);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="avaliacoes-orly.csv"',
      },
    });
  }

  const stats = buildDashboardStats(evaluations);
  return NextResponse.json({ stats, evaluations });
}
