USE JewelleryDB;
GO

-- Add verification columns to Users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'verification_status')
BEGIN
    ALTER TABLE Users 
    ADD verification_status NVARCHAR(20) DEFAULT 'not verified',
        verification_type NVARCHAR(50); -- aadhaar, pan, voter, driving
END
GO

-- Add silver rate column to GoldRates
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoldRates') AND name = 'silver_rate')
BEGIN
    ALTER TABLE GoldRates 
    ADD silver_rate DECIMAL(18, 2) DEFAULT 266;
END
GO

-- Create User Verification Documents Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserVerificationDocuments')
BEGIN
    CREATE TABLE UserVerificationDocuments (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT FOREIGN KEY REFERENCES Users(id),
        document_type NVARCHAR(50) NOT NULL, -- aadhaar, pan, voter, driving
        document_number NVARCHAR(100),
        document_path NVARCHAR(500) NOT NULL,
        uploaded_at DATETIME DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
        reviewed_by INT FOREIGN KEY REFERENCES Admins(id),
        reviewed_at DATETIME,
        review_notes NVARCHAR(MAX)
    );
END
GO

PRINT 'Migration complete!';
