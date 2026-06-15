const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  console.log(`\nTesting connection: ${name}`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    // Attempt a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Success with ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with ${name}:\n${error.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const pwdWithComma = '%23HnUtAguc9q%2AdR%2C'; // #HnUtAguc9q*dR,
  const pwdNoComma = '%23HnUtAguc9q%2AdR';   // #HnUtAguc9q*dR

  const urls = [
    {
      name: "Pooler - No comma",
      url: `postgresql://postgres.ebwibksquinppgtdagja:${pwdNoComma}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
    },
    {
      name: "Pooler - With comma",
      url: `postgresql://postgres.ebwibksquinppgtdagja:${pwdWithComma}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
    },
    {
      name: "Pooler (port 6543) - No comma",
      url: `postgresql://postgres.ebwibksquinppgtdagja:${pwdNoComma}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
    },
    {
      name: "Pooler (port 6543) - With comma",
      url: `postgresql://postgres.ebwibksquinppgtdagja:${pwdWithComma}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
    }
  ];

  let successUrl = null;
  for (const {name, url} of urls) {
    const success = await testConnection(url, name);
    if (success) {
      successUrl = url;
      break;
    }
  }

  if (successUrl) {
    console.log(`\n🎉 Found working connection string!`);
    console.log(successUrl);
  } else {
    console.log(`\n❌ All attempts failed. Please double check the database password.`);
  }
}

main();
