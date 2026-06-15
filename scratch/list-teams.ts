import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" }
  });
  console.log("Teams in database:");
  console.log(JSON.stringify(teams.map(t => t.name), null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
