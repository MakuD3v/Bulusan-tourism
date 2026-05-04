import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bulusan.com';
  const password = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: 'ADMIN',
    },
    create: {
      name: 'System Admin',
      email,
      password,
      role: 'ADMIN',
    },
  });
  
  console.log('Admin user created successfully! Email: admin@bulusan.com | Password: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
