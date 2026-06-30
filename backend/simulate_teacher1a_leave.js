async function simulateLeave() {
  try {
    console.log('Logging in as teacher1a@sjs...');
    const loginRes = await fetch('https://sjs-school.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher1a@sjs', password: '9876543211' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed:', await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful! Sending leave request...');

    const leaveRes = await fetch('https://sjs-school.onrender.com/api/leave', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'Sick Leave',
        fromDate: new Date().toISOString(),
        toDate: new Date().toISOString(),
        totalDays: 1,
        reason: 'Not feeling well today'
      })
    });

    console.log('Leave response status:', leaveRes.status);
    const leaveData = await leaveRes.json();
    console.log('Leave response data:', JSON.stringify(leaveData.pushResult, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

simulateLeave();
