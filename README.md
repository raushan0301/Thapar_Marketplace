# 🎓 ThaparMarket - Campus Marketplace

A modern, full-stack marketplace platform built exclusively for Thapar University students. Buy, sell, rent items, and report lost & found items within the campus community.

**Live Demo:** Coming Soon  
**Repository:** https://github.com/raushan0301/Thapar_Marketplace

---

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Socket.io-client** - Real-time chat
- **React Hot Toast** - Notifications

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe backend
- **PostgreSQL (Supabase)** - Serverless database
- **Socket.IO** - Real-time messaging
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email notifications

### Services
- **Cloudinary** - Image storage and optimization
- **Gmail SMTP** - Email delivery
- **Supabase** - PostgreSQL database hosting

---

## ✨ Features

### ✅ Implemented Features

#### 1. **User Authentication**
- Campus email verification (@thapar.edu)
- Email OTP verification (6-digit code)
- Password reset functionality
- JWT-based sessions
- Protected routes

#### 2. **Marketplace**
- **Categories**: Books, Electronics, Furniture, Clothing, Sports Equipment, etc.
- **Listing Types**: Buy/Sell, Rent, Lost & Found
- Create listings with multiple images (up to 6)
- Edit and delete own listings
- Advanced search and filters
- View counter
- Status management (active, sold, rented, expired)

#### 3. **Real-time Chat**
- Direct messaging between users
- Image sharing in chat
- Typing indicators
- Online/offline status
- Unread message count
- Message history with pagination

#### 4. **User Profiles**
- Profile pictures
- Ratings and reviews (5-star system)
- Trust score calculation
- Transaction history
- User statistics

#### 5. **Admin Panel**
- Dashboard with analytics
- Content moderation
- User management (ban/unban)
- Listing management
- Category CRUD operations
- Admin action logging

---

## 📁 Project Structure

```
marketplace/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── verify-email/    # Email verification
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset
│   │   ├── listings/        # Listing pages
│   │   │   ├── [id]/        # Listing detail
│   │   │   └── create/      # Create listing
│   │   ├── my-listings/     # User's listings
│   │   ├── messages/        # Chat interface
│   │   ├── admin/           # Admin dashboard
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ui/              # Button, Input, Modal
│   │   ├── layout/          # Navbar, Footer
│   │   ├── listings/        # ListingCard, ImageUpload
│   │   └── chat/            # MessageBubble
│   ├── lib/                 # Utilities and API client
│   ├── services/            # API services
│   ├── store/               # Zustand stores
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

---

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Supabase account)
- Cloudinary account
- Gmail account (for sending emails)

### 1. Clone the Repository

```bash
git clone https://github.com/raushan0301/Thapar_Marketplace.git
cd Thapar_Marketplace
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database (Get from Supabase dashboard)
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

# Server Port
PORT=5001
```

**Start Backend:**
```bash
npm run dev
# Backend runs on http://localhost:5001
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:5001" >> .env.local
```

**Start Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Database Setup

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Copy the connection string
4. Run the schema:

```bash
psql <your-database-url> -f database/schema.sql
```

### 5. Add Dummy Data (Optional)

```bash
cd backend
npx ts-node add-dummy-listings.ts
```

---

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
- **admin_logs** - Admin action logs

See `database/schema.sql` for complete schema.

---

## 🔒 Security Features

- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ JWT token authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Input validation with Joi
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Campus email verification
- ✅ File type and size validation
- ✅ XSS protection

---

## 📧 Email Templates

Beautiful HTML email templates for:
- Welcome email
- Email verification (OTP)
- Password reset
- Notifications

---

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb)
- **Text**: Gray-900 for headings, Gray-700 for body
- **Borders**: Gray-400 (updated for better visibility)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)

### UI Improvements
- ✅ Removed hero section for cleaner layout
- ✅ Search box integrated into navbar
- ✅ Horizontal category filter chips
- ✅ Full-width layout
- ✅ Improved text contrast and visibility
- ✅ Darker borders for better definition
- ✅ Simplified listing cards

---

## 🚀 Deployment

### Backend (Render/Railway)
1. Create account on Render.com or Railway.app
2. Create new Web Service
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Frontend (Vercel)
1. Create account on Vercel.com
2. Import GitHub repository
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
4. Deploy

---

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

### Listings Endpoints

```
GET    /api/listings                    - Get all listings (with filters)
GET    /api/listings/:id                - Get listing by ID
POST   /api/listings                    - Create listing (protected)
PUT    /api/listings/:id                - Update listing (protected)
DELETE /api/listings/:id                - Delete listing (protected)
PATCH  /api/listings/:id/status         - Update listing status (protected)
GET    /api/listings/user/my-listings   - Get user's listings (protected)
GET    /api/listings/categories         - Get all categories
```

### Messages Endpoints

```
POST   /api/messages                    - Send message (protected)
GET    /api/messages/conversations      - Get conversations (protected)
GET    /api/messages/unread-count       - Get unread count (protected)
GET    /api/messages/user/:userId       - Get messages with user (protected)
PATCH  /api/messages/:messageId/read    - Mark as read (protected)
DELETE /api/messages/:messageId         - Delete message (protected)
```

### Ratings Endpoints

```
POST   /api/ratings                     - Create rating (protected)
GET    /api/ratings/user/:userId        - Get user's ratings
GET    /api/ratings/my-ratings          - Get ratings given by user (protected)
PUT    /api/ratings/:ratingId           - Update rating (protected)
DELETE /api/ratings/:ratingId           - Delete rating (protected)
```

### Admin Endpoints

```
GET    /api/admin/users                 - Get all users (admin)
PATCH  /api/admin/users/:userId/ban     - Ban/unban user (admin)
GET    /api/admin/listings              - Get all listings (admin)
DELETE /api/admin/listings/:listingId   - Delete listing (admin)
POST   /api/admin/categories            - Create category (admin)
PUT    /api/admin/categories/:id        - Update category (admin)
DELETE /api/admin/categories/:id        - Delete category (admin)
GET    /api/admin/analytics             - Get analytics (admin)
GET    /api/admin/logs                  - Get admin logs (admin)
```

---

## 🧪 Testing

### Test User Registration
1. Go to http://localhost:3000/register
2. Fill in the form with your Thapar email
3. Check your email for the 6-digit OTP
4. Enter OTP on verification page

### Test Listing Creation
1. Login to your account
2. Click "Sell Item" in navbar
3. Fill in the form and upload images
4. Click "Create Listing"

### Test Real-time Chat
1. Click on any listing
2. Click "Contact Seller"
3. Send a message
4. Open another browser/incognito window
5. Login as the seller
6. See the message in real-time

---

## 📈 Project Status

| Feature | Status |
|---------|--------|
| Backend API | ✅ Complete |
| Authentication | ✅ Complete |
| Listings | ✅ Complete |
| Real-time Chat | ✅ Complete |
| Ratings System | ✅ Complete |
| Admin Panel | ✅ Complete |
| Frontend UI | ✅ Complete |
| Responsive Design | ✅ Complete |
| **Overall Progress** | **✅ 100%** |

---

## 🎯 Recent Updates (Jan 29, 2026)

### UI/UX Improvements
- ✅ Removed hero section from homepage
- ✅ Integrated search box into navbar
- ✅ Changed category filters to horizontal chips
- ✅ Implemented full-width layout
- ✅ Fixed category filter state management
- ✅ Improved text visibility (darker colors)
- ✅ Enhanced border visibility (gray-400)
- ✅ Fixed input placeholder colors
- ✅ Improved listing detail page text contrast

---

## 🤝 Contributing

This is a campus project for Thapar University. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

ISC

---

## 👨‍💻 Author

**Raushan Raj**
- University: Thapar Institute of Engineering and Technology
- Email: rraj_be23@thapar.edu
- GitHub: [@raushan0301](https://github.com/raushan0301)
- Project: ThaparMarket

---

## 🙏 Acknowledgments

- Thapar University for the opportunity
- Supabase for PostgreSQL hosting
- Cloudinary for image storage
- All open-source libraries used

---

**Built with ❤️ for Thapar University students**

**Last Updated:** January 29, 2026
