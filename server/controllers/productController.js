const { connectDB, sql } = require('../config/db');

const DEFAULT_GOLD_RATES = {
  gold_rate_18k: 11680,
  gold_rate_22k: 14275,
  gold_rate_24k: 15574,
  silver_rate: 266,
  gst_rate: 3,
  wastage_rate: 10,
};

async function ensureProductExtraColumns(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ItemCode')
    BEGIN
      ALTER TABLE Products ADD ItemCode NVARCHAR(100) NULL
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'HUIDHallmark')
    BEGIN
      ALTER TABLE Products ADD HUIDHallmark NVARCHAR(100) NULL
    END
  `);
}

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureProductExtraColumns(pool);
    const { category } = req.query;
    let query = `
      SELECT 
        p.Id AS id,
        p.Name AS name,
        p.Description AS description,
        p.CategoryId AS category_id,
        p.Weight AS weight,
        p.Purity AS purity,
        p.WastagePercentage AS wastage_percentage,
        p.MakingChargesPerGram AS making_charges,
        p.FixedMakingCharge AS fixed_making_charge,
        p.ItemCode AS item_code,
        p.HUIDHallmark AS huid_hallmark,
        p.IsAvailable AS is_active,
        p.ImageURL AS images,
        p.CreatedAt AS created_at,
        p.Material AS material,
        p.Style AS style,
        p.Gender AS gender,
        p.Occasion AS occasion,
        p.Collection AS collection,
        p.MetalColor AS metal_color,
        p.DiamondPrice AS diamond_price,
        p.OtherCharges AS other_charges,
        p.DiscountPercentage AS discount_percentage,
        c.Name AS category_name
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryId = c.Id
      WHERE p.IsAvailable = 1
    `;
    const request = pool.request();
    if (category) {
      if (/^\d+$/.test(category)) {
        query += ` AND p.CategoryId = @categoryId`;
        request.input('categoryId', sql.Int, category);
      } else {
        query += ` AND (LOWER(REPLACE(c.Name, ' ', '-')) = @categoryName OR LOWER(c.Name) = @categoryNameRaw OR c.Slug = @categoryNameSlug)`;
        request.input('categoryName', sql.NVarChar, category.toLowerCase());
        request.input('categoryNameRaw', sql.NVarChar, category.toLowerCase());
        request.input('categoryNameSlug', sql.NVarChar, category.toLowerCase());
      }
    }
    query += ` ORDER BY p.CreatedAt DESC`;
    const result = await request.query(query);
    res.status(200).json({ products: result.recordset });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single product by id
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    await ensureProductExtraColumns(pool);
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
         p.Id AS id,
         p.Name AS name,
         p.Description AS description,
         p.CategoryId AS category_id,
         c.Name AS category_name,
         p.Material AS material,
         p.Style AS style,
         p.Gender AS gender,
         p.Occasion AS occasion,
         p.Collection AS collection,
         p.MetalColor AS metal_color,
         p.Weight AS weight,
         p.Purity AS purity,
         p.WastagePercentage AS wastage_percentage,
         p.MakingChargesPerGram AS making_charges,
         p.FixedMakingCharge AS fixed_making_charge,
         p.DiamondPrice AS diamond_price,
         p.ItemCode AS item_code,
         p.HUIDHallmark AS huid_hallmark,
         p.ImageURL AS images
        FROM dbo.Products AS p
        LEFT JOIN dbo.Categories AS c
          ON c.Id = p.CategoryId
        WHERE p.IsAvailable = 1
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ product: result.recordset[0] });
  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT Id AS id, Name AS name, ImageURL AS image FROM Categories ORDER BY Name');
    res.status(200).json({ categories: result.recordset });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get gold rates
exports.getGoldRates = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        MAX(CASE WHEN Purity = '18K' THEN RatePerGram END) AS gold_rate_18k,
        MAX(CASE WHEN Purity = '22K' THEN RatePerGram END) AS gold_rate_22k,
        MAX(CASE WHEN Purity = '24K' THEN RatePerGram END) AS gold_rate_24k,
        MAX(CASE WHEN Purity = 'SILVER' THEN RatePerGram END) AS silver_rate,
        CAST(3 AS DECIMAL(18,2)) AS gst_rate,
        CAST(10 AS DECIMAL(18,2)) AS wastage_rate,
        MAX(UpdatedAt) AS updated_at
      FROM GoldRates
    `);

    const rates = result.recordset[0];
    if (!rates || (!rates.gold_rate_18k && !rates.gold_rate_22k && !rates.gold_rate_24k && !rates.silver_rate)) {
      // An empty GoldRates table is valid during initial setup.
      return res.status(200).json({ rates: DEFAULT_GOLD_RATES, usingDefaults: true });
    }

    res.status(200).json({ rates });
  } catch (error) {
    console.error('Get Gold Rates Error:', error);
    // Rates are display-only data. Keep the storefront usable when the database
    // is temporarily unavailable (for example, while an Azure firewall rule is
    // being updated for the hosted API).
    res.status(200).json({ rates: DEFAULT_GOLD_RATES, usingDefaults: true });
  }
};

// Create a product (admin)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount_price,
      category_id,
      material,
      weight,
      purity,
      making_charges,
      wastage_percentage,
      diamond_price,
      images,
      stock,
      is_featured
    } = req.body;
    
    const pool = await connectDB();
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('slug', sql.NVarChar, slug)
      .input('description', sql.NVarChar, description)
      .input('price', sql.Decimal(18, 2), price)
      .input('discount_price', sql.Decimal(18, 2), discount_price || null)
      .input('category_id', sql.Int, category_id)
      .input('material', sql.NVarChar, material)
      .input('weight', sql.Decimal(10, 2), weight)
      .input('purity', sql.NVarChar, purity)
      .input('making_charges', sql.Decimal(18, 2), making_charges || 0)
      .input('wastage_percentage', sql.Decimal(5, 2), wastage_percentage || 10)
      .input('diamond_price', sql.Decimal(18, 2), diamond_price || 0)
      .input('images', sql.NVarChar, images)
      .input('stock', sql.Int, stock || 0)
      .input('is_featured', sql.Bit, is_featured || 0)
      .query(`
        INSERT INTO Products (
          name, slug, description, price, discount_price, category_id, material, weight, 
          purity, making_charges, wastage_percentage, diamond_price, images, stock, is_featured
        )
        OUTPUT inserted.*
        VALUES (
          @name, @slug, @description, @price, @discount_price, @category_id, @material, 
          @weight, @purity, @making_charges, @wastage_percentage, @diamond_price, 
          @images, @stock, @is_featured
        )
      `);
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      product: result.recordset[0] 
    });
    
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
