# 🚀 Quick Setup Guide for ThaparMarket

## Step 1: Install Backend Dependencies

```bash
cd /Users/raushanraj/Desktop/marketplace/backend
npm install
```

This will install all required packages (Express, PostgreSQL, JWT, Cloudinary, etc.)

## Step 2: Create Neon Database

1. Go to https://neon.tech
2. Sign up with GitHub or Email
3. Click "Create Project"
4. Name it "thaparmarket"
5. Select region closest to India (Singapore or Mumbai if available)
6. Copy the connection string (looks like: `postgresql://username:password@host/database`)

## Step 3: Setup Database Schema

1. In Neon dashboard, click "SQL Editor"
2. Copy the entire content from `/Users/raushanraj/Desktop/marketplace/database/schema.sql`
3. Paste it in the SQL Editor
4. Click "Run" to create all tables

OR use command line:
```bash
psql <your-neon-connection-string> -f /Users/raushanraj/Desktop/marketplace/database/schema.sql
```

## Step 4: Setup Cloudinary

1. Go to https://cloudinary.com
2. Sign up (free account)
3. Go to Dashboard
4. Copy these three values:
   - Cloud Name
   - API Key
   - API Secret

## Step 5: Setup Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Name it "ThaparMarket"
6. Click "Generate"
7. Copy the 16-character password (remove spaces)

## Step 6: Create .env File

```bash
cd /Users/raushanraj/Desktop/marketplace/backend
cp .env.example .env
```

Now edit the `.env` file and fill in your values:

```env
NODE_ENV=development
PORT=5000

# Paste your Neon connection string here
DATABASE_URL=postgresql://username:password@host/database

# Generate a random secret (or use: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Paste your Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Your Email Service Configuration
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=ThaparMarket <noreply@thaparmarket.com>

FRONTEND_URL=http://localhost:3000
CAMPUS_EMAIL_DOMAIN=@thapar.edu

MAX_FILE_SIZE=5242880
MAX_FILES=6

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 7: Start Backend Server

```bash
cd /Users/raushanraj/Desktop/marketplace/backend
npm run dev
```

You should see:
```
✅ Connected to Neon PostgreSQL database
✅ Email server is ready to send messages
🚀 Server running on port 5000
```

## Step 8: Test the API

Open a new terminal and test:

```bash
curl http://localhost:5000/health
```

You should get:
```json
{
  "success": true,
  "message": "ThaparMarket API is running",
  "timestamp": "2026-01-27T..."
}
```

## Step 9: Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yourname@thapar.edu",
    "password": "YourSecurePassword123!",
    "name": "Your Name",
    "department": "CSE",
    "year": 3
  }'
```

You should receive a success message and an OTP email!

## 🎉 Backend is Ready!

Next steps:
1. ✅ Backend is running
2. ⏳ Build the frontend (Next.js)
3. ⏳ Create listing pages
4. ⏳ Implement chat
5. ⏳ Build admin panel

---

## 🐛 Troubleshooting

### Database connection error
- Check your DATABASE_URL is correct
- Make sure Neon project is active
- Verify you ran the schema.sql file

### Email not sending
- Verify Gmail App Password (not regular password)
- Check 2FA is enabled on Google account
- Make sure EMAIL_USER and EMAIL_PASSWORD are correct

### Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Need Help?

Check the main README.md for detailed documentation!
