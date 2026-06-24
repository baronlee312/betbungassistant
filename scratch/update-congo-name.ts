import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';
import { PrismaClient as PostgresClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const sqlite = new SQLiteClient();
const postgres = new PostgresClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🔄 Updating 'Congo DR' to 'DR Congo' in databases...");

  // 1. Update in PostgreSQL
  try {
    const pgRanking = await postgres.fifaRanking.findUnique({
      where: { teamName: "Congo DR" }
    });

    if (pgRanking) {
      await postgres.fifaRanking.update({
        where: { teamName: "Congo DR" },
        data: { teamName: "DR Congo" }
      });
      console.log("✅ Successfully updated in PostgreSQL.");
    } else {
      console.log("⚠️ 'Congo DR' not found in PostgreSQL (could already be updated).");
    }
  } catch (e) {
    console.error("❌ Failed to update in PostgreSQL:", e);
  }

  // 2. Update in SQLite
  try {
    const sqliteRanking = await sqlite.fifaRanking.findUnique({
      where: { teamName: "Congo DR" }
    });

    if (sqliteRanking) {
      await sqlite.fifaRanking.update({
        where: { teamName: "Congo DR" },
        data: { teamName: "DR Congo" }
      });
      console.log("✅ Successfully updated in SQLite.");
    } else {
      console.log("⚠️ 'Congo DR' not found in SQLite (could already be updated).");
    }
  } catch (e) {
    console.error("❌ Failed to update in SQLite:", e);
  }

  await postgres.$disconnect();
  await sqlite.$disconnect();
}

main().catch(console.error);
