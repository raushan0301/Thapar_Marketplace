# 🎓 ThaparMarket - Campus Marketplace

A modern, full-stack marketplace platform built exclusively for Thapar University students. Buy, sell, rent items, and report lost & found items within the campus community.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Beautiful, accessible components
- **React Query** - Data fetching and caching
- **Socket.io-client** - Real-time chat

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe backend
- **PostgreSQL (Neon)** - Serverless database (3GB free)
- **Socket.IO** - Real-time messaging
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email notifications

### Services
- **Cloudinary** - Image storage and optimization (25GB free)
- **Gmail SMTP** - Email delivery
- **Vercel** - Frontend hosting (free)
- **Render** - Backend hosting (free)

## ✨ Features

### Core Functionality
- ✅ **User Authentication**
  - Campus email verification (@thapar.edu)
  - Email OTP verification
  - Password reset
  - JWT-based sessions

- ✅ **Marketplace Categories**
  - Buy/Sell (Books, Electronics, Furniture, Clothing, etc.)
  - Rentals (Bikes, Sports Equipment, etc.)
  - Lost & Found

- ✅ **Listings Management**
  - Create listings with multiple images (up to 6)
  - Edit and delete own listings
  - Advanced search and filters
  - Favorites/wishlist
  - Auto-expire listings

- ✅ **Real-time Chat**
  - Direct messaging between users
  - Image sharing in chat
  - Typing indicators
  - Online/offline status
  - Unread message count

- ✅ **User Profiles**
  - Profile pictures
  - Ratings and reviews (5-star system)
  - Trust score calculation
  - Transaction history

- ✅ **Admin Panel**
  - Dashboard with analytics
  - Content moderation
  - User management
  - Reports handling

### Future Enhancements (Hooks Ready)
- 💳 Payment integration (Razorpay/Stripe)
- 📱 Mobile app (React Native)
- 🔔 Push notifications
- 📊 Advanced analytics

## 📁 Project Structure

```
marketplace/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API client
│   └── package.json
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── config/          # Database, Cloudinary, Email config
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, validation, upload
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   └── server.ts        # Main server file
│   └── package.json
│
└── database/
    └── schema.sql           # PostgreSQL schema
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon account)
- Cloudinary account
- Gmail account (for sending emails)

### 1. Clone the Repository
```bash
cd /Users/raushanraj/Desktop/marketplace
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Database (Get from Neon dashboard)
DATABASE_URL=postgresql://username:password@host/database

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary (Get from Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Gmail (Use App Password, not regular password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a Neon account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Run the schema:

```bash
# Connect to your Neon database and run:
psql <your-database-url> -f ../database/schema.sql
```

### 4. Gmail App Password Setup

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `.env` as `EMAIL_PASSWORD`

### 5. Cloudinary Setup

1. Create account at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add to `.env`

### 6. Start Backend

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 7. Frontend Setup (Coming Next)

```bash
cd ../frontend
npm install
npm run dev
```

## 📊 Database Schema

### Main Tables
- **users** - User accounts and profiles
- **categories** - Marketplace categories
- **listings** - Product listings
- **messages** - Chat messages
- **ratings** - User ratings and reviews
- **favorites** - Saved listings
- **reports** - Reported content
- **notifications** - User notifications

See `database/schema.sql` for complete schema.

## 🔒 Security Features

- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ JWT token authentication
- ✅ Bcrypt password hashing
- ✅ Input validation with Joi
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Campus email verification

## 📧 Email Templates

Beautiful HTML email templates for:
- Welcome email
- Email verification (OTP)
- Password reset
- Notifications

## 🎨 Design System

- **Primary Color**: #2563eb (Blue)
- **Secondary Color**: #7c3aed (Purple)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)

Minimal design with smooth animations and modern aesthetics.

## 🚀 Deployment

### Backend (Render)
1. Create account on Render.com
2. Create new Web Service
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Frontend (Vercel)
1. Create account on Vercel.com
2. Import GitHub repository
3. Set environment variables
4. Deploy

## 📝 API Documentation

### Authentication Endpoints

```
POST /api/auth/register          - Register new user
POST /api/auth/verify-email      - Verify email with OTP
POST /api/auth/resend-otp        - Resend verification OTP
POST /api/auth/login             - Login user
POST /api/auth/forgot-password   - Request password reset
POST /api/auth/reset-password    - Reset password
GET  /api/auth/me                - Get current user (protected)
```

More endpoints coming soon...

## 🤝 Contributing

This is a campus project for Thapar University. Contributions are welcome!

## 📄 License

ISC

## 👨‍💻 Author

**Raushan Raj**
- Campus: Thapar University
- Project: ThaparMarket

---

**Built with ❤️ for Thapar University students**
