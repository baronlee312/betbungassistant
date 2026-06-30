import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function main() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: { date: "asc" }
  });

  console.log(`Total matches in DB: ${matches.length}`);
  const recent = matches.filter(m => {
    const d = m.date.toISOString().split('T')[0];
    return d >= '2026-06-25';
  });
  console.log("Match List (Recent):");
  for (const m of recent) {
    console.log(`- ID: ${m.sofascoreId} | ${m.date.toISOString().split('T')[0]} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Status: ${m.status} | Score: ${m.homeScore}-${m.awayScore} | HasStatsJson: ${m.statisticsJson !== null}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
