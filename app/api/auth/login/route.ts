import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.ip ||
    "unknown";

  const limit = checkRateLimit(`login:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde e tente novamente." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "E-mail ou senha inválidos." },
      { status: 400 }
    );
  }

  const session = await authenticateAdmin(
    parsed.data.email,
    parsed.data.password
  );
  if (!session) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  await createSession(session);
  return NextResponse.json({ ok: true, name: session.name });
}
