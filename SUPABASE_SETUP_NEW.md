# 🚀 Create New Supabase Database - Quick Guide

## Step 1: Create Supabase Project (2 minutes)

1. **Go to:** https://supabase.com
2. **Click:** "New Project"
3. **Fill in:**
   - **Name:** ThaparMarket
   - **Database Password:** Create a strong password (SAVE THIS!)
     - Example: `ThaparMarket2026!`
     - **IMPORTANT:** Avoid special characters like `@`, `#`, `%` in password
   - **Region:** Choose closest to India (e.g., Singapore, Mumbai)
4. **Click:** "Create new project"
5. **Wait:** 2-3 minutes for setup

## Step 2: Get Connection String (1 minute)

1. **Click:** Settings (gear icon) in left sidebar
2. **Click:** Database
3. **Scroll to:** "Connection String" section
4. **Select:** URI tab
5. **Copy** the connection string (looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
6. **Replace** `[YOUR-PASSWORD]` with your actual password

## Step 3: Update .env File

Open `backend/.env` and replace line 6:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Example:**
```env
DATABASE_URL=postgresql://postgres.abcdefgh:ThaparMarket2026!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

## Step 4: Run Database Schema (1 minute)

```bash
cd /Users/raushanraj/Desktop/marketplace
psql "YOUR_NEW_DATABASE_URL" -f database/schema.sql
```

**Or use Supabase SQL Editor:**
1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy contents of `database/schema.sql`
5. Paste and click **Run**

## Step 5: Restart Backend

```bash
cd backend
npm run dev
```

You should now see:
```
✅ Connected to Supabase PostgreSQL database
```

## Step 6: Add Dummy Data (Optional)

```bash
cd backend
npx ts-node add-dummy-listings.ts
```

---

## ⚠️ Password Tips

**Good passwords (no special chars):**
- `ThaparMarket2026`
- `Marketplace123`
- `SecurePass456`

**Avoid these characters in password:**
- `@` (conflicts with URL format)
- `#` (needs encoding)
- `%` (needs encoding)
- `&` (needs encoding)

If you must use special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`

---

## 🎯 Quick Summary

1. Create new Supabase project at https://supabase.com
2. Get connection string from Settings → Database
3. Update `backend/.env` line 6
4. Run `database/schema.sql` in Supabase SQL Editor
5. Restart backend server
6. Test creating a listing

**Total Time:** ~5 minutes

---

**After this, your create listing will work perfectly!** ✅
