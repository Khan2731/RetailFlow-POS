require('dotenv').config();
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const token = jwt.sign({ id: 1, role: 'manager' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    const resp = await fetch('http://localhost:3000/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Staff',
        username: 'teststaff123',
        password: 'secret123',
        role: 'waiter',
        shift: 'morning',
        salary: 1000,
        phone: '0123456789',
        email: 'test@example.com',
        notes: 'test'
      })
    });
    const data = await resp.json();
    console.log('status', resp.status);
    console.log('body', data);
  } catch (err) {
    console.error('err', err);
  }
})();
