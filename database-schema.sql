-- Create Database
CREATE DATABASE JewelleryDB;
GO

USE JewelleryDB;
GO

-- Users Table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    phone NVARCHAR(20) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    otp NVARCHAR(6),
    otp_expiry DATETIME,
    is_verified BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Admins Table
CREATE TABLE Admins (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Gold Rates Table
CREATE TABLE GoldRates (
    id INT PRIMARY KEY IDENTITY(1,1),
    gold_rate_18k DECIMAL(18,2) NOT NULL,
    gold_rate_22k DECIMAL(18,2) NOT NULL,
    gold_rate_24k DECIMAL(18,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 3.00,
    wastage_rate DECIMAL(5,2) DEFAULT 10.00,
    silver_rate DECIMAL(10,2) DEFAULT 80.00,
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Categories Table
CREATE TABLE Categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    slug NVARCHAR(100) UNIQUE NOT NULL,
    image NVARCHAR(255),
    description NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Products Table
CREATE TABLE Products (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    slug NVARCHAR(255) UNIQUE NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(18,2) NOT NULL,
    discount_price DECIMAL(18,2),
    category_id INT FOREIGN KEY REFERENCES Categories(id),
    material NVARCHAR(50),
    weight DECIMAL(10,2),
    purity NVARCHAR(20),
    making_charges DECIMAL(18,2) DEFAULT 0,
    wastage_percentage DECIMAL(5,2) DEFAULT 10,
    diamond_price DECIMAL(18,2) DEFAULT 0,
    images NVARCHAR(MAX),
    stock INT DEFAULT 0,
    is_featured BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Addresses Table
CREATE TABLE Addresses (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT FOREIGN KEY REFERENCES Users(id),
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    address_line1 NVARCHAR(255) NOT NULL,
    address_line2 NVARCHAR(255),
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NOT NULL,
    pincode NVARCHAR(20) NOT NULL,
    is_default BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Cart Table
CREATE TABLE Cart (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT FOREIGN KEY REFERENCES Users(id),
    product_id INT FOREIGN KEY REFERENCES Products(id),
    quantity INT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Wishlist Table
CREATE TABLE Wishlist (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT FOREIGN KEY REFERENCES Users(id),
    product_id INT FOREIGN KEY REFERENCES Products(id),
    created_at DATETIME DEFAULT GETDATE(),
    UNIQUE(user_id, product_id)
);
GO

-- Coupons Table
CREATE TABLE Coupons (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) UNIQUE NOT NULL,
    discount_type NVARCHAR(20) NOT NULL,
    discount_value DECIMAL(18,2) NOT NULL,
    min_order_value DECIMAL(18,2),
    max_discount DECIMAL(18,2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from DATETIME,
    valid_to DATETIME,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Orders Table
CREATE TABLE Orders (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT FOREIGN KEY REFERENCES Users(id),
    address_id INT FOREIGN KEY REFERENCES Addresses(id),
    coupon_id INT FOREIGN KEY REFERENCES Coupons(id),
    order_number NVARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(18,2) NOT NULL,
    discount DECIMAL(18,2) DEFAULT 0,
    tax DECIMAL(18,2) DEFAULT 0,
    shipping DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) NOT NULL,
    payment_method NVARCHAR(50),
    payment_status NVARCHAR(50) DEFAULT 'pending',
    order_status NVARCHAR(50) DEFAULT 'processing',
    razorpay_order_id NVARCHAR(255),
    razorpay_payment_id NVARCHAR(255),
    razorpay_signature NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- OrderItems Table
CREATE TABLE OrderItems (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT FOREIGN KEY REFERENCES Orders(id),
    product_id INT FOREIGN KEY REFERENCES Products(id),
    quantity INT NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    total DECIMAL(18,2) NOT NULL
);
GO

-- Payments Table
CREATE TABLE Payments (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT FOREIGN KEY REFERENCES Orders(id),
    payment_method NVARCHAR(50),
    transaction_id NVARCHAR(255),
    amount DECIMAL(18,2) NOT NULL,
    status NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Reviews Table
CREATE TABLE Reviews (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT FOREIGN KEY REFERENCES Products(id),
    user_id INT FOREIGN KEY REFERENCES Users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Contacts Table
CREATE TABLE Contacts (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) DEFAULT 'new',
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Insert initial Gold Rates
INSERT INTO GoldRates (gold_rate_18k, gold_rate_22k, gold_rate_24k, gst_rate, wastage_rate, silver_rate) VALUES
(5400.00, 6500.00, 7200.00, 3.00, 10.00, 80.00);
GO

-- Insert sample data
INSERT INTO Categories (name, slug, description) VALUES
('Gold', 'gold', 'Elegant gold jewellery for every occasion'),
('Diamond', 'diamond', 'Sparkling diamond jewellery'),
('Silver', 'silver', 'Beautiful silver jewellery'),
('Platinum', 'platinum', 'Premium platinum collection');
GO

-- Insert sample products
INSERT INTO Products (name, slug, description, price, discount_price, category_id, material, weight, purity, making_charges, wastage_percentage, diamond_price, stock, images, is_featured) VALUES
('Elegant Gold Necklace', 'elegant-gold-necklace', 'A beautiful 22k gold necklace perfect for every occasion. Handcrafted with precision.', 195000.00, 185000.00, 1, '22k Gold', 25, '22k', 5000, 12, 0, 10, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 1),
('Diamond Gold Ring', 'diamond-gold-ring', 'Sparkling diamond ring with VVS clarity diamonds set in 18k gold.', 89000.00, NULL, 2, '18k Gold + Diamonds', 8, '18k', 3000, 8, 25000, 5, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', 1),
('Silver Earrings', 'silver-earrings', 'Beautiful silver earrings for everyday wear.', 5000.00, NULL, 3, '925 Silver', 10, '925', 500, 5, 0, 20, 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800', 0);
GO

-- Insert sample coupons
INSERT INTO Coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active) VALUES
('WELCOME10', 'PERCENTAGE', 10.00, 1000.00, 10000.00, 100, 1),
('FIRST500', 'FIXED', 500.00, 2000.00, 500.00, 50, 1);
GO
