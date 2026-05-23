import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  // 1. Seed main admin
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
  console.log("Main admin 'admin@bulusan.com' updated/created successfully as ADMIN.");

  // 2. Seed standard user
  await prisma.user.upsert({
    where: { email: 'mark.janssen.hombre@gmail.com' },
    update: {
      password,
      role: 'USER',
    },
    create: {
      name: 'Mark Janssen',
      email: 'mark.janssen.hombre@gmail.com',
      password,
      role: 'USER',
    },
  });
  console.log("User 'mark.janssen.hombre@gmail.com' updated/created successfully as USER.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
