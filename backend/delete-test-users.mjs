import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteTestUsers() {
  try {
    const result = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: '25f3003058' } },
          { email: { contains: 'testuser' } },
          { email: { contains: 'tester' } },
          { name: { contains: 'tester' } },
          { name: { contains: 'Test' } }
        ]
      }
    });
    
    console.log(`✅ Deleted ${result.count} test users`);
    console.log('✅ Database cleaned! You can now register fresh!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestUsers();
