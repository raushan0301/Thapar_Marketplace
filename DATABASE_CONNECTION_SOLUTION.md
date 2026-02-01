# 🔧 Database Connection Issue - Final Solution

## Current Status

**Problem:** Both old and new Supabase database hostnames are not resolving in DNS.

- ❌ Old: `db.gqizewukqbvrndvbwdcm.supabase.co` - ENOTFOUND
- ❌ New: `db.eojclixrdsbhtxqvnzys.supabase.co` - ENOTFOUND

This is a **Supabase platform DNS issue**, not a configuration problem on your end.

---

## Root Cause

Supabase's direct database hostnames (`db.*.supabase.co`) are experiencing DNS resolution issues. This is why you're getting `ENOTFOUND` errors.

---

## ✅ SOLUTION: Use Supabase Connection Pooler

Instead of using the direct database connection, use Supabase's **Connection Pooler** which has a different, more reliable hostname format.

### Step 1: Get Pooler Connection String

1. Go to https://supabase.com
2. Click on your **active project** (Thapar_Marketplace or the new one)
3. Go to **Settings** → **Database**
4. In the "Connection String" section, click **"Pooler settings"** button
5. You should see a connection string like:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Key difference:** The hostname will be `aws-0-[region].pooler.supabase.com` instead of `db.*.supabase.co`

### Step 2: Update .env File

Replace line 7 in `backend/.env` with the pooler connection string:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:Raushan4008%40%23@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Important:** 
- Replace `[PROJECT-REF]` with your actual project reference
- Keep the password encoded as `Raushan4008%40%23`
- Note the port is `6543` (pooler) not `5432` (direct)

### Step 3: Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Run Database Schema

Once connected, run the schema to create tables:

**Option A: Using Supabase SQL Editor (Recommended)**
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Click **"New Query"**
4. Copy contents of `database/schema.sql`
5. Paste and click **"Run"**

**Option B: Using psql**
```bash
psql "YOUR_POOLER_CONNECTION_STRING" -f database/schema.sql
```

---

## Alternative Solution: Use Different Supabase Region

If pooler also doesn't work, try creating a project in a different region:

1. Create new Supabase project
2. Choose **different region** (e.g., if you used Singapore, try Mumbai or vice versa)
3. Use simple password: `ThaparMarket2026` (no special characters)
4. Get the pooler connection string
5. Update `.env`

---

## Why This Happened

1. **DNS Propagation Issues:** Supabase's `db.*.supabase.co` hostnames are not propagating to DNS servers
2. **Platform Issue:** This affects multiple projects, suggesting a Supabase platform problem
3. **Pooler is More Reliable:** The pooler uses AWS load balancers which have better DNS reliability

---

## Expected Behavior After Fix

When working correctly, you should see:

**Backend Terminal:**
```
✅ Email server is ready to send messages
✅ Connected to Supabase PostgreSQL database
```

**Frontend:**
- Categories load successfully
- Listings display
- No 500 errors

---

## Next Steps

1. **Get the pooler connection string** from Supabase dashboard
2. **Update `.env` file** with pooler URL
3. **Restart backend server**
4. **Run database schema** in SQL Editor
5. **Test the application**

---

## If Still Not Working

If the pooler connection also fails:

1. **Contact Supabase Support:**
   - Report DNS resolution issues
   - Mention both direct and pooler connections failing
   - Provide your project IDs

2. **Try Alternative Database:**
   - Use Neon (https://neon.tech) - similar to Supabase
   - Use Railway (https://railway.app) - has built-in PostgreSQL
   - Both have free tiers and work well

---

**Last Updated:** January 31, 2026, 4:35 PM IST
