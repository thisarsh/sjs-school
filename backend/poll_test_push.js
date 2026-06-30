async function poll() {
  console.log('Polling /api/leave/test-push...');
  while (true) {
    try {
      const res = await fetch('https://sjs-school.onrender.com/api/leave/test-push');
      if (res.status === 200) {
        const text = await res.text();
        if (!text.includes('Cannot GET')) {
          console.log('DEPLOYMENT LIVE! Response:', text);
          break;
        } else {
          console.log(`Still getting HTML...`);
        }
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
