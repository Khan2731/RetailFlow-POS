import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductBasePrice, getProductDisplayPrice, getProductSizePrice } from './productPricing.js';

test('returns the smallest configured size price for sized products', () => {
  const product = {
    base_price: 1000,
    has_sizes: true,
    small_price: 1200,
    medium_price: 1400,
    large_price: 1600,
    xl_price: 1800,
  };

  assert.equal(getProductBasePrice(product), 1000);
  assert.equal(getProductDisplayPrice(product), 1200);
  assert.equal(getProductSizePrice(product, 'xl'), 1800);
});

test('falls back to base price when size-specific prices are missing', () => {
  const product = {
    base_price: 1100,
    has_sizes: true,
    small_price: null,
    medium_price: null,
    large_price: null,
    xl_price: null,
  };

  assert.equal(getProductBasePrice(product), 1100);
  assert.equal(getProductDisplayPrice(product), 1100);
  assert.equal(getProductSizePrice(product, 'xl'), 1100);
});

test('treats empty strings as missing values and uses the base price', () => {
  const product = {
    base_price: 1400,
    has_sizes: true,
    small_price: '',
    medium_price: '',
    large_price: '',
    xl_price: '',
  };

  assert.equal(getProductBasePrice(product), 1400);
  assert.equal(getProductDisplayPrice(product), 1400);
  assert.equal(getProductSizePrice(product, 'large'), 1400);
});

test('uses the available size prices and only falls back to base price when no size values exist', () => {
  const product = {
    base_price: 1600,
    has_sizes: true,
    small_price: '',
    medium_price: '',
    large_price: 2200,
    xl_price: 2600,
  };

  assert.equal(getProductDisplayPrice(product), 2200);
  assert.equal(getProductSizePrice(product, 'large'), 2200);
  assert.equal(getProductSizePrice(product, 'small'), 1600);
});
