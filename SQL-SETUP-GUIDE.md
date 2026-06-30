# SQL Server Setup Guide

## 🔑 How to Fix SQL Server Login Issue:

### Option 1: Reset 'sa' Password (Recommended)
1. Open **SQL Server Management Studio** (SSMS)
2. Connect using **Windows Authentication**
3. Expand Security folder → Logins
4. Right-click **sa** → Properties
5. Set new password: `Sspnp@277369` (or your own)
6. Check **Enforce password policy** if needed
7. Go to **Status** tab → Make sure Login is **Enabled**
8. Click OK
9. Also, right-click server name → Properties → Security
10. Change Server Authentication to **SQL Server and Windows Authentication mode**
11. Restart SQL Server
12. Done!

### Option 2: Check Your .env File
Make sure your `server/.env` file has correct DB_PASSWORD:
```env
DB_PASSWORD=Sspnp@277369
```

## 📊 How to Create Database & Tables:
1. Open SSMS and connect to SQL Server
2. Open file: `database-schema.sql`
3. Execute it to create everything!
4. Then execute `db-migration-upload.sql` to add verification and silver rate
5. Done!

## 🔧 Verify Database:
After running both SQL files, run `test-sql.js` to test connection!
