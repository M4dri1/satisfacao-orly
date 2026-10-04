import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.evaluation.count();

  if (!process.argv.includes("--confirm")) {
    console.log(`Existem ${total} avaliações no banco.`);
    console.log("Nada foi apagado. Para limpar, rode: npm run db:reset-data -- --confirm");
    return;
  }

  const { count } = await prisma.evaluation.deleteMany();
  const admins = await prisma.user.count();
  console.log(`Avaliações apagadas: ${count}. Usuários admin mantidos: ${admins}.`);
}

main()
  .catch((error) => {
    console.error("FALHA:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
