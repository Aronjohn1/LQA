const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('\n========== LOGIN DIAGNOSTICS ==========\n');

  try {
    // 1. Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✓ Database connected\n');

    // 2. Check User table
    console.log('2. Checking User table records...');
    const allUsers = await prisma.user.findMany();
    console.log(`   Total users in DB: ${allUsers.length}`);
    if (allUsers.length > 0) {
      allUsers.forEach(u => {
        console.log(`   - ID: ${u.id}, user_id: ${u.user_id}, user_name: ${u.user_name}, role: ${u.role}`);
        console.log(`     Password field exists: ${!!u.pass}`);
        console.log(`     Is bcrypt hash: ${/^\$2[aby]\$/.test(u.pass || '')}`);
      });
    } else {
      console.log('   ⚠ No users found in User table');
    }
    console.log();

    // 3. Test bcrypt.compare with known admin credentials
    console.log('3. Testing bcrypt.compare with "admin123"...');
    if (allUsers.length > 0) {
      const firstUser = allUsers[0];
      if (firstUser.pass) {
        try {
          const isMatch = await bcrypt.compare('admin123', firstUser.pass);
          console.log(`   Testing password "admin123" against ${firstUser.user_id}'s hash: ${isMatch ? '✓ MATCH' : '✗ NO MATCH'}`);
        } catch (err) {
          console.log(`   ✗ Error comparing: ${err.message}`);
        }
      }
    }
    console.log();

    // 4. Check College table
    console.log('4. Checking College table records...');
    const colleges = await prisma.college.findMany();
    console.log(`   Total colleges in DB: ${colleges.length}`);
    if (colleges.length > 0) {
      colleges.slice(0, 3).forEach(c => {
        console.log(`   - c_id: ${c.c_id}, c_name: ${c.c_name}`);
        console.log(`     Password exists: ${!!c.password}`);
        if (c.password) {
          console.log(`     Is bcrypt hash: ${/^\$2[aby]\$/.test(c.password)}`);
        }
      });
    }
    console.log();

    // 5. Test verifyPassword function
    console.log('5. Testing verifyPassword function...');
    const { verifyPassword, isBcryptHash } = require('./utils/accountSecurity');
    
    if (allUsers.length > 0 && allUsers[0].pass) {
      const testUser = allUsers[0];
      const hashCheck = isBcryptHash(testUser.pass);
      console.log(`   Hash format valid: ${hashCheck}`);
      
      if (hashCheck) {
        const admin123Match = await verifyPassword('admin123', testUser.pass);
        console.log(`   verifyPassword('admin123') on ${testUser.user_id}: ${admin123Match ? '✓ MATCH' : '✗ NO MATCH'}`);
      }
    }
    console.log();

    // 6. Simulate login endpoint logic
    console.log('6. Simulating login endpoint logic...');
    const testUserId = 'AD-0001';
    const testPassword = 'admin123';
    
    console.log(`   Looking for user with user_id: "${testUserId}"`);
    const systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { user_id: testUserId },
          { user_name: testUserId }
        ]
      }
    });

    if (systemUser) {
      console.log(`   ✓ Found: ${systemUser.user_id} (${systemUser.user_name})`);
      if (systemUser.pass) {
        const passwordValid = await bcrypt.compare(testPassword, systemUser.pass);
        console.log(`   Password "${testPassword}" valid: ${passwordValid ? '✓ YES' : '✗ NO'}`);
      } else {
        console.log(`   ✗ Password field is empty or null`);
      }
    } else {
      console.log(`   ✗ User not found`);
    }

  } catch (err) {
    console.error('Error during diagnostics:', err);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n========== END DIAGNOSTICS ==========\n');
}

testLogin();
