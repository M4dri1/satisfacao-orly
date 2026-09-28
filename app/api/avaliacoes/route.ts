import { NextRequest, NextResponse } from "next/server";
import { evaluationService } from "@/lib/services/evaluation-service";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = await evaluationService.createFromRequest({
    body,
    headers: request.headers,
    ipFallback: request.ip,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if ("discarded" in result.data) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: true, id: result.data.id },
    { status: result.status ?? 201 }
  );
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mesaParam = searchParams.get("mesa");
  const minNotaParam = searchParams.get("minNota");

  const filters = {
    mesa: mesaParam ? Number(mesaParam) : undefined,
    minNota: minNotaParam ? Number(minNotaParam) : undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  };

  if (searchParams.get("format") === "csv") {
    const csv = await evaluationService.exportCsv(filters);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="avaliacoes-orly.csv"',
      },
    });
  }

  const payload = await evaluationService.listForAdmin(filters);
  return NextResponse.json(payload);
}
