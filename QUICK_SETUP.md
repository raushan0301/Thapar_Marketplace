# 🚀 ThaparMarket - Quick Setup Checklist

## ✅ Step-by-Step Setup (Follow in Order)

### 1. Neon Database Setup (5 minutes)

**A. Create Account & Project**
- Go to: https://neon.tech (already open in your browser)
- Click "Sign up" → Sign up with GitHub or Email
- Click "Create Project"
  - Name: `thaparmarket`
  - Region: Singapore or closest to India
  - Click "Create Project"

**B. Copy Connection String**
- After project creation, you'll see a connection string
- Example: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb`
- **COPY THIS ENTIRE STRING!**

**C. Run Database Schema**
- In Neon dashboard, click "SQL Editor" (left sidebar)
- Open this file: `/Users/raushanraj/Desktop/marketplace/database/schema.sql`
- Copy ALL the content (201 lines)
- Paste into Neon SQL Editor
- Click "Run" or press Cmd+Enter
- You should see: "Success" with "12 rows inserted" (for categories)

**D. Update .env file**
- Open: `/Users/raushanraj/Desktop/marketplace/backend/.env`
- Find line 6: `DATABASE_URL=postgresql://username:password@host/database`
- Replace with your Neon connection string
- Save the file

---

### 2. Cloudinary Setup (5 minutes)

**A. Create Account**
- Go to: https://cloudinary.com
- Click "Sign Up Free"
- Sign up with Email or Google
- Verify your email

**B. Get Credentials**
- After login, you'll be on the Dashboard
- You'll see three values:
  - **Cloud Name**: (e.g., `dxxxxx`)
  - **API Key**: (e.g., `123456789012345`)
  - **API Secret**: (click "eye" icon to reveal)
- **COPY ALL THREE VALUES!**

**C. Update .env file**
- Open: `/Users/raushanraj/Desktop/marketplace/backend/.env`
- Find lines 13-15:
  ```
  CLOUDINARY_CLOUD_NAME=your-cloud-name
  CLOUDINARY_API_KEY=your-api-key
  CLOUDINARY_API_SECRET=your-api-secret
  ```
- Replace with your actual values
- Save the file

---

### 3. Gmail App Password Setup (5 minutes)

**A. Enable 2-Factor Authentication (if not already)**
- Go to: https://myaccount.google.com/security
- Find "2-Step Verification"
- Click "Get Started" and follow instructions
- Complete setup

**B. Generate App Password**
- Go to: https://myaccount.google.com/apppasswords
- You might need to sign in again
- Select app: "Mail"
- Select device: "Other (Custom name)"
- Type: "ThaparMarket"
- Click "Generate"
- You'll see a 16-character password (e.g., `abcd efgh ijkl mnop`)
- **COPY THIS PASSWORD!** (remove spaces)

**C. Update .env file**
- Open: `/Users/raushanraj/Desktop/marketplace/backend/.env`
- Find lines 20-21:
  ```
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  ```
- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-app-password` with the 16-char password (no spaces)
- Example: `EMAIL_PASSWORD=abcdefghijklmnop`
- Save the file

---

### 4. Generate JWT Secret (1 minute)

**Option A: Use OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option B: Use Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Use a random string generator**
- Go to: https://www.random.org/strings/
- Generate a long random string (32+ characters)

**Update .env file**
- Open: `/Users/raushanraj/Desktop/marketplace/backend/.env`
- Find line 9: `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`
- Replace with your generated secret
- Save the file

---

## ✅ Verification Checklist

Before starting the server, verify your `.env` file has:

- [ ] `DATABASE_URL` - Neon connection string (starts with `postgresql://`)
- [ ] `JWT_SECRET` - Random 32+ character string
- [ ] `CLOUDINARY_CLOUD_NAME` - Your cloud name
- [ ] `CLOUDINARY_API_KEY` - Your API key
- [ ] `CLOUDINARY_API_SECRET` - Your API secret
- [ ] `EMAIL_USER` - Your Gmail address
- [ ] `EMAIL_PASSWORD` - 16-character app password (no spaces)

---

## 🚀 Start the Server

Once all values are filled in:

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

---

## 🧪 Test the API

**Test 1: Health Check**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "ThaparMarket API is running",
  "timestamp": "2026-01-27T..."
}
```

**Test 2: Register a User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@thapar.edu",
    "password": "Test@1234",
    "name": "Test User",
    "department": "CSE",
    "year": 3
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for verification code.",
  "data": { ... }
}
```

**You should receive an email with a 6-digit OTP!**

---

## 🐛 Troubleshooting

### Database connection error
- Verify DATABASE_URL is correct
- Check Neon project is active
- Make sure schema.sql was run successfully

### Email not sending
- Verify you used App Password, not regular password
- Check 2FA is enabled on Google account
- Remove any spaces from the password

### Port 5000 already in use
```bash
lsof -ti:5000 | xargs kill -9
```

---

## 📞 Next Steps

Once backend is working:
1. ✅ Test all auth endpoints
2. ⏳ Build the frontend
3. ⏳ Create listing pages
4. ⏳ Implement chat

---

**Let me know when you've completed the setup!** 🎉
