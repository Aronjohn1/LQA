// Simple login API test
async function testLoginEndpoint() {
  console.log('\n========== TESTING LOGIN ENDPOINT ==========\n');

  const testCases = [
    { user_id: 'AD-0001', password: 'admin123', name: 'Admin user with correct password' },
    { user_id: 'admin', password: 'admin123', name: 'Admin by username with correct password' },
    { user_id: 'AD-0001', password: 'wrong', name: 'Admin user with wrong password' },
  ];

  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log(`  Sending: { user_id: "${test.user_id}", password: "${test.password}" }`);

    try {
      const response = await fetch('http://localhost:1000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: test.user_id,
          password: test.password
        })
      });

      const data = await response.json();
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Response:`, JSON.stringify(data, null, 2));
      
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }

    console.log();
  }

  console.log('========== END TEST ==========\n');
  process.exit(0);
}

testLoginEndpoint().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
