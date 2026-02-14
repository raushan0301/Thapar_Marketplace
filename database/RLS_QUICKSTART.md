# Quick Start: Applying RLS Policies to ThaparMarket Database

## ⚠️ IMPORTANT: Read Before Applying

1. **Backup your database first!**
2. **Test in development environment before production**
3. **Ensure your backend uses `SUPABASE_SERVICE_KEY`** (not anon key)

---

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `ThaparMarket`
3. Navigate to: **SQL Editor** (left sidebar)

---

## Step 2: Apply RLS Policies

### Option A: Via Supabase Dashboard (Recommended)

1. Open SQL Editor
2. Click "New Query"
3. Copy the entire contents of `database/migrations/enable_rls_policies.sql`
4. Paste into the SQL Editor
5. Click "Run" button
6. Wait for confirmation: "Success. No rows returned"

### Option B: Via Command Line

```bash
# If you have direct database access
psql -h <your-supabase-host> -U postgres -d postgres -f database/migrations/enable_rls_policies.sql
```

---

## Step 3: Verify RLS is Enabled

Run this query in SQL Editor:

```sql
-- Check RLS status on all tables
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result**: All tables should show `RLS Enabled = true`

---

## Step 4: Verify Policies Exist

Run this query:

```sql
-- Count policies per table
SELECT 
  tablename, 
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected Result**:
```
categories     | 2
favorites      | 3
listings       | 5
messages       | 3
notifications  | 3
ratings        | 4
reports        | 3
users          | 4
```

---

## Step 5: Test Security (Important!)

### Test 1: Verify Backend Still Works

```bash
# In your backend terminal
# Restart the server
npm run dev
```

Try these operations:
- ✅ User login
- ✅ Create listing
- ✅ Send message
- ✅ View listings

**If any fail**: Check that backend uses `SUPABASE_SERVICE_KEY`

### Test 2: Verify User Privacy

In SQL Editor, run as a test user:

```sql
-- This should return ONLY your messages, not others'
SELECT * FROM messages;

-- This should return ONLY your favorites
SELECT * FROM favorites;

-- This should return ONLY your notifications
SELECT * FROM notifications;
```

---

## Step 6: Monitor for Issues

### Check Supabase Logs

1. Go to **Logs** → **Database Logs**
2. Look for RLS policy violations
3. Common issues:
   - "permission denied for table X" → Policy missing or incorrect
   - "new row violates row-level security policy" → Insert policy too restrictive

---

## Troubleshooting

### Issue 1: Backend Operations Fail

**Symptom**: API returns 403 or permission errors

**Solution**:
```typescript
// In backend/src/config/supabase.ts
// Ensure you're using SERVICE_KEY, not ANON_KEY
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // ← Must be SERVICE_KEY
);
```

### Issue 2: Users Can't View Listings

**Symptom**: Frontend shows "No listings found"

**Solution**: Verify user is authenticated
```typescript
// Check that token is being sent
const token = localStorage.getItem('token');
// Token should exist and be valid
```

### Issue 3: Admin Can't Access Admin Features

**Symptom**: Admin sees permission errors

**Solution**: Verify admin flag in database
```sql
-- Check admin status
SELECT id, email, is_admin FROM users WHERE email = 'admin@thapar.edu';

-- If not admin, update:
UPDATE users SET is_admin = true WHERE email = 'admin@thapar.edu';
```

---

## Rollback (If Needed)

If something goes wrong, you can disable RLS:

```sql
-- EMERGENCY ROLLBACK - Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

**Note**: This removes all security! Only use temporarily while debugging.

---

## Post-Deployment Checklist

- [ ] RLS enabled on all 8 tables
- [ ] All policies created successfully
- [ ] Backend operations working (login, create listing, etc.)
- [ ] Users can view public data (listings, categories)
- [ ] Users cannot view others' private data (messages, favorites)
- [ ] Admin can access admin features
- [ ] Banned users cannot create content
- [ ] No errors in Supabase logs

---

## Security Best Practices Going Forward

1. **Never disable RLS in production**
2. **Always use service key in backend**
3. **Test new features with RLS enabled**
4. **Review policies when adding new tables**
5. **Monitor Supabase logs for policy violations**
6. **Keep service keys secure (never commit to git)**

---

## Need Help?

1. Check `database/SECURITY_AUDIT.md` for detailed policy explanations
2. Review Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
3. Test in development first!

---

**Ready to apply?** → Go to Step 1 above ☝️
