require('dotenv').config();
const fetch = global.fetch || require('node-fetch');
const BASE = 'http://localhost:3000/api';

async function run() {
  try {
    console.log('1) Logging in as default admin');
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sabirkhan', password: 'Khan2731' })
    });
    const loginJson = await loginRes.json();
    console.log('Login status:', loginRes.status);
    if (!loginRes.ok) { console.error(loginJson); return; }
    const token = loginJson.token;

    console.log('\n2) GET /products (public)');
    const productsRes = await fetch(`${BASE}/products`);
    console.log('Status:', productsRes.status);
    console.log('Body sample:', JSON.stringify(await productsRes.json()).slice(0,500));

    console.log('\n3) GET /orders (public)');
    const ordersRes = await fetch(`${BASE}/orders`);
    console.log('Status:', ordersRes.status);
    console.log('Body sample:', JSON.stringify(await ordersRes.json()).slice(0,500));

    console.log('\n4) GET /staff (protected)');
    const staffRes = await fetch(`${BASE}/staff`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Status:', staffRes.status);
    console.log('Body sample:', JSON.stringify(await staffRes.json()).slice(0,500));

    console.log('\n5) GET /inventory (protected)');
    const invRes = await fetch(`${BASE}/inventory`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Status:', invRes.status);
    console.log('Body sample:', JSON.stringify(await invRes.json()).slice(0,500));

    console.log('\nSmoke tests completed');
  } catch (err) {
    console.error('Smoke test error:', err);
  }
}

run();
