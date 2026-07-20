# Implementation Plan - Category and Filtering System Updates

Fix issues where category selection from the MegaMenu displays all products instead of filtered products, resolve backend category ID mapping, and ensure the admin panel creates/updates products with valid category IDs.

## User Review Required

> [!IMPORTANT]
> The database schema has been verified, and the live Azure SQL database does NOT have `Price` or `DiscountPrice` columns on the `Products` table. Product prices are calculated dynamically on the frontend using weight, purity, making charges, wastage, and gold rates. We will preserve this pricing model and add the missing backend insert/update columns (`Material`, `Style`, `Gender`, `Occasion`, `Collection`, `MetalColor`, `DiamondPrice`, `OtherCharges`, `DiscountPercentage`) in the admin controller so that edits do not wipe them out.

## Proposed Changes

---

### Backend Components

#### [MODIFY] [productController.js](file:///c:/Users/ghadg/OneDrive/Documents/Sai%20Swarn%20Palace/saiswarnpalace/server/controllers/productController.js)
- Update `getProducts` query to select all products with the extra filter fields (`Material`, `Style`, `Gender`, `Occasion`, `Collection`, `MetalColor`, `DiamondPrice`, `OtherCharges`, `DiscountPercentage`).
- Update `getProducts` query to support safe filtering by category ID (numeric) or category slug/name (non-numeric) directly on the backend database if a parameter is passed.

#### [MODIFY] [adminController.js](file:///c:/Users/ghadg/OneDrive/Documents/Sai%20Swarn%20Palace/saiswarnpalace/server/controllers/adminController.js)
- Update `getAdminProducts` query to select additional filter fields so they are populated when admin edits a product and not lost on save.
- Resolve any non-numeric string values (e.g. category display names) passed into `category_id` in `createProduct` and `updateProduct` to valid database category IDs by querying the `Categories` table first.
- Update `createProduct` and `updateProduct` to write/update all columns (including `Material`, `Style`, `Gender`, `Occasion`, `Collection`, `MetalColor`, `DiamondPrice`, `OtherCharges`, `DiscountPercentage`, `FixedMakingCharge`).

---

### Frontend Components

#### [MODIFY] [MegaMenu.jsx](file:///c:/Users/ghadg/OneDrive/Documents/Sai%20Swarn%20Palace/saiswarnpalace/client/src/components/MegaMenu.jsx)
- Correct links in the dropdown to navigate to `/products?...` using `URLSearchParams`.
- Support both string items and object items in the groups map.
- Convert main category buttons (like "Rings", "Earrings", "Gold") to `<Link>` elements so clicking them navigates directly to the correct filtered category/material page.

#### [MODIFY] [Header.jsx](file:///c:/Users/ghadg/OneDrive/Documents/Sai%20Swarn%20Palace/saiswarnpalace/client/src/components/Header.jsx)
- Replace the desktop inline categories navigation bar loops with the `<MegaMenu />` component.
- Align mobile nav links to navigate to the correct `/products?...` URL query parameters instead of just `/products`.
- Normalize category names to plural ("Earrings" and "Rings") for consistent usage.

#### [MODIFY] [Products.jsx](file:///c:/Users/ghadg/OneDrive/Documents/Sai%20Swarn%20Palace/saiswarnpalace/client/src/pages/Products.jsx)
- Read all filters from URL search params (category, material, style, gender, occasion, collection, metalColor, minPrice, maxPrice, search).
- Populate the `search` input from the URL `search` param, and synchronize URL parameters as the user types.
- Ensure `normalizeFilter` is defined at module level.
- Support all product field variations (e.g., `category_name`, `effective_material`, `metal_color`, etc.) to prevent crashes.
- Category filtering logic supporting numeric IDs (via API parameter) vs string names (via frontend filtering).
- Prefer resolved category ID when filtering.
- Expand "Clear Filters" logic to clear all parameters.
- Make "Clear Filters" button visible when any active filter is present.
- Sync category dropdown selection value with the active category URL filter.

## Verification Plan

### Automated Verification
- Run `npm run build` in the `client` directory to verify there are no compilation or React/Vite build errors.
- Run `npm run lint` in the `client` directory to check for ESLint issues.

### Manual Verification
- Test clicking "Earrings" main menu -> displays only earrings.
- Test clicking "Gold Earrings" -> displays gold earrings.
- Test clicking "Gold Jhumka" -> displays gold jhumka earrings.
- Test clicking "Clear Filters" -> displays all products.
- Test refreshing filtered URLs -> preserves filter states.
- Verify that admin product creation/edit does not wipe out or crash fields.
