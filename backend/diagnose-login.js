#!/usr/bin/env node
/**
 * LOGIN DIAGNOSTIC SCRIPT
 * Run this to identify login issues in the LQA System
 * 
 * Usage: node diagnose-login.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const chalk = require('chalk');

const prisma = new PrismaClient();

// Simple colored output (fallback if chalk not available)
const colors = {
  green: (s) => `✓ ${s}`,
  red: (s) => `✗ ${s}`,
  yellow: (s) => `⚠ ${s}`,
  blue: (s) => `ℹ ${s}`,
};

async function diagnose() {
  console.log('\n' + '='.repeat(60));
  console.log('LOGIN SYSTEM DIAGNOSTIC TOOL');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Database Connection
    console.log('Step 1: Testing Database Connection...');
    await prisma.$connect();
    console.log(colors.green('Database connected successfully\n'));

    // Step 2: Check User Table
    console.log('Step 2: Checking System User Accounts...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} system user(s):\n`);

    if (users.length === 0) {
      console.log(colors.yellow('No users found! Please run: npm run seed\n'));
    } else {
      for (const user of users) {
        console.log(`  User ID: ${user.user_id}`);
        console.log(`  Username: ${user.user_name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Password Hash Present: ${!!user.pass ? 'Yes' : 'No'}`);
        if (user.pass) {
          const isBcrypt = /^\$2[aby]\$/.test(user.pass);
          console.log(`  Is Bcrypt Hash: ${isBcrypt ? 'Yes' : 'No'}`);
        }
        console.log();
      }
    }

    // Step 3: Test Password Verification
    console.log('Step 3: Testing Password Verification...');
    const testCases = [
      { user_id: 'AD-0001', password: 'admin123', desc: 'Default Admin' },
      { user_id: 'LB-00001', password: 'librarian123', desc: 'Default Librarian' },
    ];

    for (const testCase of testCases) {
      const user = await prisma.user.findFirst({
        where: { user_id: testCase.user_id }
      });

      if (!user) {
        console.log(colors.yellow(`${testCase.desc} (${testCase.user_id}) not found`));
      } else if (!user.pass) {
        console.log(colors.red(`${testCase.desc} has no password hash`));
      } else {
        try {
          const isMatch = await bcrypt.compare(testCase.password, user.pass);
          if (isMatch) {
            console.log(colors.green(`${testCase.desc} password correct`));
          } else {
            console.log(colors.red(`${testCase.desc} password incorrect`));
          }
        } catch (err) {
          console.log(colors.red(`Error testing ${testCase.desc}: ${err.message}`));
        }
      }
    }
    console.log();

    // Step 4: Check Other User Tables
    console.log('Step 4: Checking User Tables (College, Senior, etc.)...');
    const tables = [
      { name: 'College', idField: 'c_id', nameField: 'c_name' },
      { name: 'Senior', idField: 's_id', nameField: 's_name' },
      { name: 'Junior', idField: 'j_id', nameField: 'j_name' },
      { name: 'Elementary', idField: 'e_id', nameField: 'e_name' },
      { name: 'Teacher', idField: 't_id', nameField: 't_name' },
      { name: 'Instructor', idField: 'i_id', nameField: 'i_name' },
    ];

    for (const table of tables) {
      const count = await prisma[table.name.toLowerCase()].count();
      const hasPassword = count > 0;
      
      if (count > 0) {
        const sample = await prisma[table.name.toLowerCase()].findFirst();
        const hasHash = sample && sample.password && /^\$2[aby]\$/.test(sample.password);
        console.log(`  ${table.name}: ${count} user(s) ${hasHash ? '(passwords hashed ✓)' : '(check passwords)'}`);
      } else {
        console.log(`  ${table.name}: No users`);
      }
    }
    console.log();

    // Step 5: Verify Environment
    console.log('Step 5: Checking Environment...');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? 'Set ✓' : 'Not set ✗'}`);
    console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗'}`);
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60) + '\n');

    const hasUsers = users.length > 0;
    const hasValidPasswords = users.every(u => u.pass && /^\$2[aby]\$/.test(u.pass));

    if (hasUsers && hasValidPasswords) {
      console.log(colors.green('System appears to be configured correctly!'));
      console.log('\nIf you still cannot login:');
      console.log('  1. Check that you are using the correct User ID');
      console.log('  2. Check that your password is correct');
      console.log('  3. Verify the backend server is running on port 1000');
      console.log('  4. Check browser console for frontend errors');
    } else if (!hasUsers) {
      console.log(colors.red('No users found in database!'));
      console.log('Please run: node seed-admin-librarian.js');
    } else {
      console.log(colors.yellow('Some users have invalid passwords!'));
      console.log('Please check the password hashes in the database');
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (err) {
    console.error(colors.red(`Error: ${err.message}`));
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
