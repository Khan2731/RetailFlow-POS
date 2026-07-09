require('dotenv').config();
const fetch = global.fetch || require('node-fetch');
const BASE = 'http://localhost:3000/api';

const results = [];

async function request(path, opts = {}){
  const res = await fetch(`${BASE}${path}`, opts);
  let body;
  try{ body = await res.json(); }catch(e){ body = null; }
  return { status: res.status, body };
}

async function login(username, password){
  const res = await request('/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
  return res;
}

function addResult(name, pass, info){ results.push({ name, pass, info }); }

async function run(){
  console.log('Logging in as manager, cashier, chef');
  const mgr = await login('sabirkhan','Khan2731');
  const cashier = await login('lisa','password123');
  const chef = await login('emily','password123');

  const mgrToken = mgr.status===200 && mgr.body.token ? mgr.body.token : null;
  const cashierToken = cashier.status===200 && cashier.body.token ? cashier.body.token : null;
  const chefToken = chef.status===200 && chef.body.token ? chef.body.token : null;

  addResult('login-manager', !!mgrToken, mgr);
  addResult('login-cashier', !!cashierToken, cashier);
  addResult('login-chef', !!chefToken, chef);

  // PRODUCTS CRUD (admin only)
  console.log('\nProducts CRUD');
  const newProd = { name: 'Test Product', category: 'TestCat', base_price: 99.99 };
  const createAsMgr = await request('/products', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify(newProd) });
  addResult('product-create-as-manager', createAsMgr.status===201, createAsMgr);

  const createAsCashier = await request('/products', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify(newProd) });
  addResult('product-create-as-cashier-should-403', createAsCashier.status===403, createAsCashier);

  const prodId = createAsMgr.body && createAsMgr.body.product ? createAsMgr.body.product.id : (createAsMgr.body && createAsMgr.body.id ? createAsMgr.body.id : null);

  // Update product as manager
  const updated = { name: 'Test Product Updated', category: 'TestCat', base_price: 119.99 };
  const updateAsMgr = await request(`/products/${prodId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify(updated) });
  addResult('product-update-as-manager', updateAsMgr.status===200, updateAsMgr);

  // Delete as cashier should fail
  const deleteAsCashier = await request(`/products/${prodId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${cashierToken}` } });
  addResult('product-delete-as-cashier-should-403', deleteAsCashier.status===403, deleteAsCashier);

  // Delete as manager
  const deleteAsMgr = await request(`/products/${prodId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${mgrToken}` } });
  addResult('product-delete-as-manager', deleteAsMgr.status===200, deleteAsMgr);

  // CATEGORIES: emulate via Products category field
  console.log('\nCategories via Products');
  const catProd = { name: 'Cat Product', category: 'CategoryTest', base_price: 10 };
  const catCreate = await request('/products', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify(catProd) });
  addResult('category-create-via-product', catCreate.status===201, catCreate);
  const catId = catCreate.body.product.id;
  const catUpdate = await request(`/products/${catId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ name: 'Cat Product', category: 'CategoryUpdated', base_price: 12 }) });
  addResult('category-update-via-product', catUpdate.status===200, catUpdate);
  const catDelete = await request(`/products/${catId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${mgrToken}` } });
  addResult('category-delete-via-product', catDelete.status===200, catDelete);

  // ORDERS CRUD (auth required)
  console.log('\nOrders CRUD');
  const orderCreate = await request('/orders', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify({ table_no: 99, waiter_name: 'Test Waiter', status: 'pending' }) });
  addResult('order-create', orderCreate.status===201, orderCreate);
  const orderId = orderCreate.body.order.id;

  const orderUpdate = await request(`/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${chefToken}` }, body: JSON.stringify({ table_no: 99, waiter_name: 'Updated Waiter', status: 'in_progress' }) });
  addResult('order-update', orderUpdate.status===200, orderUpdate);

  // Hold, Resume, Complete, Cancel via status patch
  const hold = await request(`/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${chefToken}` }, body: JSON.stringify({ status: 'on_hold' }) });
  addResult('order-hold', hold.status===200, hold);
  const resume = await request(`/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${chefToken}` }, body: JSON.stringify({ status: 'in_progress' }) });
  addResult('order-resume', resume.status===200, resume);
  const complete = await request(`/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${chefToken}` }, body: JSON.stringify({ status: 'completed' }) });
  addResult('order-complete', complete.status===200, complete);
  const cancel = await request(`/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${chefToken}` }, body: JSON.stringify({ status: 'canceled' }) });
  addResult('order-cancel', cancel.status===200, cancel);

  // Delete order
  const deleteOrder = await request(`/orders/${orderId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${mgrToken}` } });
  addResult('order-delete', deleteOrder.status===200, deleteOrder);

  // CUSTOMERS -> Delivery CRUD (auth required)
  console.log('\nDelivery (customers) CRUD');
  // need an existing order id; create one
  const o = await request('/orders', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify({ table_no: 20, waiter_name: 'Del Waiter' }) });
  const oId = o.body.order.id;
  const deliveryCreate = await request('/delivery', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify({ order_id: oId, customer_name: 'Cust', address: 'Addr', phone: '555', delivery_fee: 50 }) });
  addResult('delivery-create', deliveryCreate.status===201, deliveryCreate);
  const deliveryId = deliveryCreate.body.delivery.id;
  const deliveryUpdate = await request(`/delivery/${deliveryId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${cashierToken}` }, body: JSON.stringify({ customer_name: 'Cust2', address: 'Addr2', phone: '5555', delivery_fee: 60 }) });
  addResult('delivery-update', deliveryUpdate.status===200, deliveryUpdate);
  const deliveryDelete = await request(`/delivery/${deliveryId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${cashierToken}` } });
  addResult('delivery-delete', deliveryDelete.status===200, deliveryDelete);

  // STAFF CRUD (admin only)
  console.log('\nStaff CRUD');
  const unique = Date.now();
  const username = `teststaff_${unique}`;
  const staffCreate = await request('/staff', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ name: 'Test Staff', username, password: 'secretpwd', role: 'waiter', shift: 'morning' }) });
  addResult('staff-create-as-manager', staffCreate.status===201, staffCreate);
  const staffId = staffCreate.body.staff ? staffCreate.body.staff.id : (staffCreate.body.id || null);
  const staffUpdate = await request(`/staff/${staffId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ name: 'Test Staff Updated', username, role: 'waiter', shift: 'evening' }) });
  addResult('staff-update-as-manager', staffUpdate.status===200, staffUpdate);
  const staffDeleteFail = await request(`/staff/${staffId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${cashierToken}` } });
  addResult('staff-delete-as-cashier-should-403', staffDeleteFail.status===403, staffDeleteFail);
  const staffDelete = await request(`/staff/${staffId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${mgrToken}` } });
  addResult('staff-delete-as-manager', staffDelete.status===200, staffDelete);

  // INVENTORY CRUD (admin only)
  console.log('\nInventory CRUD');
  const invCreate = await request('/inventory', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ item_name: 'Test Item', quantity: 5, unit: 'kg' }) });
  addResult('inventory-create', invCreate.status===201, invCreate);
  const invId = invCreate.body.inventory ? invCreate.body.inventory.id : invCreate.body.id;
  const invUpdate = await request(`/inventory/${invId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ item_name: 'Test Item', quantity: 7, unit: 'kg' }) });
  addResult('inventory-update', invUpdate.status===200, invUpdate);
  const invDelete = await request(`/inventory/${invId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${mgrToken}` } });
  addResult('inventory-delete', invDelete.status===200, invDelete);

  // EXPENSES CRUD (admin only)
  console.log('\nExpenses CRUD');
  const expCreate = await request('/expenses', { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ category: 'TestExp', description: 'desc', amount: 123.45 }) });
  addResult('expense-create', expCreate.status===201, expCreate);
  const expId = expCreate.body.expense ? expCreate.body.expense.id : expCreate.body.id;
  const expUpdate = await request(`/expenses/${expId}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ category: 'TestExpUpdated', description: 'desc2', amount: 200 }) });
  addResult('expense-update', expUpdate.status===200, expUpdate);
  const expDelete = await request(`/expenses/${expId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${mgrToken}` } });
  addResult('expense-delete', expDelete.status===200, expDelete);

  // SETTINGS CRUD
  console.log('\nSettings CRUD');
  const settingsUpdate = await request('/settings', { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': `Bearer ${mgrToken}` }, body: JSON.stringify({ restaurant_name: 'PizzaHub', tagline: 'Best Pizza in Town', contact_number: '03135002259' }) });
  addResult('settings-update', settingsUpdate.status===200, settingsUpdate);

  // Final report
  console.log('\nTest Results:');
  let failed = 0;
  for (const r of results){
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(`${status} - ${r.name} -> ${JSON.stringify(r.info).slice(0,200)}`);
    if (!r.pass) failed++;
  }
  console.log(`\nSummary: ${results.length - failed} passed, ${failed} failed`);
  process.exit(failed===0?0:1);
}

run();
