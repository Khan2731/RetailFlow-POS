const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveOrderItemPrice } = require('../utils/orderItemPricing');

test('prefers the stored unit price over product size fallback values', () => {
  const product = {
    base_price: 800,
    small_price: 0,
    medium_price: 1200,
    large_price: 1600,
    xl_price: 2000,
  };

  assert.equal(resolveOrderItemPrice({ unit_price: 1500, size: 'large' }, product), 1500);
});

test('falls back to the selected size price when the saved unit price is missing', () => {
  const product = {
    base_price: 800,
    small_price: 0,
    medium_price: 1200,
    large_price: 1600,
    xl_price: 2000,
  };

  assert.equal(resolveOrderItemPrice({ unit_price: 0, size: 'large' }, product), 1600);
});

test('uses a matching product variant price when the product has a variant list', () => {
  const product = {
    base_price: 800,
    variants: [
      { size_name: 'Small', price: 1000 },
      { size_name: 'Medium', price: 1500 },
      { size_name: 'Large', price: 2000 },
    ],
  };

  assert.equal(resolveOrderItemPrice({ unit_price: null, size: 'medium' }, product), 1500);
});

test('uses the base price when there is no valid size or stored price', () => {
  const product = {
    base_price: 800,
    small_price: 0,
    medium_price: 0,
    large_price: 0,
    xl_price: 0,
  };

  assert.equal(resolveOrderItemPrice({ unit_price: null, size: 'large' }, product), 800);
});
