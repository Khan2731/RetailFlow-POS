const jwt = require('jsonwebtoken');
require('dotenv').config();

(async () => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ id: 1, role: 'staff' }, secret, { expiresIn: '1h' });

    const resp = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        table_no: 0,
        waiter_name: 'Walk-in',
        status: 'completed',
        order_type: 'take_away'
      })
    });

    const data = await resp.json();
    console.log('Response status:', resp.status);
    console.log('Response data:', data);
  } catch (err) {
    console.error('Request failed:', err.message || err);
  }
})();
