# Cloudinary Setup Guide

## Step 1: Create a Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your Cloudinary Credentials
1. Log in to your Cloudinary account
2. Go to the **Dashboard**
3. Look for the **Account Details** section
4. You will see:
   - Cloud name=(saiswarnpalace)
   - API Key=(841913584325953)
   - API Secret=(4SiEYt2FLSuGztmcGV2NtCnkDXg)

## Step 3: Update .env File
Open `server/.env` and add your Cloudinary credentials:

```env
# Cloudinary Configuration (For Image Uploads)
CLOUDINARY_CLOUD_NAME=saiswarnpalace
CLOUDINARY_API_KEY=841913584325953
CLOUDINARY_API_SECRET=4SiEYt2FLSuGztmcGV2NtCnkDXg
```

## Step 4: How It Works
- **Product images** are uploaded to `jewellery/products` folder
- **Category images** are uploaded to `jewellery/categories` folder
- **Verification proofs** are uploaded to `jewellery/verifications` folder
- All images are stored securely on Cloudinary
- Temporary files are automatically deleted after upload

## Step 5: Verification
Once you've set up Cloudinary:
1. Restart the server
2. Try uploading a product or category image from the admin panel
3. Check your Cloudinary dashboard to verify the upload

## Features
- ✅ Automatic image optimization
- ✅ CDN for fast image delivery
- ✅ Support for images and PDFs
- ✅ Secure HTTPS URLs
- ✅ Folder organization

## Notes
- The free tier has limits on storage and bandwidth
- For production use, consider upgrading your Cloudinary plan
