const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.charterService.deleteMany({});
  console.log('All test CharterServices deleted.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
