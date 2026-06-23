import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';

const sqlite = new SQLiteClient();

async function main() {
  const matches = await sqlite.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: { date: "asc" }
  });

  console.log(`Total matches in SQLite: ${matches.length}`);
  const recent = matches.filter(m => {
    const d = m.date.toISOString().split('T')[0];
    return d === '2026-06-20' || d === '2026-06-21';
  });
  for (const m of recent) {
    console.log(`- ID: ${m.sofascoreId} | ${m.date.toISOString().split('T')[0]} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Status: ${m.status} | Score: ${m.homeScore}-${m.awayScore} | HasStatsJson: ${m.statisticsJson !== null}`);
  }

  await sqlite.$disconnect();
}

main().catch(console.error);
