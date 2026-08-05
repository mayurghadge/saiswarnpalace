-- Migration: Create RefreshTokens table
-- Run this in your SQL Server to create the RefreshTokens table used by the backend.

IF OBJECT_ID('RefreshTokens', 'U') IS NULL
BEGIN
  CREATE TABLE RefreshTokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    token_id NVARCHAR(100) NOT NULL,
    token_hash NVARCHAR(500) NOT NULL,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked BIT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    ip_address NVARCHAR(100) NULL,
    user_agent NVARCHAR(300) NULL
  );
END
