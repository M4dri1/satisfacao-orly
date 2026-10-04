import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { buildDashboardStats, scoreGeral } from "../lib/stats";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL || "admin@orly.local";
const PASSWORD = process.env.ADMIN_PASSWORD || "orlyadmin123";
const MESA = 198;
const MARKER = `audit-${Date.now()}`;

const prisma = new PrismaClient();

type Sample = {
  mesa: number;
  produtos: number;
  atendimento: number;
  limpeza: number;
  espera: number;
  nps: number;
  comentario: string;
  nome: string;
  contato: string;
  website: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function expectedFromRows(
  rows: Array<{
    produtos: number;
    atendimento: number;
    limpeza: number;
    espera: number;
    nps: number;
  }>
) {
  const total = rows.length;
  const avg = (pick: (row: (typeof rows)[number]) => number) =>
    roundOne(rows.reduce((sum, row) => sum + pick(row), 0) / total);
  const promoters = rows.filter((row) => row.nps >= 9).length;
  const detractors = rows.filter((row) => row.nps <= 6).length;

  return {
    total,
    mediaGeral: avg((row) => scoreGeral(row)),
    mediaProdutos: avg((row) => row.produtos),
    mediaAtendimento: avg((row) => row.atendimento),
    mediaLimpeza: avg((row) => row.limpeza),
    mediaEspera: avg((row) => row.espera),
    mediaNps: avg((row) => row.nps),
    npsScore: Math.round(((promoters - detractors) / total) * 100),
  };
}

async function main() {
  const jar = new Map<string, string>();

  function storeCookies(response: Response) {
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const cookie of raw) {
      const [pair] = cookie.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) {
        jar.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
    }
  }

  function cookieHeader() {
    return Array.from(jar.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  const samples: Sample[] = [
    {
      mesa: MESA,
      produtos: 5,
      atendimento: 5,
      limpeza: 4,
      espera: 4,
      nps: 10,
      comentario: `${MARKER} excelente`,
      nome: "Cliente A",
      contato: "14999990001",
      website: "",
    },
    {
      mesa: MESA,
      produtos: 3,
      atendimento: 4,
      limpeza: 5,
      espera: 2,
      nps: 7,
      comentario: `${MARKER} regular`,
      nome: "Cliente B",
      contato: "contato@orly.test",
      website: "",
    },
    {
      mesa: MESA,
      produtos: 1,
      atendimento: 2,
      limpeza: 2,
      espera: 1,
      nps: 4,
      comentario: `${MARKER} ruim`,
      nome: "",
      contato: "",
      website: "",
    },
    {
      mesa: MESA,
      produtos: 5,
      atendimento: 5,
      limpeza: 5,
      espera: 5,
      nps: 9,
      comentario: `${MARKER} promotor`,
      nome: 'Ana "Aninha"',
      contato: "14 3413-8488",
      website: "",
    },
  ];

  console.log("0) Saúde do app...");
  const home = await fetch(`${BASE}/avaliar`);
  assert(home.ok, `App fora do ar: ${home.status}`);

  console.log("1) Login admin...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  storeCookies(loginRes);
  assert(loginRes.ok, `Login falhou: ${loginRes.status} ${await loginRes.text()}`);

  console.log("2) GET sem cookie deve ser 401...");
  const unauth = await fetch(`${BASE}/api/avaliacoes`);
  assert(unauth.status === 401, `esperava 401, veio ${unauth.status}`);

  console.log(`3) POST ${samples.length} avaliações na mesa ${MESA}...`);
  const createdIds: string[] = [];
  for (let i = 0; i < samples.length; i += 1) {
    const res = await fetch(`${BASE}/api/avaliacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `203.0.113.${60 + i}`,
      },
      body: JSON.stringify(samples[i]),
    });
    const body = await res.json();
    assert(res.status === 201 && body.id, `POST falhou: ${JSON.stringify(body)}`);
    createdIds.push(body.id as string);
  }

  console.log("4) Conferir no PostgreSQL...");
  const dbRows = await prisma.evaluation.findMany({
    where: { id: { in: createdIds } },
    orderBy: { createdAt: "asc" },
  });
  assert(dbRows.length === samples.length, `banco gravou ${dbRows.length}, esperado ${samples.length}`);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const row = dbRows.find((item) => item.comentario === sample.comentario);
    assert(row, `não achou no banco: ${sample.comentario}`);
    assert(row.produtos === sample.produtos, "produtos divergente no banco");
    assert(row.atendimento === sample.atendimento, "atendimento divergente no banco");
    assert(row.limpeza === sample.limpeza, "limpeza divergente no banco");
    assert(row.espera === sample.espera, "espera divergente no banco");
    assert(row.nps === sample.nps, "nps divergente no banco");
    assert(row.mesa === MESA, "mesa divergente no banco");
  }

  console.log("5) Painel da mesa deve refletir só essas 4 avaliações novas + anteriores da mesa...");
  const panelRes = await fetch(`${BASE}/api/avaliacoes?mesa=${MESA}`, {
    headers: { Cookie: cookieHeader() },
  });
  assert(panelRes.ok, `GET painel falhou: ${panelRes.status}`);
  const panel = await panelRes.json();
  const markerRows = panel.evaluations.filter((item: { comentario: string | null }) =>
    (item.comentario || "").includes(MARKER)
  );
  assert(markerRows.length === 4, `painel deveria ter 4 do lote, veio ${markerRows.length}`);

  const statsFromApi = buildDashboardStats(
    markerRows.map((item: {
      id: string;
      mesa: number | null;
      produtos: number;
      atendimento: number;
      limpeza: number;
      espera: number;
      nps: number;
      comentario: string | null;
      nome: string | null;
      contato: string | null;
      userAgent: string | null;
      createdAt: string;
    }) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }))
  );
  const statsFromDb = buildDashboardStats(dbRows);
  const statsManual = expectedFromRows(samples);

  assert(statsFromApi.total === 4, `lote API total ${statsFromApi.total}`);
  assert(statsFromDb.total === 4, `lote DB total ${statsFromDb.total}`);
  for (const key of [
    "mediaGeral",
    "mediaProdutos",
    "mediaAtendimento",
    "mediaLimpeza",
    "mediaEspera",
    "mediaNps",
    "npsScore",
  ] as const) {
    assert(
      statsFromApi[key] === statsManual[key],
      `API ${key}=${statsFromApi[key]} != esperado ${statsManual[key]}`
    );
    assert(
      statsFromDb[key] === statsManual[key],
      `DB ${key}=${statsFromDb[key]} != esperado ${statsManual[key]}`
    );
  }
  assert(statsManual.mediaGeral === 3.6, `média geral esperada 3.6, veio ${statsManual.mediaGeral}`);
  assert(statsManual.mediaProdutos === 3.5, `média produtos esperada 3.5`);
  assert(statsManual.mediaAtendimento === 4, `média atendimento esperada 4`);
  assert(statsManual.mediaLimpeza === 4, `média limpeza esperada 4`);
  assert(statsManual.mediaEspera === 3, `média espera esperada 3`);
  assert(statsManual.mediaNps === 7.5, `média NPS esperada 7.5`);
  assert(statsManual.npsScore === 25, `score NPS esperado 25`);

  console.log("6) Filtro minNota=4 deve manter só A e D...");
  const minRes = await fetch(`${BASE}/api/avaliacoes?mesa=${MESA}&minNota=4`, {
    headers: { Cookie: cookieHeader() },
  });
  const minPayload = await minRes.json();
  const minMarker = minPayload.evaluations.filter((item: { comentario: string | null }) =>
    (item.comentario || "").includes(MARKER)
  );
  assert(minMarker.length === 2, `minNota deveria deixar 2, veio ${minMarker.length}`);
  const minComments = minMarker.map((item: { comentario: string }) => item.comentario).sort();
  assert(
    minComments[0].includes("excelente") && minComments[1].includes("promotor"),
    `minNota filtrou errado: ${minComments.join(", ")}`
  );

  console.log("7) Filtro de data de hoje deve incluir o lote...");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const dateRes = await fetch(
    `${BASE}/api/avaliacoes?mesa=${MESA}&from=${today}&to=${today}`,
    { headers: { Cookie: cookieHeader() } }
  );
  const datePayload = await dateRes.json();
  const dateMarker = datePayload.evaluations.filter((item: { comentario: string | null }) =>
    (item.comentario || "").includes(MARKER)
  );
  assert(dateMarker.length === 4, `filtro de data perdeu o lote (${dateMarker.length})`);

  console.log("8) CSV deve bater com o banco...");
  const csvRes = await fetch(`${BASE}/api/avaliacoes?mesa=${MESA}&format=csv`, {
    headers: { Cookie: cookieHeader() },
  });
  assert(csvRes.ok, `CSV falhou: ${csvRes.status}`);
  const csv = await csvRes.text();
  const contentType = csvRes.headers.get("content-type") || "";
  assert(contentType.includes("text/csv"), `Content-Type CSV inválido: ${contentType}`);
  assert(csv.startsWith("id,mesa,produtos,atendimento,limpeza,espera,nps,nome,contato,comentario,createdAt"), "cabeçalho CSV errado");
  for (const sample of samples) {
    assert(csv.includes(`,${MESA},`), "CSV sem mesa");
    assert(csv.includes(`,${sample.produtos},`), `CSV sem nota produtos ${sample.produtos}`);
    assert(csv.includes(sample.comentario), `CSV sem comentário ${sample.comentario}`);
  }
  assert(csv.includes('""Aninha""'), "CSV não escapou aspas do nome");

  console.log("9) QR da mesa...");
  const qrRes = await fetch(`${BASE}/api/qr?mesa=${MESA}`, {
    headers: { Cookie: cookieHeader() },
  });
  const qr = await qrRes.json();
  assert(qrRes.ok, `QR falhou: ${qrRes.status}`);
  assert(typeof qr.qr === "string" && qr.qr.startsWith("data:image/png"), "QR não gerou imagem");
  assert(String(qr.url).includes(`/avaliar/${MESA}`), `URL do QR errada: ${qr.url}`);

  console.log("10) GET global do painel recalcula stats a partir das linhas...");
  const allRes = await fetch(`${BASE}/api/avaliacoes`, {
    headers: { Cookie: cookieHeader() },
  });
  const all = await allRes.json();
  const recomputed = expectedFromRows(all.evaluations);
  assert(all.stats.total === all.evaluations.length, "total do painel != quantidade de linhas");
  assert(all.stats.mediaGeral === recomputed.mediaGeral, "média geral do painel divergente");
  assert(all.stats.npsScore === recomputed.npsScore, "score NPS do painel divergente");
  assert(Array.isArray(all.stats.tendencia), "tendência ausente");

  console.log("");
  console.log("OK — avaliações, médias e relatórios consistentes");
  console.log(
    JSON.stringify(
      {
        lote: statsManual,
        painelGeral: {
          total: all.stats.total,
          mediaGeral: all.stats.mediaGeral,
          npsScore: all.stats.npsScore,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("FALHA:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
