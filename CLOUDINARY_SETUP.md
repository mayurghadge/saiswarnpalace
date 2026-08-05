# Cloudinary Setup Guide

## Step 1: Create a Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your Cloudinary Credentials
1. Log in to your Cloudinary account
2. Go to the **Dashboard**
3. Copy your **Cloud name**, **API Key** and **API Secret** (DO NOT commit these to source control)

## Step 3: Update .env File
Open `server/.env` and add your Cloudinary credentials (use secure secrets management):

```env
# Cloudinary Configuration (For Image Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
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
