// @ts-check
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'sysadmin@example.com';
  const password = await hash('ChangeMe123!', 12);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: 'System Admin',
      systemRole: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  console.log(`Created system admin user with ID: ${user.id}`);
  console.log(`Email: ${email}`);
  console.log('Temporary password: ChangeMe123!');
  console.log('IMPORTANT: Change password after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
