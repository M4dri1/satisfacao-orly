import {
  authenticateAdmin,
  createSession,
  type SessionPayload,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export type AuthServiceResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; error: string; status: number };

export const authService = {
  async loginFromRequest(input: {
    body: unknown;
    headers: Headers;
    ipFallback?: string | null;
  }): Promise<AuthServiceResult> {
    const ip = clientIp(input.headers, input.ipFallback);
    const limit = await checkRateLimit(`login:${ip}`, 10, 60_000);

    if (!limit.allowed) {
      return {
        ok: false,
        status: 429,
        error: "Muitas tentativas. Aguarde e tente novamente.",
      };
    }

    const parsed = loginSchema.safeParse(input.body);
    if (!parsed.success) {
      return {
        ok: false,
        status: 400,
        error: "E-mail ou senha inválidos.",
      };
    }

    const session = await authenticateAdmin(
      parsed.data.email,
      parsed.data.password
    );

    if (!session) {
      return {
        ok: false,
        status: 401,
        error: "E-mail ou senha incorretos.",
      };
    }

    await createSession(session);
    return { ok: true, session };
  },
};
