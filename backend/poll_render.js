async function poll() {
  console.log('Polling /api/leave/debug-push-env...');
  while (true) {
    try {
      const res = await fetch('https://sjs-school.onrender.com/api/leave/debug-push-env');
      if (res.status === 200) {
        const data = await res.json();
        console.log('DEPLOYMENT LIVE! Response:', data);
        break;
      } else {
        console.log(`Status ${res.status}. Waiting 10s...`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}. Waiting 10s...`);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}
poll();
