const db = require('../config/database');

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants)) return [];

  return variants
    .map((variant) => ({
      size_name: typeof variant?.size_name === 'string' ? variant.size_name.trim() : '',
      price: Number(variant?.price),
    }))
    .filter((variant) => variant.size_name && Number.isFinite(variant.price) && variant.price >= 0 && variant.price > 0);
};

const buildVariantPayload = async (productId, variants) => {
  await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

  for (const variant of variants) {
    await db.query(
      'INSERT INTO product_variants (product_id, size_name, price, active) VALUES ($1, $2, $3, $4)',
      [productId, variant.size_name, variant.price, true]
    );
  }
};

const serializeProduct = (row) => ({
  ...row,
  variants: Array.isArray(row.variants) ? row.variants : [],
  has_sizes: Boolean(row.has_sizes || (Array.isArray(row.variants) && row.variants.length > 0)),
});

const getAllProducts = async (req, res) => {
  const sql = `
    SELECT p.*, COALESCE(
      (
        SELECT json_agg(
          json_build_object('id', pv.id, 'product_id', pv.product_id, 'size_name', pv.size_name, 'price', pv.price, 'active', pv.active)
        )
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.active = TRUE
      ),
      '[]'::json
    ) AS variants
    FROM Products p
    ORDER BY p.category, p.name
  `;
  try {
    const result = await db.query(sql);
    res.json(result.rows.map(serializeProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  const sql = `
    SELECT p.*, COALESCE(
      (
        SELECT json_agg(
          json_build_object('id', pv.id, 'product_id', pv.product_id, 'size_name', pv.size_name, 'price', pv.price, 'active', pv.active)
        )
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.active = TRUE
      ),
      '[]'::json
    ) AS variants
    FROM Products p
    WHERE p.id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(serializeProduct(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductsByCategory = async (req, res) => {
  const sql = `
    SELECT p.*, COALESCE(
      (
        SELECT json_agg(
          json_build_object('id', pv.id, 'product_id', pv.product_id, 'size_name', pv.size_name, 'price', pv.price, 'active', pv.active)
        )
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.active = TRUE
      ),
      '[]'::json
    ) AS variants
    FROM Products p
    WHERE p.category = $1
    ORDER BY p.name
  `;
  try {
    const result = await db.query(sql, [req.params.category]);
    res.json(result.rows.map(serializeProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProduct = async (req, res) => {
  const { name, category, base_price, has_sizes, variants } = req.body;
  const price = req.body.price || base_price;
  const normalizedHasSizes = Boolean(has_sizes || (Array.isArray(variants) && variants.length > 0));
  const parsedBasePrice = price !== undefined && price !== null ? parseFloat(price) : null;
  const normalizedVariants = normalizeVariants(variants);
  const effectiveBasePrice = parsedBasePrice ?? (normalizedVariants.length ? Math.min(...normalizedVariants.map((variant) => variant.price)) : null);

  const sql = `INSERT INTO Products (name, category, base_price, has_sizes, small_price, medium_price, large_price, xl_price) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
  try {
    await db.query('BEGIN');
    const result = await db.query(sql, [
      name,
      category,
      effectiveBasePrice,
      normalizedHasSizes,
      null,
      null,
      null,
      null,
    ]);

    const productId = result.rows[0].id;
    await buildVariantPayload(productId, normalizedVariants);
    await db.query('COMMIT');

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: productId,
        name,
        category,
        base_price: effectiveBasePrice,
        has_sizes: normalizedHasSizes,
        variants: normalizedVariants,
      },
    });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const { name, category, base_price, has_sizes, variants } = req.body;
  const price = req.body.price || base_price;
  const normalizedHasSizes = Boolean(has_sizes || (Array.isArray(variants) && variants.length > 0));
  const parsedBasePrice = price !== undefined && price !== null ? parseFloat(price) : null;
  const normalizedVariants = normalizeVariants(variants);
  const effectiveBasePrice = parsedBasePrice ?? (normalizedVariants.length ? Math.min(...normalizedVariants.map((variant) => variant.price)) : null);

  const sql = `UPDATE Products 
               SET name = $1, category = $2, base_price = $3, has_sizes = $4, small_price = $5, medium_price = $6, large_price = $7, xl_price = $8, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $9 RETURNING id`;
  try {
    await db.query('BEGIN');
    const result = await db.query(sql, [
      name,
      category,
      effectiveBasePrice,
      normalizedHasSizes,
      null,
      null,
      null,
      null,
      req.params.id,
    ]);

    if (!result.rows || result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    await buildVariantPayload(req.params.id, normalizedVariants);
    await db.query('COMMIT');

    res.json({
      message: 'Product updated successfully',
      product: {
        id: req.params.id,
        name,
        category,
        base_price: effectiveBasePrice,
        has_sizes: normalizedHasSizes,
        variants: normalizedVariants,
      },
    });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  const sql = 'DELETE FROM Products WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
};
