import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: {
      name: { contains: "Congo" }
    }
  });

  const rankings = await prisma.fifaRanking.findMany({
    where: {
      teamName: { contains: "Congo" }
    }
  });

  console.log("=== Teams with 'Congo' ===");
  console.log(teams.map(t => ({ id: t.id, sofascoreId: t.sofascoreId, name: t.name })));

  console.log("=== FIFA Rankings with 'Congo' ===");
  console.log(rankings.map(r => ({ id: r.id, rank: r.rank, teamName: r.teamName })));

  await prisma.$disconnect();
}

main().catch(console.error);
