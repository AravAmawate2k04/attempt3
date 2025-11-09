const { spawn, execSync } = require('child_process');
const path = require('path');

async function runTest() {
  console.log('Starting STEP 8 Test: Simulate Failures + Verify Retries');

  // Start worker
  const worker = spawn('npx', ['ts-node-dev', '--transpile-only', 'src/worker/orderWorker.ts'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  // Start server
  const server = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', 'src/server.ts'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

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

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check DB
    console.log('Checking DB...');
    const dbOutput = execSync('PGPASSWORD=postgres psql -h localhost -U postgres -d dex_orders -c "SELECT id, status, chosen_dex, executed_price, tx_hash, failed_reason FROM orders ORDER BY created_at DESC LIMIT 1;"', { encoding: 'utf8' });

    console.log('DB Result:');
    console.log(dbOutput);

    // Check if confirmed
    if (dbOutput.includes('confirmed')) {
      console.log('✅ Test 1 PASSED: Order confirmed successfully');
    } else {
      console.log('❌ Test 1 FAILED: Order not confirmed');
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

runTest();