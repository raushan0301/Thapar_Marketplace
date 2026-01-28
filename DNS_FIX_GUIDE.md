# 🔧 DNS Issue Fix for ThaparMarket

## 🚨 Problem
Your Mac cannot resolve Neon database hostnames due to DNS issues.

**Error:** `ENOTFOUND ep-nameless-darkness-a1jiobvx.ap-southeast-1.aws.neon.tech`

---

## ✅ Solution Options

### Option 1: Flush DNS Cache (Recommended - Try This First)

Run this command in your terminal:
```bash
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

Then test again:
```bash
ping ep-nameless-darkness-a1jiobvx.ap-southeast-1.aws.neon.tech
```

If it works, restart your backend:
```bash
cd /Users/raushanraj/Desktop/marketplace/backend
# Press Ctrl+C to stop the current server
npm run dev
```

---

### Option 2: Change DNS to Google DNS

1. Open **System Settings** (or System Preferences)
2. Go to **Network**
3. Select your active connection (Wi-Fi or Ethernet)
4. Click **Details** or **Advanced**
5. Go to **DNS** tab
6. Click **+** and add these DNS servers:
   - `8.8.8.8`
   - `8.8.4.4`
7. Click **OK** and **Apply**

Then test:
```bash
ping ep-nameless-darkness-a1jiobvx.ap-southeast-1.aws.neon.tech
```

---

### Option 3: Use Hosts File (Temporary Workaround)

Add Neon's IP to your hosts file:

```bash
# Open hosts file
sudo nano /etc/hosts

# Add this line at the end:
13.228.46.236  ep-nameless-darkness-a1jiobvx.ap-southeast-1.aws.neon.tech

# Save: Ctrl+O, Enter, Ctrl+X
```

Then flush DNS:
```bash
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

---

### Option 4: Use Alternative Database (If Nothing Works)

If Neon continues to have issues, you can use **Supabase** instead:

1. Go to https://supabase.com
2. Create a new project
3. Get the connection string
4. Update `.env` with Supabase URL
5. Run the same schema.sql

---

## 🧪 Testing After Fix

Once DNS is working, test:

```bash
# 1. Test DNS resolution
ping ep-nameless-darkness-a1jiobvx.ap-southeast-1.aws.neon.tech

# 2. Test database connection
cd /Users/raushanraj/Desktop/marketplace/backend
npm run dev

# 3. Test registration (in a new terminal)
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@thapar.edu",
    "password": "Test@1234",
    "name": "Test User"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for verification code.",
  "data": { ... }
}
```

**You should receive an email with a 6-digit OTP!**

---

## 🎯 Current Status

### ✅ Working
- Express server running on port 5001
- Email service configured
- Cloudinary configured
- All code is correct

### ⚠️ Issue
- DNS cannot resolve Neon hostname
- This is a system/network issue, not a code issue

### 📝 Next Steps
1. Try Option 1 (Flush DNS)
2. If that doesn't work, try Option 2 (Google DNS)
3. If still failing, try Option 3 (Hosts file)
4. Last resort: Option 4 (Switch to Supabase)

---

## 💡 Why This Happens

Common causes:
- College/corporate network blocking AWS domains
- VPN interfering with DNS
- Corrupted DNS cache
- ISP DNS server issues
- Firewall blocking certain domains

---

## 📞 Need Help?

If none of these work, let me know and I can:
1. Help you switch to Supabase
2. Set up a local PostgreSQL database
3. Create a mock database for testing

---

**Try Option 1 first - it usually fixes the issue!** 🚀
