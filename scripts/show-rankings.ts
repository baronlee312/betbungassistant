import { prisma } from "./lib/prisma";

async function main() {
  const rankings = await prisma.fifaRanking.findMany({
    orderBy: { rank: "asc" },
    take: 20
  });
  
  console.log("TOP 20 FIFA MEN RANKINGS:");
  console.table(rankings.map(r => ({
    Rank: r.rank,
    Team: r.teamName,
    Points: r.points.toFixed(2),
    Flag: r.flagUrl ? "Available" : "Missing"
  })));
  
  await prisma.$disconnect();
}

main().catch(console.error);
