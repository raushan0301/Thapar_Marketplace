# 🚀 ThaparMarket - Quick Start Guide

Get ThaparMarket up and running in 5 minutes!

---

## Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL** (Supabase account - free)
- **Cloudinary** account (free)
- **Gmail** account (for emails)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/raushan0301/Thapar_Marketplace.git
cd Thapar_Marketplace
```

---

## Step 2: Backend Setup (2 minutes)

### Install Dependencies
```bash
cd backend
npm install
```

### Configure Environment
Create `.env` file:
```env
# Database (Get from Supabase.tech)
DATABASE_URL=postgresql://username:password@host/database

# JWT Secret (any random string)
JWT_SECRET=your-super-secret-key-change-this

# Cloudinary (Get from Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Gmail (Use App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# URLs
FRONTEND_URL=http://localhost:3000
PORT=5001
```

### Start Backend
```bash
npm run dev
```

✅ Backend running on **http://localhost:5001**

---

## Step 3: Frontend Setup (1 minute)

### Install Dependencies
```bash
cd ../frontend
npm install
```

### Configure Environment
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

### Start Frontend
```bash
npm run dev
```

✅ Frontend running on **http://localhost:3000**

---

## Step 4: Database Setup (1 minute)

### Option A: Use Supabase Console
1. Go to https://supabase.com
2. Create new project
3. Copy connection string to `.env`
4. Run schema in Supabase SQL Editor:
   - Copy contents of `database/schema.sql`
   - Paste and execute in SQL Editor

### Option B: Use psql
```bash
psql <your-database-url> -f database/schema.sql
```

---

## Step 5: Add Dummy Data (Optional)

```bash
cd backend
npx ts-node add-dummy-listings.ts
```

This adds:
- 12 sample listings
- Multiple categories
- Test data for development

---

## 🎉 You're Ready!

### Test the Application

1. **Open Browser:** http://localhost:3000

2. **Register Account:**
   - Click "Sign up"
   - Use your Thapar email (@thapar.edu)
   - Check email for OTP
   - Verify and login

3. **Browse Listings:**
   - View all listings on homepage
   - Use category filters
   - Search for items

4. **Create Listing:**
   - Click "Sell Item"
   - Fill form and upload images
   - Submit listing

5. **Test Chat:**
   - Click on any listing
   - Click "Contact Seller"
   - Send a message

---

## 🔧 Quick Configuration Guides

### Get Supabase Database URL

1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Go to Dashboard → Connection Details
5. Copy connection string
6. Add to `.env` as `DATABASE_URL`

### Get Cloudinary Credentials

1. Go to https://cloudinary.com
2. Sign up (free - 25GB storage)
3. Go to Dashboard
4. Copy:
   - Cloud Name
   - API Key
   - API Secret
5. Add to `.env`

### Get Gmail App Password

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate password for "Mail"
5. Copy 16-character password
6. Add to `.env` as `EMAIL_PASSWORD`

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `EADDRINUSE: address already in use :::5001`

**Solution:**
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
npm run dev
```

### Frontend won't start

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Database connection error

**Error:** `connect ECONNREFUSED` or `getaddrinfo ENOTFOUND`

**Solution:**
1. Check `DATABASE_URL` in `.env`
2. Ensure Supabase database is active
3. Verify connection string format:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### Email not sending

**Error:** `Invalid login` or `Authentication failed`

**Solution:**
1. Use Gmail App Password (not regular password)
2. Enable 2FA on Google Account
3. Generate new App Password
4. Use 16-character password in `.env`

### Images not uploading

**Error:** `Cloudinary error` or `Upload failed`

**Solution:**
1. Check Cloudinary credentials in `.env`
2. Verify Cloud Name, API Key, API Secret
3. Check file size (max 5MB)
4. Verify file type (jpg, png, gif, webp)

---

## 📝 Common Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

### Database
```bash
# Run schema
psql $DATABASE_URL -f database/schema.sql

# Add dummy data
cd backend
npx ts-node add-dummy-listings.ts
```

---

## 🎯 What's Next?

1. **Explore Features:**
   - Create listings
   - Test real-time chat
   - Try rating system
   - Check admin panel (if admin)

2. **Customize:**
   - Update colors in `globals.css`
   - Modify categories in database
   - Add your own dummy data

3. **Deploy:**
   - See `README.md` for deployment guide
   - Deploy backend to Render/Railway
   - Deploy frontend to Vercel

---

## 📚 Additional Resources

- **Full Documentation:** `README.md`
- **API Reference:** `backend/API_REFERENCE.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
- **Project Status:** `PROJECT_COMPLETE.md`

---

## 💡 Tips

- Use **Chrome DevTools** to debug
- Check **browser console** for errors
- Check **backend terminal** for API logs
- Use **Postman** to test API endpoints
- Enable **React DevTools** for debugging

---

## 🆘 Need Help?

1. Check `TESTING_GUIDE.md` for detailed testing
2. Review `backend/API_REFERENCE.md` for API docs
3. Check GitHub Issues
4. Contact: rraj_be23@thapar.edu

---

**Happy Coding! 🚀**

Built with ❤️ for Thapar University
