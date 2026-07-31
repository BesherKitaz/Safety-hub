import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

const requiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

async function main(): Promise<void> {
  const email = requiredEnv('INITIAL_ADMIN_EMAIL').toLowerCase();
  const password = requiredEnv('INITIAL_ADMIN_PASSWORD');

  const firstName = process.env.INITIAL_ADMIN_FIRST_NAME?.trim() || 'System';
  const lastName = process.env.INITIAL_ADMIN_LAST_NAME?.trim() || 'Administrator';

  const passwordHash = await bcrypt.hash(password, 12);

  const college = await prisma.college.upsert({
    where: {
      name: 'Other',
    },
    update: {
      isActive: true,
    },
    create: {
      name: 'Other',
      isActive: true,
    },
  });

  const department = await prisma.department.upsert({
    where: {
      collegeId_name: {
        collegeId: college.id,
        name: 'Other',
      },
    },
    update: {
      isActive: true,
    },
    create: {
      name: 'Other',
      collegeId: college.id,
      isActive: true,
    },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const admin = existingUser
    ? await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          isActive: true,
        },
      })
    : await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          role: 'ADMIN',
          isActive: true,

          // Adjust these depending on what your application requires.
          isProfileComplete: true,
          isUserAgreementComplete: true,
          userAgreementSource: 'ADMIN_BOOTSTRAP',
          userAgreementCompletedAt: new Date(),
        },
      });

  console.log('Bootstrap completed');
  console.log(`Admin: ${admin.email}`);
  console.log(`College: ${college.name}`);
  console.log(`Department: ${department.name}`);
}

main()
  .catch((error: unknown) => {
    console.error('Bootstrap failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });