import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function updateExistingAvatars() {
  console.log('Starting avatar update for existing accounts...');

  try {
    const users = await prisma.user.findMany();
    let updatedCount = 0;

    for (const user of users) {
      if (user.email.toLowerCase() === 'admin@bulusan.com') {
        console.log(`Skipping admin account: ${user.email}`);
        continue;
      }

      const avatarUrl = `https://unavatar.io/google/${user.email.trim().toLowerCase()}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

      if (user.avatar !== avatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: avatarUrl }
        });
        console.log(`Updated avatar for: ${user.email}`);
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} user avatars!`);
  } catch (error) {
    console.error('Error updating avatars:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingAvatars();
