const parseNumericPrice = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getResolvedProductPrice = (product, size) => {
  if (!product) return 0;

  const normalizedSize = typeof size === 'string' ? size.toLowerCase() : '';

  const variantList = Array.isArray(product.variants) ? product.variants : [];
  const matchingVariant = variantList.find((variant) => {
    const variantName = typeof variant?.size_name === 'string' ? variant.size_name.toLowerCase() : '';
    return variantName === normalizedSize || variantName === `${normalizedSize} size`;
  });

  if (matchingVariant) {
    const parsedVariantPrice = parseNumericPrice(matchingVariant.price);
    if (parsedVariantPrice !== null && parsedVariantPrice > 0) {
      return parsedVariantPrice;
    }
  }

  const priceCandidates = normalizedSize === 'small'
    ? [product.small_price, product.base_price, product.price]
    : normalizedSize === 'medium'
      ? [product.medium_price, product.base_price, product.price]
      : normalizedSize === 'large'
        ? [product.large_price, product.base_price, product.price]
        : normalizedSize === 'xl'
          ? [product.xl_price, product.large_price, product.base_price, product.price]
          : [product.base_price, product.price];

  for (const candidate of priceCandidates) {
    const parsedValue = parseNumericPrice(candidate);
    if (parsedValue !== null && parsedValue > 0) {
      return parsedValue;
    }
  }

  return 0;
};

const resolveOrderItemPrice = (orderItem, product) => {
  const parsedStoredPrice = parseNumericPrice(orderItem?.unit_price);
  if (parsedStoredPrice !== null && parsedStoredPrice > 0) {
    return parsedStoredPrice;
  }

  return getResolvedProductPrice(product, orderItem?.size);
};

module.exports = {
  parseNumericPrice,
  getResolvedProductPrice,
  resolveOrderItemPrice,
};
