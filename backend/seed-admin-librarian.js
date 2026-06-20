const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  try {

    const adminHash = bcrypt.hashSync('admin123', 12);
    const librarianHash = bcrypt.hashSync('librarian123', 12);

    console.log('Starting constraint-free upsert...\n');

    console.log('Processing AD-0001 (Admin)...');
    const adminUpdateResult = await prisma.$executeRaw`
      UPDATE "User" 
      SET user_name = 'Admin', pass = ${adminHash}, role = 'admin'
      WHERE user_id = 'AD-0001'
    `;
    
    if (adminUpdateResult === 0) {
      console.log('  → No existing row, inserting...');
      await prisma.$executeRaw`
        INSERT INTO "User" (user_id, user_name, pass, role)
        VALUES ('AD-0001', 'Admin', ${adminHash}, 'admin')
      `;
      console.log('  ✓ Inserted AD-0001');
    } else {
      console.log(`  ✓ Updated ${adminUpdateResult} row(s)`);
    }


    console.log('\nProcessing LB-00001 (Librarian)...');
    const librarianUpdateResult = await prisma.$executeRaw`
      UPDATE "User" 
      SET user_name = 'Librarian', pass = ${librarianHash}, role = 'librarian'
      WHERE user_id = 'LB-00001'
    `;
    
    if (librarianUpdateResult === 0) {
      console.log('  → No existing row, inserting...');
      await prisma.$executeRaw`
        INSERT INTO "User" (user_id, user_name, pass, role)
        VALUES ('LB-00001', 'Librarian', ${librarianHash}, 'librarian')
      `;
      console.log('  ✓ Inserted LB-00001');
    } else {
      console.log(`  ✓ Updated ${librarianUpdateResult} row(s)`);
    }


    console.log('\n--- Verification ---');
    const users = await prisma.user.findMany({
      where: {
        user_id: {
          in: ['AD-0001', 'LB-00001']
        }
      }
    });

    console.log(`Found ${users.length} user(s):`);
    users.forEach(u => {
      console.log(`  - ${u.user_id}: ${u.user_name} (role: ${u.role})`);
    });

    console.log('\n✓ Seeding complete!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
