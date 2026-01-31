const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTestUsers() {
  try {
    // Delete users with test emails
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
    console.log('You can now register with fresh data!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestUsers();
