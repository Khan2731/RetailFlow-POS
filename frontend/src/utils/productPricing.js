const parseNumericPrice = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

export const normalizePrice = (value) => {
  const parsedValue = parseNumericPrice(value);
  return parsedValue !== null ? parsedValue : 0;
};

const getFirstPositivePrice = (...values) => {
  for (const value of values) {
    const parsedValue = parseNumericPrice(value);
    if (parsedValue !== null && parsedValue > 0) {
      return parsedValue;
    }
  }

  return null;
};

const normalizeVariantSize = (value) => {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (['small', 's'].includes(normalized)) return 'small';
  if (['medium', 'm'].includes(normalized)) return 'medium';
  if (['large', 'l', 'lg'].includes(normalized)) return 'large';
  if (['xl', 'xlarge', 'x-large', 'extra large'].includes(normalized)) return 'xl';
  return normalized;
};

const getProductVariants = (product) => {
  if (!product || !Array.isArray(product.variants)) return [];
  return product.variants.filter((variant) => {
    const parsedPrice = parseNumericPrice(variant?.price);
    return parsedPrice !== null && parsedPrice > 0;
  });
};

export const getProductBasePrice = (product) => {
  if (!product) return 0;

  const variantPrices = getProductVariants(product).map((variant) => parseNumericPrice(variant.price));
  if (variantPrices.length > 0) {
    const positivePrices = variantPrices.filter((value) => value !== null && value > 0);
    if (positivePrices.length > 0) return Math.min(...positivePrices);
  }

  const basePrice = getFirstPositivePrice(product.base_price, product.price);
  if (basePrice !== null) return basePrice;

  return getFirstPositivePrice(
    product.xl_price,
    product.large_price,
    product.medium_price,
    product.small_price,
  ) ?? 0;
};

export const getProductDisplayPrice = (product) => {
  if (!product) return 0;

  const variantPrices = getProductVariants(product).map((variant) => parseNumericPrice(variant.price));
  const positiveVariantPrices = variantPrices.filter((value) => value !== null && value > 0);
  if (positiveVariantPrices.length) {
    return Math.min(...positiveVariantPrices);
  }

  if (product.has_sizes) {
    const sizePrices = [
      product.small_price,
      product.medium_price,
      product.large_price,
      product.xl_price,
    ]
      .map((value) => parseNumericPrice(value))
      .filter((value) => value !== null && value > 0);

    if (sizePrices.length) {
      return Math.min(...sizePrices);
    }
  }

  return getProductBasePrice(product);
};

export const getProductSizePrice = (product, size) => {
  if (!product) return 0;

  const normalizedRequestedSize = normalizeVariantSize(size);
  const matchingVariant = getProductVariants(product).find((variant) => {
    const normalizedVariantSize = normalizeVariantSize(variant?.size_name);
    return normalizedVariantSize && normalizedVariantSize === normalizedRequestedSize;
  });

  if (matchingVariant) {
    const parsedVariantPrice = parseNumericPrice(matchingVariant.price);
    if (parsedVariantPrice !== null && parsedVariantPrice > 0) {
      return parsedVariantPrice;
    }
  }

  const explicitSizePrice = (() => {
    switch (normalizedRequestedSize) {
      case 'small':
        return product.small_price;
      case 'medium':
        return product.medium_price;
      case 'large':
        return product.large_price;
      case 'xl':
        return product.xl_price;
      default:
        return null;
    }
  })();

  const parsedExplicitPrice = parseNumericPrice(explicitSizePrice);
  if (parsedExplicitPrice !== null && parsedExplicitPrice > 0) {
    return parsedExplicitPrice;
  }

  return getProductBasePrice(product);
};
