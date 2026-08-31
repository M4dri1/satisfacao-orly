import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { evaluationUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const mesaParam = request.nextUrl.searchParams.get("mesa");
  const mesa = mesaParam ? Number(mesaParam) : null;

  if (mesaParam && (!Number.isInteger(mesa) || (mesa as number) < 1)) {
    return NextResponse.json({ error: "Mesa inválida." }, { status: 400 });
  }

  const target = evaluationUrl(mesa);
  const dataUrl = await QRCode.toDataURL(target, {
    margin: 1,
    width: 320,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });

  return NextResponse.json({ url: target, qr: dataUrl, mesa });
}
