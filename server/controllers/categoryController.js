const { connectDB, sql } = require('../config/db');

/*
  Adds category calculation columns automatically if they do not exist.
  Categories table currently uses:
  Id, Name and ImageURL.
*/
async function ensureCategoryColumns(pool) {
  await pool.request().query(`
    IF COL_LENGTH('dbo.Categories', 'Slug') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD Slug NVARCHAR(150) NULL;
    END;

    IF COL_LENGTH('dbo.Categories', 'Description') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD Description NVARCHAR(1000) NULL;
    END;

    IF COL_LENGTH('dbo.Categories', 'ParentCategoryId') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD ParentCategoryId INT NULL;
    END;

    IF COL_LENGTH('dbo.Categories', 'MenuGroup') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD MenuGroup NVARCHAR(100) NULL;
    END;

    IF COL_LENGTH('dbo.Categories', 'Material') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD Material NVARCHAR(50) NULL;
    END;

    IF COL_LENGTH('dbo.Categories', 'Purity') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD Purity NVARCHAR(20) NULL;
    END;

    IF COL_LENGTH('dbo.Categories', 'MakingChargesPerGram') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD MakingChargesPerGram DECIMAL(18,2) NOT NULL
      CONSTRAINT DF_Categories_MakingChargesPerGram DEFAULT 0;
    END;

    IF COL_LENGTH('dbo.Categories', 'WastagePercentage') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD WastagePercentage DECIMAL(5,2) NOT NULL
      CONSTRAINT DF_Categories_WastagePercentage DEFAULT 0;
    END;

    IF COL_LENGTH('dbo.Categories', 'GSTPercentage') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD GSTPercentage DECIMAL(5,2) NOT NULL
      CONSTRAINT DF_Categories_GSTPercentage DEFAULT 3;
    END;

    IF COL_LENGTH('dbo.Categories', 'DefaultDiamondPrice') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD DefaultDiamondPrice DECIMAL(18,2) NOT NULL
      CONSTRAINT DF_Categories_DefaultDiamondPrice DEFAULT 0;
    END;

    IF COL_LENGTH('dbo.Categories', 'CalculationType') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD CalculationType NVARCHAR(40) NOT NULL
      CONSTRAINT DF_Categories_CalculationType DEFAULT 'WEIGHT_BASED';
    END;

    IF COL_LENGTH('dbo.Categories', 'DisplayOrder') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD DisplayOrder INT NOT NULL
      CONSTRAINT DF_Categories_DisplayOrder DEFAULT 0;
    END;

    IF COL_LENGTH('dbo.Categories', 'IsActive') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD IsActive BIT NOT NULL
      CONSTRAINT DF_Categories_IsActive DEFAULT 1;
    END;

    IF COL_LENGTH('dbo.Categories', 'CreatedAt') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD CreatedAt DATETIME2 NOT NULL
      CONSTRAINT DF_Categories_CreatedAt DEFAULT GETDATE();
    END;

    IF COL_LENGTH('dbo.Categories', 'UpdatedAt') IS NULL
    BEGIN
      ALTER TABLE dbo.Categories
      ADD UpdatedAt DATETIME2 NULL;
    END;
  `);
}

function createSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function numberOrDefault(value, defaultValue = 0) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : defaultValue;
}

function nullableInteger(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number)
    ? number
    : null;
}

/*
  GET /api/categories

  Returns active categories for:
  - Products page
  - Product form dropdown
  - Mega menu
*/
exports.getCategories = async (req, res) => {
  try {
    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const result = await pool.request().query(`
      SELECT
        c.Id AS id,
        c.Name AS name,
        c.Slug AS slug,
        c.Description AS description,
        c.ImageURL AS image,
        c.ParentCategoryId AS parent_category_id,
        parent.Name AS parent_category_name,
        c.MenuGroup AS menu_group,
        c.Material AS material,
        c.Purity AS purity,
        c.MakingChargesPerGram
          AS making_charges_per_gram,
        c.WastagePercentage
          AS wastage_percentage,
        c.GSTPercentage AS gst_percentage,
        c.DefaultDiamondPrice
          AS default_diamond_price,
        c.CalculationType AS calculation_type,
        c.DisplayOrder AS display_order,
        c.IsActive AS is_active,
        c.CreatedAt AS created_at,
        c.UpdatedAt AS updated_at
      FROM dbo.Categories AS c
      LEFT JOIN dbo.Categories AS parent
        ON parent.Id = c.ParentCategoryId
      WHERE c.IsActive = 1
      ORDER BY
        c.DisplayOrder,
        c.Name;
    `);

    return res.status(200).json({
      categories: result.recordset
    });
  } catch (error) {
    console.error('Get Categories Error:', error);

    return res.status(500).json({
      message: 'Unable to load categories',
      error: error.message
    });
  }
};

/*
  GET /api/admin/categories

  Returns active and inactive categories for the admin panel.
*/
exports.getAdminCategories = async (req, res) => {
  try {
    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const result = await pool.request().query(`
      SELECT
        c.Id AS id,
        c.Name AS name,
        c.Slug AS slug,
        c.Description AS description,
        c.ImageURL AS image,
        c.ParentCategoryId AS parent_category_id,
        parent.Name AS parent_category_name,
        c.MenuGroup AS menu_group,
        c.Material AS material,
        c.Purity AS purity,
        c.MakingChargesPerGram
          AS making_charges_per_gram,
        c.WastagePercentage
          AS wastage_percentage,
        c.GSTPercentage AS gst_percentage,
        c.DefaultDiamondPrice
          AS default_diamond_price,
        c.CalculationType AS calculation_type,
        c.DisplayOrder AS display_order,
        c.IsActive AS is_active,
        c.CreatedAt AS created_at,
        c.UpdatedAt AS updated_at
      FROM dbo.Categories AS c
      LEFT JOIN dbo.Categories AS parent
        ON parent.Id = c.ParentCategoryId
      ORDER BY
        c.IsActive DESC,
        c.DisplayOrder,
        c.Name;
    `);

    return res.status(200).json({
      categories: result.recordset
    });
  } catch (error) {
    console.error(
      'Get Admin Categories Error:',
      error
    );

    return res.status(500).json({
      message: 'Unable to load admin categories',
      error: error.message
    });
  }
};

/*
  GET /api/categories/:id

  Returns one category with all calculation defaults.
*/
exports.getCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: 'Invalid category ID'
      });
    }

    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const result = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT
          c.Id AS id,
          c.Name AS name,
          c.Slug AS slug,
          c.Description AS description,
          c.ImageURL AS image,
          c.ParentCategoryId AS parent_category_id,
          parent.Name AS parent_category_name,
          c.MenuGroup AS menu_group,
          c.Material AS material,
          c.Purity AS purity,
          c.MakingChargesPerGram
            AS making_charges_per_gram,
          c.WastagePercentage
            AS wastage_percentage,
          c.GSTPercentage AS gst_percentage,
          c.DefaultDiamondPrice
            AS default_diamond_price,
          c.CalculationType AS calculation_type,
          c.DisplayOrder AS display_order,
          c.IsActive AS is_active,
          c.CreatedAt AS created_at,
          c.UpdatedAt AS updated_at
        FROM dbo.Categories AS c
        LEFT JOIN dbo.Categories AS parent
          ON parent.Id = c.ParentCategoryId
        WHERE c.Id = @categoryId;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      category: result.recordset[0]
    });
  } catch (error) {
    console.error('Get Category Error:', error);

    return res.status(500).json({
      message: 'Unable to load category',
      error: error.message
    });
  }
};

/*
  POST /api/admin/categories

  Example body:
  {
    "name": "Baby Lockets",
    "description": "Jewellery for babies",
    "image": "https://...",
    "material": "Gold",
    "purity": "22K",
    "making_charges_per_gram": 850,
    "wastage_percentage": 5,
    "gst_percentage": 3,
    "default_diamond_price": 0,
    "calculation_type": "WEIGHT_BASED"
  }
*/
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      image_url,
      parent_category_id,
      menu_group,
      material,
      purity,
      making_charges_per_gram,
      wastage_percentage,
      gst_percentage,
      default_diamond_price,
      calculation_type,
      display_order,
      is_active
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Category name is required'
      });
    }

    const cleanName = String(name).trim();
    const slug = createSlug(cleanName);

    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const duplicate = await pool
      .request()
      .input('name', sql.NVarChar(150), cleanName)
      .input('slug', sql.NVarChar(150), slug)
      .query(`
        SELECT Id
        FROM dbo.Categories
        WHERE LOWER(Name) = LOWER(@name)
           OR Slug = @slug;
      `);

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({
        message: 'Category already exists'
      });
    }

    const result = await pool
      .request()
      .input('name', sql.NVarChar(150), cleanName)
      .input('slug', sql.NVarChar(150), slug)
      .input(
        'description',
        sql.NVarChar(1000),
        description || null
      )
      .input(
        'image',
        sql.NVarChar(sql.MAX),
        req.file?.path ||
        req.file?.secure_url ||
         image ||
         image_url ||
         null
      )
      .input(
        'parentCategoryId',
        sql.Int,
        nullableInteger(parent_category_id)
      )
      .input(
        'menuGroup',
        sql.NVarChar(100),
        menu_group || null
      )
      .input(
        'material',
        sql.NVarChar(50),
        material || 'Gold'
      )
      .input(
        'purity',
        sql.NVarChar(20),
        purity || '22K'
      )
      .input(
        'makingCharges',
        sql.Decimal(18, 2),
        numberOrDefault(
          making_charges_per_gram,
          0
        )
      )
      .input(
        'wastage',
        sql.Decimal(5, 2),
        numberOrDefault(
          wastage_percentage,
          0
        )
      )
      .input(
        'gst',
        sql.Decimal(5, 2),
        numberOrDefault(gst_percentage, 3)
      )
      .input(
        'diamondPrice',
        sql.Decimal(18, 2),
        numberOrDefault(
          default_diamond_price,
          0
        )
      )
      .input(
        'calculationType',
        sql.NVarChar(40),
        calculation_type || 'WEIGHT_BASED'
      )
      .input(
        'displayOrder',
        sql.Int,
        numberOrDefault(display_order, 0)
      )
      .input(
        'isActive',
        sql.Bit,
        is_active === false ||
          is_active === 0 ||
          is_active === '0'
          ? 0
          : 1
      )
      .query(`
        INSERT INTO dbo.Categories
        (
          Name,
          Slug,
          Description,
          ImageURL,
          ParentCategoryId,
          MenuGroup,
          Material,
          Purity,
          MakingChargesPerGram,
          WastagePercentage,
          GSTPercentage,
          DefaultDiamondPrice,
          CalculationType,
          DisplayOrder,
          IsActive,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT
          inserted.Id AS id,
          inserted.Name AS name,
          inserted.Slug AS slug,
          inserted.Description AS description,
          inserted.ImageURL AS image,
          inserted.ParentCategoryId
            AS parent_category_id,
          inserted.MenuGroup AS menu_group,
          inserted.Material AS material,
          inserted.Purity AS purity,
          inserted.MakingChargesPerGram
            AS making_charges_per_gram,
          inserted.WastagePercentage
            AS wastage_percentage,
          inserted.GSTPercentage
            AS gst_percentage,
          inserted.DefaultDiamondPrice
            AS default_diamond_price,
          inserted.CalculationType
            AS calculation_type,
          inserted.DisplayOrder AS display_order,
          inserted.IsActive AS is_active
        VALUES
        (
          @name,
          @slug,
          @description,
          @image,
          @parentCategoryId,
          @menuGroup,
          @material,
          @purity,
          @makingCharges,
          @wastage,
          @gst,
          @diamondPrice,
          @calculationType,
          @displayOrder,
          @isActive,
          GETDATE(),
          GETDATE()
        );
      `);

    return res.status(201).json({
      message: 'Category created successfully',
      category: result.recordset[0]
    });
  } catch (error) {
    console.error('Create Category Error:', error);

    return res.status(500).json({
      message: 'Unable to create category',
      error: error.message
    });
  }
};

/*
  PUT /api/admin/categories/:id
*/
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: 'Invalid category ID'
      });
    }

    const {
      name,
      description,
      image,
      image_url,
      parent_category_id,
      menu_group,
      material,
      purity,
      making_charges_per_gram,
      wastage_percentage,
      gst_percentage,
      default_diamond_price,
      calculation_type,
      display_order,
      is_active
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Category name is required'
      });
    }

    const cleanName = String(name).trim();
    const slug = createSlug(cleanName);
    const parentId =
      nullableInteger(parent_category_id);

    if (parentId === categoryId) {
      return res.status(400).json({
        message:
          'A category cannot be its own parent'
      });
    }

    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const duplicate = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .input('name', sql.NVarChar(150), cleanName)
      .input('slug', sql.NVarChar(150), slug)
      .query(`
        SELECT Id
        FROM dbo.Categories
        WHERE Id <> @categoryId
          AND
          (
            LOWER(Name) = LOWER(@name)
            OR Slug = @slug
          );
      `);

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({
        message:
          'Another category already uses this name'
      });
    }

    const result = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .input('name', sql.NVarChar(150), cleanName)
      .input('slug', sql.NVarChar(150), slug)
      .input(
        'description',
        sql.NVarChar(1000),
        description || null
      )
      .input(
        'image',
        sql.NVarChar(sql.MAX),
        image || image_url || null
      )
      .input(
        'parentCategoryId',
        sql.Int,
        parentId
      )
      .input(
        'menuGroup',
        sql.NVarChar(100),
        menu_group || null
      )
      .input(
        'material',
        sql.NVarChar(50),
        material || 'Gold'
      )
      .input(
        'purity',
        sql.NVarChar(20),
        purity || '22K'
      )
      .input(
        'makingCharges',
        sql.Decimal(18, 2),
        numberOrDefault(
          making_charges_per_gram,
          0
        )
      )
      .input(
        'wastage',
        sql.Decimal(5, 2),
        numberOrDefault(
          wastage_percentage,
          0
        )
      )
      .input(
        'gst',
        sql.Decimal(5, 2),
        numberOrDefault(gst_percentage, 3)
      )
      .input(
        'diamondPrice',
        sql.Decimal(18, 2),
        numberOrDefault(
          default_diamond_price,
          0
        )
      )
      .input(
        'calculationType',
        sql.NVarChar(40),
        calculation_type || 'WEIGHT_BASED'
      )
      .input(
        'displayOrder',
        sql.Int,
        numberOrDefault(display_order, 0)
      )
      .input(
        'isActive',
        sql.Bit,
        is_active === false ||
          is_active === 0 ||
          is_active === '0'
          ? 0
          : 1
      )
      .query(`
        UPDATE dbo.Categories
        SET
          Name = @name,
          Slug = @slug,
          Description = @description,
          ImageURL = @image,
          ParentCategoryId = @parentCategoryId,
          MenuGroup = @menuGroup,
          Material = @material,
          Purity = @purity,
          MakingChargesPerGram = @makingCharges,
          WastagePercentage = @wastage,
          GSTPercentage = @gst,
          DefaultDiamondPrice = @diamondPrice,
          CalculationType = @calculationType,
          DisplayOrder = @displayOrder,
          IsActive = @isActive,
          UpdatedAt = GETDATE()
        OUTPUT
          inserted.Id AS id,
          inserted.Name AS name,
          inserted.Slug AS slug,
          inserted.Description AS description,
          inserted.ImageURL AS image,
          inserted.ParentCategoryId
            AS parent_category_id,
          inserted.MenuGroup AS menu_group,
          inserted.Material AS material,
          inserted.Purity AS purity,
          inserted.MakingChargesPerGram
            AS making_charges_per_gram,
          inserted.WastagePercentage
            AS wastage_percentage,
          inserted.GSTPercentage
            AS gst_percentage,
          inserted.DefaultDiamondPrice
            AS default_diamond_price,
          inserted.CalculationType
            AS calculation_type,
          inserted.DisplayOrder AS display_order,
          inserted.IsActive AS is_active
        WHERE Id = @categoryId;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      message: 'Category updated successfully',
      category: result.recordset[0]
    });
  } catch (error) {
    console.error('Update Category Error:', error);

    return res.status(500).json({
      message: 'Unable to update category',
      error: error.message
    });
  }
};

/*
  DELETE /api/admin/categories/:id

  It does not permanently delete categories that have products.
  It makes the category inactive to protect product records.
*/
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: 'Invalid category ID'
      });
    }

    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const productCheck = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT COUNT(*) AS product_count
        FROM dbo.Products
        WHERE CategoryId = @categoryId;
      `);

    const productCount = Number(
      productCheck.recordset[0]?.product_count || 0
    );

    if (productCount > 0) {
      const disabled = await pool
        .request()
        .input('categoryId', sql.Int, categoryId)
        .query(`
          UPDATE dbo.Categories
          SET
            IsActive = 0,
            UpdatedAt = GETDATE()
          OUTPUT inserted.Id AS id
          WHERE Id = @categoryId;
        `);

      if (disabled.recordset.length === 0) {
        return res.status(404).json({
          message: 'Category not found'
        });
      }

      return res.status(200).json({
        message:
          `Category has ${productCount} product(s), so it was disabled instead of permanently deleted.`
      });
    }

    const childCheck = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT COUNT(*) AS child_count
        FROM dbo.Categories
        WHERE ParentCategoryId = @categoryId;
      `);

    const childCount = Number(
      childCheck.recordset[0]?.child_count || 0
    );

    if (childCount > 0) {
      return res.status(409).json({
        message:
          'Remove or move the child categories before deleting this category'
      });
    }

    const result = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        DELETE FROM dbo.Categories
        OUTPUT deleted.Id AS id
        WHERE Id = @categoryId;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete Category Error:', error);

    return res.status(500).json({
      message: 'Unable to delete category',
      error: error.message
    });
  }
};

/*
  GET /api/categories/:id/calculation

  Product form calls this after selecting a category.
*/
exports.getCategoryCalculation = async (
  req,
  res
) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: 'Invalid category ID'
      });
    }

    const pool = await connectDB();

    await ensureCategoryColumns(pool);

    const result = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT
          Id AS category_id,
          Name AS category_name,
          Material AS material,
          Purity AS purity,
          MakingChargesPerGram
            AS making_charges,
          WastagePercentage
            AS wastage_percentage,
          GSTPercentage AS gst_percentage,
          DefaultDiamondPrice
            AS diamond_price,
          CalculationType AS calculation_type
        FROM dbo.Categories
        WHERE Id = @categoryId
          AND IsActive = 1;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      calculation: result.recordset[0]
    });
  } catch (error) {
    console.error(
      'Get Category Calculation Error:',
      error
    );

    return res.status(500).json({
      message:
        'Unable to load category calculation',
      error: error.message
    });
  }
};