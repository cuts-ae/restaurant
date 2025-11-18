/**
 * Quick Portal Status Check Script
 * Checks if portals are accessible and basic health
 */

const http = require('http');

const portals = [
  { name: 'Restaurant Portal', port: 45002, path: '/login' },
  { name: 'Admin Portal', port: 45003, path: '/login' },
  { name: 'Support Portal', port: 45004, path: '/login' }
];

function checkPortal(portal) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: portal.port,
      path: portal.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const status = {
          name: portal.name,
          port: portal.port,
          accessible: true,
          statusCode: res.statusCode,
          ok: res.statusCode === 200,
          contentLength: data.length,
          hasError: data.includes('Internal Server Error') || data.includes('500')
        };
        resolve(status);
      });
    });

    req.on('error', (error) => {
      resolve({
        name: portal.name,
        port: portal.port,
        accessible: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: portal.name,
        port: portal.port,
        accessible: false,
        error: 'Connection timeout'
      });
    });

    req.end();
  });
}

async function checkAll() {
  console.log('Checking portal status...\n');
  console.log('='.repeat(60));

  const results = await Promise.all(portals.map(checkPortal));

  results.forEach(result => {
    console.log(`\n${result.name} (Port ${result.port}):`);
    console.log('-'.repeat(40));

    if (!result.accessible) {
      console.log(`  Status: NOT RUNNING`);
      console.log(`  Error: ${result.error}`);
    } else if (result.hasError) {
      console.log(`  Status: RUNNING (WITH ERRORS)`);
      console.log(`  HTTP Status: ${result.statusCode}`);
      console.log(`  Error: Internal Server Error detected`);
    } else if (result.ok) {
      console.log(`  Status: RUNNING`);
      console.log(`  HTTP Status: ${result.statusCode}`);
      console.log(`  Content Length: ${result.contentLength} bytes`);
    } else {
      console.log(`  Status: RUNNING (UNEXPECTED STATUS)`);
      console.log(`  HTTP Status: ${result.statusCode}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\nSummary:');
  const running = results.filter(r => r.accessible).length;
  const ok = results.filter(r => r.ok && !r.hasError).length;
  const errors = results.filter(r => r.hasError).length;
  const notRunning = results.filter(r => !r.accessible).length;

  console.log(`  Running: ${running}/${portals.length}`);
  console.log(`  OK: ${ok}/${portals.length}`);
  console.log(`  With Errors: ${errors}`);
  console.log(`  Not Running: ${notRunning}`);
}

checkAll().catch(console.error);
