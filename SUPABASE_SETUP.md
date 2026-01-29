# 🚀 Supabase Setup Guide - FINAL FIX

## Why Supabase?
- ✅ No DNS issues (unlike Neon)
- ✅ More reliable and faster
- ✅ Free tier with generous limits
- ✅ Built-in features (Auth, Storage, Realtime)
- ✅ Better dashboard and management

---

## Step-by-Step Setup

### 1. Create Supabase Account
1. Go to: https://supabase.com
2. Click **"Start your project"**
3. Sign in with **GitHub** (recommended) or email

### 2. Create New Project
1. Click **"New Project"**
2. Organization: Select or create one
3. Fill in project details:
   - **Name:** `thaparmarket`
   - **Database Password:** Create a strong password
     - Example: `ThaparMarket@2026!`
     - **SAVE THIS PASSWORD!** You'll need it!
   - **Region:** `Southeast Asia (Singapore)`
   - **Pricing Plan:** Free
4. Click **"Create new project"**
5. Wait 2-3 minutes (grab a coffee ☕)

### 3. Get Connection String
1. Once project is ready, click **"Project Settings"** (⚙️ gear icon, bottom left)
2. Click **"Database"** in the left sidebar
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab (not psql)
5. You'll see something like:
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. Copy this string
7. Replace `[YOUR-PASSWORD]` with the password you created in Step 2

**Example:**


### 4. Update backend/.env
1. Open `backend/.env`
2. Replace line 6 (DATABASE_URL) with your Supabase connection string
3. Save the file

**Example:**
```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 5. Setup Database Schema
Run this command to create all tables:
```bash
cd backend
node -e "const {Pool}=require('pg');const fs=require('fs');const pool=new Pool({connectionString:process.env.DATABASE_URL||require('dotenv').config()&&process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});const sql=fs.readFileSync('../database/schema.sql','utf8');pool.query(sql).then(()=>{console.log('✅ Database schema created!');process.exit(0)}).catch(e=>{console.error('❌ Error:',e);process.exit(1)});"
```

**OR** use the SQL Editor in Supabase:
1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Copy the entire content of `database/schema.sql`
4. Paste it in the SQL editor
5. Click **"Run"** (or press Cmd+Enter)

### 6. Test Connection
```bash
cd backend
npx ts-node test-db.ts
```

You should see:
```
✅ Successfully connected to database!
✅ Query successful!
✅ Database connection test PASSED!
```

### 7. Restart Backend
```bash
# Stop current backend (Ctrl+C)
npm run dev
```

### 8. Test Registration!
1. Go to: http://localhost:3000/register
2. Fill the form:
   - Name: Your Name
   - Email: yourname@thapar.edu
   - Password: YourPass@123
3. Click **"Create Account"**
4. Should work! 🎉

---

## Troubleshooting

### Issue: "Connection timeout"
**Fix:** Make sure you replaced `[YOUR-PASSWORD]` with your actual password

### Issue: "SSL error"
**Fix:** Add `?sslmode=require` to the end of your connection string

### Issue: "Database does not exist"
**Fix:** Use the exact connection string from Supabase (it should end with `/postgres`)

### Issue: "Password authentication failed"
**Fix:** 
1. Go to Supabase → Project Settings → Database
2. Click **"Reset database password"**
3. Set a new password
4. Update your `.env` file

---

## Supabase Dashboard Features

Once setup, you can use Supabase dashboard to:
- **Table Editor:** View and edit data
- **SQL Editor:** Run custom queries
- **Database:** Monitor connections and performance
- **API:** Auto-generated REST and GraphQL APIs
- **Auth:** User management (can replace your custom auth later)
- **Storage:** File uploads (can replace Cloudinary later)

---

## Next Steps After Setup

1. ✅ Test registration
2. ✅ Test login
3. ✅ Test creating listings
4. ✅ Test chat
5. ✅ Deploy to production

---

## Connection String Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
```

**Supabase Example:**
```
postgresql://postgres.abcd1234:MyPassword123!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Important:**
- User: `postgres.xxxxx` (Supabase provides this)
- Password: Your chosen password
- Host: `aws-0-ap-southeast-1.pooler.supabase.com`
- Port: `6543` (Supabase uses this for pooling)
- Database: `postgres` (default)

---

## Why This Will Work

1. **Supabase has better DNS** - No resolution issues
2. **More stable infrastructure** - AWS-backed
3. **Connection pooling built-in** - Better performance
4. **Free tier is generous:**
   - 500 MB database
   - Unlimited API requests
   - 50,000 monthly active users
   - 2 GB file storage

---

## 🎉 Ready to Go!

Follow the steps above and your database will work perfectly!

**Estimated time:** 5-10 minutes

**Any questions?** Check the Supabase docs: https://supabase.com/docs
