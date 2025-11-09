const { spawn, execSync } = require('child_process');
const path = require('path');

async function runFailureTest() {
  console.log('Starting STEP 8 Failure Test: Verify Retries & Failed States');

  // Start worker with FORCE_FAIL=1
  const worker = spawn('npx', ['ts-node-dev', '--transpile-only', 'src/worker/orderWorker.ts'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: { ...process.env, FORCE_FAIL: '1' }
  });

  worker.stdout.on('data', (data) => console.log('Worker:', data.toString().trim()));
  worker.stderr.on('data', (data) => console.log('Worker Error:', data.toString().trim()));

  // Start server
  const server = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', 'src/server.ts'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  server.stdout.on('data', (data) => console.log('Server:', data.toString().trim()));
  server.stderr.on('data', (data) => console.log('Server Error:', data.toString().trim()));

  // Wait for services to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Create order
    console.log('Creating order...');
    const curl = spawn('curl', [
      '-X', 'POST',
      'http://localhost:3000/api/orders/execute',
      '-H', 'Content-Type: application/json',
      '-d', '{"orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amount":1}',
      '-s'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let orderId = '';
    curl.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/"orderId":"([^"]+)"/);
      if (match) orderId = match[1];
    });

    await new Promise((resolve, reject) => {
      curl.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Curl failed with code ${code}`));
      });
    });

    console.log(`Order created: ${orderId}`);

    // Wait for retries (3 attempts + backoff ~ 1+2+4 = 7s + processing)
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Check DB
    console.log('Checking DB...');
    const dbOutput = execSync('PGPASSWORD=postgres psql -h localhost -U postgres -d dex_orders -c "SELECT id, status, chosen_dex, executed_price, tx_hash, failed_reason FROM orders ORDER BY created_at DESC LIMIT 1;"', { encoding: 'utf8' });

    console.log('DB Result:');
    console.log(dbOutput);

    // Check if failed
    if (dbOutput.includes('failed') && dbOutput.includes('Simulated execution failure')) {
      console.log('✅ Test 2 PASSED: Order failed after retries with correct reason');
    } else {
      console.log('❌ Test 2 FAILED: Order not failed as expected');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    // Kill processes
    try {
      process.kill(-worker.pid);
      process.kill(-server.pid);
    } catch (e) {}
  }
}

runFailureTest();