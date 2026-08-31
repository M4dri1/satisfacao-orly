import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@orly.local";
  const password = process.env.ADMIN_PASSWORD || "orlyadmin123";
  const name = process.env.ADMIN_NAME || "Administrador Orly";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  const existing = await prisma.evaluation.count();
  if (existing === 0) {
    const samples = [
      {
        mesa: 1,
        produtos: 5,
        atendimento: 5,
        limpeza: 4,
        espera: 4,
        nps: 10,
        comentario: "Pão francês sempre fresquinho. Atendimento excelente!",
      },
      {
        mesa: 3,
        produtos: 4,
        atendimento: 5,
        limpeza: 5,
        espera: 3,
        nps: 9,
        comentario: "Adoro os doces da Orly. Só demorou um pouco no horário de pico.",
      },
      {
        mesa: 2,
        produtos: 5,
        atendimento: 4,
        limpeza: 5,
        espera: 5,
        nps: 10,
        comentario: null,
      },
      {
        mesa: 5,
        produtos: 3,
        atendimento: 4,
        limpeza: 4,
        espera: 2,
        nps: 6,
        comentario: "Café bom, mas a fila estava longa.",
      },
      {
        mesa: 1,
        produtos: 5,
        atendimento: 5,
        limpeza: 5,
        espera: 5,
        nps: 10,
        comentario: "Tradição de Marília. Sempre volto!",
      },
    ];

    for (const sample of samples) {
      await prisma.evaluation.create({ data: sample });
    }
  }

  console.log(`Admin seed: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
