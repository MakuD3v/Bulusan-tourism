import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  const admins = [
    { email: 'admin@bulusan.com', name: 'System Admin' },
    { email: 'mark.janssen.hombre@gmail.com', name: 'Mark Janssen' }
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        password,
        role: 'ADMIN',
      },
      create: {
        name: admin.name,
        email: admin.email,
        password,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user '${admin.email}' updated/created successfully with password 'password123'.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
