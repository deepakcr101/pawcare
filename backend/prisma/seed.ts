import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1️⃣ Create a service
  const service = await prisma.service.create({
    data: {
      name: 'Grooming',
      type: 'GROOMING',
      description: 'Full grooming session for pets',
    },
  });

  // 2️⃣ Create a staff user (password is hashed)
  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@example.com',
      password: await hash('password123', 10),
      role: 'STAFF',
      name: 'Jane Groomer',
    },
  });

  // 3️⃣ Create an owner user
  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password: await hash('password123', 10),
      role: 'OWNER',
      name: 'John PetOwner',
    },
  });

  // 4️⃣ Create a pet for the owner
  const pet = await prisma.pet.create({
    data: {
      name: 'Fluffy',
      species: 'Dog',
      ownerId: ownerUser.id,
    },
  });

  // 5️⃣ Link staff to service
  await prisma.staffService.create({
    data: {
      staffId: staffUser.id,
      serviceId: service.id,
    },
  });

  // 6️⃣ Define staff availability
  await prisma.staffAvailability.create({
    data: {
      staffId: staffUser.id,
      date: new Date('2025-06-01'),
      startTime: '10:00:00',
      endTime: '12:00:00',
    },
  });

  console.log('Seeding completed ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

