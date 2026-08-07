/**
 * Grant (or revoke) admin access.
 *
 * There is deliberately no in-app path to create the first admin — otherwise
 * the admin surface would be self-serve. This script is the bootstrap.
 *
 *   node scripts/make-admin.mjs you@example.com            # make admin
 *   node scripts/make-admin.mjs you@example.com subadmin   # make subadmin
 *   node scripts/make-admin.mjs you@example.com user       # revoke
 *
 * The gate in src/middleware/requireAdmin.ts requires ALL of:
 *   isActive === true, adminStatus === 'active', and an admin/subadmin role.
 * This sets all three, which is why simply editing `role` in Atlas is often
 * not enough — an account left with isActive:false stays locked out.
 */
import { PrismaClient } from '@prisma/client';

const [email, role = 'admin'] = process.argv.slice(2);

if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email> [admin|subadmin|user]');
  process.exit(1);
}

if (!['admin', 'subadmin', 'user'].includes(role)) {
  console.error(`Unknown role "${role}". Use admin, subadmin or user.`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, isActive: true, adminStatus: true },
  });

  if (!user) {
    console.error(`No user with email "${email}".`);
    const nearby = await prisma.user.findMany({
      where: { email: { contains: email.split('@')[0] ?? '', mode: 'insensitive' } },
      select: { email: true },
      take: 5,
    });
    if (nearby.length) {
      console.error('Did you mean:');
      for (const n of nearby) console.error('  ' + n.email);
    }
    process.exit(1);
  }

  console.log('before:', {
    role: user.role,
    isActive: user.isActive,
    adminStatus: user.adminStatus,
  });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      isAdmin: role !== 'user',
      // Both are part of the gate; granting a role without them does nothing.
      isActive: true,
      adminStatus: 'active',
    },
    select: { name: true, email: true, role: true, isActive: true, adminStatus: true },
  });

  console.log('after :', {
    role: updated.role,
    isActive: updated.isActive,
    adminStatus: updated.adminStatus,
  });
  console.log(`\n${updated.name} <${updated.email}> is now: ${updated.role}`);
  if (role !== 'user') console.log('Sign out and back in, then open /admin.');
} finally {
  await prisma.$disconnect();
}
