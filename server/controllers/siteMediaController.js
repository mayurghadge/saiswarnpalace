const { connectDB, sql } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { imageSize } = require('image-size');

const FOOTER_IMAGE_WIDTH = 1280;
const FOOTER_IMAGE_HEIGHT = 720;

async function ensureSiteMediaTable(pool) {
  await pool.request().query(`
    IF OBJECT_ID('SiteMedia', 'U') IS NULL
    BEGIN
      CREATE TABLE SiteMedia (
        id INT IDENTITY(1,1) PRIMARY KEY,
        media_type NVARCHAR(50) NOT NULL,
        image_url NVARCHAR(1000) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
      )
    END
  `);
}

exports.getPublicMedia = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureSiteMediaTable(pool);
    const result = await pool.request()
      .input('mediaType', sql.NVarChar, 'footer')
      .query(`
        SELECT id, image_url AS imageUrl, created_at AS createdAt
        FROM SiteMedia
        WHERE media_type = @mediaType
        ORDER BY created_at DESC, id DESC
      `);
    res.status(200).json({ media: result.recordset });
  } catch (error) {
    console.error('Get Site Media Error:', error);
    res.status(500).json({ message: 'Unable to load site media' });
  }
};

exports.getAdminMedia = async (req, res) => exports.getPublicMedia(req, res);

exports.uploadFooterMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please select a footer image' });

    const dimensions = imageSize(fs.readFileSync(req.file.path));
    if (dimensions.width !== FOOTER_IMAGE_WIDTH || dimensions.height !== FOOTER_IMAGE_HEIGHT) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: `Footer images must be exactly ${FOOTER_IMAGE_WIDTH} x ${FOOTER_IMAGE_HEIGHT} pixels. Uploaded image is ${dimensions.width} x ${dimensions.height}.`
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'jewellery/site/footer'
    });
    fs.unlinkSync(req.file.path);

    const pool = await connectDB();
    await ensureSiteMediaTable(pool);
    const saved = await pool.request()
      .input('mediaType', sql.NVarChar, 'footer')
      .input('imageUrl', sql.NVarChar, result.secure_url)
      .query(`
        INSERT INTO SiteMedia (media_type, image_url)
        OUTPUT inserted.id, inserted.image_url AS imageUrl, inserted.created_at AS createdAt
        VALUES (@mediaType, @imageUrl)
      `);

    res.status(201).json({ message: 'Footer image uploaded successfully', media: saved.recordset[0] });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Upload Footer Media Error:', error);
    res.status(500).json({ message: 'Unable to upload footer image' });
  }
};

exports.deleteFooterMedia = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureSiteMediaTable(pool);
    await pool.request().input('id', sql.Int, req.params.id).query(`
      DELETE FROM SiteMedia WHERE id = @id AND media_type = 'footer'
    `);
    res.status(200).json({ message: 'Footer image deleted successfully' });
  } catch (error) {
    console.error('Delete Footer Media Error:', error);
    res.status(500).json({ message: 'Unable to delete footer image' });
  }
};