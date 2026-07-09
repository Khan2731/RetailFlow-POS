const db = require('../config/database');

const getAllProducts = async (req, res) => {
  const sql = 'SELECT * FROM Products ORDER BY category, name';
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  const sql = 'SELECT * FROM Products WHERE id = $1';
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductsByCategory = async (req, res) => {
  const sql = 'SELECT * FROM Products WHERE category = $1 ORDER BY name';
  try {
    const result = await db.query(sql, [req.params.category]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProduct = async (req, res) => {
  const { name, category, base_price, has_sizes, small_price, medium_price, large_price } = req.body;
  const price = req.body.price || base_price;
  const normalizedHasSizes = has_sizes ? true : false;

  const parsedBasePrice = price !== undefined && price !== null ? parseFloat(price) : null;
  const parsedSmallPrice = small_price !== undefined && small_price !== null ? parseFloat(small_price) : null;
  const parsedMediumPrice = medium_price !== undefined && medium_price !== null ? parseFloat(medium_price) : null;
  const parsedLargePrice = large_price !== undefined && large_price !== null ? parseFloat(large_price) : null;

  const sql = `INSERT INTO Products (name, category, base_price, has_sizes, small_price, medium_price, large_price) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
  try {
    const result = await db.query(sql, [
      name,
      category,
      parsedBasePrice,
      normalizedHasSizes,
      parsedSmallPrice,
      parsedMediumPrice,
      parsedLargePrice,
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: result.rows[0].id,
        name,
        category,
        base_price: parsedBasePrice,
        has_sizes: normalizedHasSizes,
        small_price: parsedSmallPrice,
        medium_price: parsedMediumPrice,
        large_price: parsedLargePrice,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const { name, category, base_price, has_sizes, small_price, medium_price, large_price } = req.body;
  const price = req.body.price || base_price;
  const normalizedHasSizes = has_sizes ? true : false;
  const parsedBasePrice = price !== undefined && price !== null ? parseFloat(price) : null;
  const parsedSmallPrice = small_price !== undefined && small_price !== null ? parseFloat(small_price) : null;
  const parsedMediumPrice = medium_price !== undefined && medium_price !== null ? parseFloat(medium_price) : null;
  const parsedLargePrice = large_price !== undefined && large_price !== null ? parseFloat(large_price) : null;

  const sql = `UPDATE Products 
               SET name = $1, category = $2, base_price = $3, has_sizes = $4, 
                   small_price = $5, medium_price = $6, large_price = $7, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $8 RETURNING id`;
  try {
    const result = await db.query(sql, [
      name,
      category,
      parsedBasePrice,
      normalizedHasSizes,
      parsedSmallPrice,
      parsedMediumPrice,
      parsedLargePrice,
      req.params.id,
    ]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: {
        id: req.params.id,
        name,
        category,
        base_price: parsedBasePrice,
        has_sizes: normalizedHasSizes,
        small_price: parsedSmallPrice,
        medium_price: parsedMediumPrice,
        large_price: parsedLargePrice,
      },
    });
  } catch (err) {
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
