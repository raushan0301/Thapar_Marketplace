# 🔧 Quick Fix: Database Connection Issue

## Problem
```
ENOTFOUND ep-nameless-darkness-a1jiobvx.ap-southeast-1.aws.neon.tech
```

Your Neon database is not reachable. This is likely because:
1. Database is paused (free tier auto-pauses after 5 minutes of inactivity)
2. Database project was deleted
3. Network/DNS issue

## Solution

### Step 1: Check Neon Database Status

1. Go to: https://console.neon.tech
2. Login with your account
3. Look for your project

**If you see your project:**
- Check if it's "Paused" or "Idle"
- Click "Resume" or "Wake up"
- Wait 10-20 seconds

**If you don't see your project:**
- It may have been deleted
- You'll need to create a new one (see Step 2)

### Step 2: Create New Neon Database (If Needed)

1. **Go to Neon Console:**
   ```
   https://console.neon.tech
   ```

2. **Create New Project:**
   - Click "New Project"
   - Name: "thaparmarket"
   - Region: Singapore (ap-southeast-1) or closest to India
   - Click "Create Project"

3. **Get Connection String:**
   - Copy the connection string shown
   - It looks like:
     ```
     postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
     ```

4. **Update backend/.env:**
   - Open `backend/.env`
   - Replace line 6 with your new connection string:
     ```env
     DATABASE_URL=postgresql://your-new-connection-string
     ```

5. **Run Database Schema:**
   ```bash
   # In Neon SQL Editor, run the entire schema.sql file
   # Or use command line:
   psql "your-connection-string" -f database/schema.sql
   ```

### Step 3: Restart Backend

```bash
# Stop the current backend (Ctrl+C in backend terminal)
# Then start again:
cd backend
npm run dev
```

You should see:
```
✅ Connected to Neon PostgreSQL database
✅ Email server is ready to send messages
🚀 Server running on port 5001
```

### Step 4: Test Registration

1. Go to: http://localhost:3000/register
2. Fill the form
3. Click "Create Account"
4. Should work now! ✅

## Quick Test

Test if database is working:

```bash
# Test health endpoint
curl http://localhost:5001/health

# Should return:
# {"success":true,"message":"ThaparMarket API is running","timestamp":"..."}
```

## Common Issues

### Issue: "Connection terminated"
**Fix:** Database is paused. Wake it up in Neon console.

### Issue: "ENOTFOUND"
**Fix:** Database doesn't exist. Create new one.

### Issue: "Authentication failed"
**Fix:** Wrong password in DATABASE_URL. Get fresh connection string.

## Need Help?

1. Check Neon dashboard: https://console.neon.tech
2. Verify DATABASE_URL in backend/.env
3. Restart backend server
4. Check backend terminal for errors

---

**Once database is connected, registration will work!** 🎉
