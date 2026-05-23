import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.deleteMany({ where: { role: 'OWNER' } })
  .then((res) => console.log('Deleted:', res.count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
