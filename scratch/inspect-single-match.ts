import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const match = await prisma.match.findUnique({
    where: { sofascoreId: 15186710 },
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

  console.log(JSON.stringify(match, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
