# Sai Swarn Palace - Premium Jewelry Store

A complete, production-ready jewelry e-commerce platform with React frontend, Node.js backend, and SQL Server database.

## Features

### Customer Features
- ✅ Beautiful, responsive UI with modern design
- ✅ Product catalog with categories and search
- ✅ Product detail pages with zoom and price breakdown
- ✅ Shopping cart and wishlist
- ✅ OTP-based authentication system
- ✅ Address management
- ✅ Order tracking and history
- ✅ Invoice download (PDF, Print, JPG)
- ✅ Dynamic pricing based on gold rates (18K, 22K, 24K)
- ✅ GST and wastage charges calculation

### Admin Features
- ✅ Secure admin dashboard
- ✅ Product management (CRUD operations)
- ✅ User management
- ✅ Order management and status updates
- ✅ Contact inquiry management
- ✅ Gold rate and pricing configuration
- ✅ Dashboard analytics and statistics

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS 3
- React Router DOM
- Lucide Icons
- React Hot Toast
- html2canvas (for invoice generation)
- jsPDF (for PDF generation)

### Backend
- Node.js
- Express.js
- mssql (SQL Server integration)
- JWT Authentication
- bcrypt (password hashing)
- CORS enabled

### Database
- SQL Server
- Complete relational schema with all necessary tables

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- SQL Server (2017 or higher)
- npm or yarn

### Run From One Folder (Recommended)

You can now run both backend and frontend from the project root folder.

1. Install all dependencies:
```bash
npm install
npm run install:all
```

2. Start both server and client together:
```bash
npm run dev
```

Fast option (auto-free port 5173, then start):

```bash
npm run dev:clean
```

This starts:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- Ports are strict. If `5173` is busy, command fails with a clear error.

### Production Mode From Root Folder

Build and run from the same root folder:

```bash
npm run start:prod
```

Or run in two steps:

```bash
npm run build
npm run start
```

### Database Setup

1. Open SQL Server Management Studio
2. Execute the SQL script from `database-schema.sql`
3. This will:
   - Create the database
   - Create all necessary tables
   - Insert sample data

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` template
   - Update database credentials
   - Set your JWT secret

4. Start the backend server:
```bash
npm start
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Database Schema

The database includes the following tables:
- **Users**: Customer accounts
- **Admins**: Admin accounts
- **Products**: Jewelry products with pricing
- **Categories**: Product categories
- **GoldRates**: Gold price management
- **Orders**: Customer orders
- **OrderItems**: Order line items
- **Cart**: Shopping cart
- **Wishlist**: Wishlist items
- **Addresses**: Customer addresses
- **Coupons**: Discount coupons
- **Payments**: Payment records
- **Contacts**: Contact inquiries

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/categories` - Get categories
- `GET /api/gold-rates` - Get current gold rates
- `POST /api/users/register` - Register new user
- `POST /api/users/verify-otp` - Verify OTP
- `POST /api/users/login` - User login
- `POST /api/admin/login` - Admin login

### Protected Endpoints (User)
- `GET /api/users/profile` - Get user profile

### Protected Endpoints (Admin)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/products` - Get all products
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/contacts` - Get contact inquiries
- `PUT /api/admin/contacts/:id/status` - Update contact status
- `PUT /api/admin/gold-rates` - Update gold rates

## Admin Credentials

**Demo Login (if no admin in database):**
- Email: `admin@saiswarnpalace`
- Password: `Ssp@277369`

## Project Structure

```
Sai Swarn Palace/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── App.jsx
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Database config
│   ├── controllers/        # API controllers
│   ├── middleware/         # Auth middleware
│   ├── routes/             # API routes
│   └── package.json
├── database-schema.sql     # SQL Server schema
└── README.md
```

## Development

### Backend Development
```bash
cd server
npm install
npm start
```

### Frontend Development
```bash
cd client
npm install
npm run dev
```

### Root Folder Development (Both Together)
```bash
npm run dev
```

If port `5173` is already in use, stop the existing process first and run again.

### Root Folder Production (Build + Start)
```bash
npm run start:prod
```

To auto-free port 5173 before starting preview + server:

```bash
npm run start:clean
```

If port `5173` is busy, production start also fails fast so you can fix the conflict immediately.

## Production Deployment

1. Build the frontend:
```bash
cd client
npm run build
```

2. Configure environment variables for production

3. Set up SQL Server in production

4. Deploy frontend and backend to your hosting provider

## License

MIT License - Feel free to use this project for commercial purposes.
