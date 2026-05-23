import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Purging all existing users in the database...');
  await prisma.user.deleteMany();
  console.log('All existing users purged successfully.');

  const password = await bcrypt.hash('password123', 10);
  
  // Seed main admin
  await prisma.user.upsert({
    where: { email: 'admin@bulusan.com' },
    update: {
      password,
      role: 'ADMIN',
    },
    create: {
      name: 'System Admin',
      email: 'admin@bulusan.com',
      password,
      role: 'ADMIN',
    },
  });
  console.log("Main admin 'admin@bulusan.com' seeded successfully as ADMIN with password 'password123'.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
