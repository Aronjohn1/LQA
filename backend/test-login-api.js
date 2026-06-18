const http = require('http');

async function testLoginAPI() {
  console.log('\n========== TESTING LOGIN API ==========\n');

  const testCases = [
    { user_id: 'AD-0001', password: 'admin123', description: 'Admin user' },
    { user_id: 'LB-00001', password: 'librarian123', description: 'Librarian user' },
    { user_id: 'Admin', password: 'admin123', description: 'Admin by username' },
    { user_id: 'AD-0001', password: 'wrongpass', description: 'Admin with wrong password' },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.description}`);
    console.log(`  Input: user_id="${testCase.user_id}", password="${testCase.password}"`);

    const postData = JSON.stringify({
      user_id: testCase.user_id,
      password: testCase.password
    });

    const options = {
      hostname: 'localhost',
      port: 1000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve({
              status: res.statusCode,
              body: data
            });
          });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
      });

      console.log(`  Response Status: ${response.status}`);
      try {
        const parsed = JSON.parse(response.body);
        if (parsed.message) console.log(`  Message: ${parsed.message}`);
        if (parsed.token) console.log(`  Token: ${parsed.token.substring(0, 50)}...`);
        if (parsed.error) console.log(`  Error: ${parsed.error}`);
      } catch (e) {
        console.log(`  Body: ${response.body}`);
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }

    console.log();
  }

  console.log('========== END API TEST ==========\n');
}

testLoginAPI();
