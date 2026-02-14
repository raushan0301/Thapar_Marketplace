# 🔒 Database Security Implementation Checklist

## Pre-Implementation ✓

- [x] Database schema analyzed (8 tables)
- [x] Security vulnerabilities identified
- [x] RLS policies designed (27 policies)
- [x] Documentation created
- [x] Backend verified to use service key ✅

---

## Implementation Steps

### Step 1: Backup Database
- [ ] Go to Supabase Dashboard
- [ ] Navigate to Database → Backups
- [ ] Verify automatic backups are enabled
- [ ] (Optional) Create manual backup

### Step 2: Review Documentation
- [ ] Read `SECURITY_SUMMARY.md` (overview)
- [ ] Read `RLS_QUICKSTART.md` (instructions)
- [ ] Read `SECURITY_AUDIT.md` (detailed policies)

### Step 3: Apply RLS Policies
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Open file: `database/migrations/enable_rls_policies.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Wait for "Success. No rows returned"

### Step 4: Verify RLS Enabled
Run this query in SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
- [ ] All 8 tables show `rowsecurity = true`

### Step 5: Verify Policies Created
Run this query:
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```
- [ ] users: 4 policies
- [ ] categories: 2 policies
- [ ] listings: 5 policies
- [ ] messages: 3 policies
- [ ] ratings: 4 policies
- [ ] favorites: 3 policies
- [ ] reports: 3 policies
- [ ] notifications: 3 policies

---

## Testing

### Backend Operations
- [ ] User registration works
- [ ] User login works
- [ ] Create listing works
- [ ] Update listing works
- [ ] Delete listing works
- [ ] Send message works
- [ ] View messages works
- [ ] Create rating works

### Security Tests
- [ ] Users cannot view others' messages
- [ ] Users cannot view others' favorites
- [ ] Users cannot view others' notifications
- [ ] Users cannot update others' listings
- [ ] Banned users cannot create listings
- [ ] Users cannot rate themselves
- [ ] Users cannot message themselves

### Admin Tests (if you have admin user)
- [ ] Admin can view all users
- [ ] Admin can update any listing
- [ ] Admin can resolve reports

---

## Post-Implementation

### Monitoring
- [ ] Check Supabase Logs for RLS violations
- [ ] Monitor application errors
- [ ] Test all major features

### Documentation
- [ ] Update team on security changes
- [ ] Document any custom policies added
- [ ] Keep security docs updated

---

## Rollback Plan (If Needed)

If something goes wrong:

```sql
-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

Then:
- [ ] Identify the issue
- [ ] Fix the policy
- [ ] Re-enable RLS
- [ ] Test again

---

## Common Issues & Solutions

### Issue: Backend returns 403 errors
**Solution**: Verify backend uses `SUPABASE_SERVICE_KEY`
- [x] Already verified ✅ (backend/src/config/supabase.ts)

### Issue: Users can't view listings
**Solution**: Verify user is authenticated
- [ ] Check token exists in localStorage
- [ ] Check token is sent in API requests

### Issue: Admin features don't work
**Solution**: Verify admin flag in database
```sql
SELECT email, is_admin FROM users WHERE email = 'your-admin@thapar.edu';
-- If false, update:
UPDATE users SET is_admin = true WHERE email = 'your-admin@thapar.edu';
```

---

## Security Best Practices

### Going Forward
- [ ] Never disable RLS in production
- [ ] Always test new features with RLS enabled
- [ ] Review policies when adding new tables
- [ ] Monitor logs for policy violations
- [ ] Keep service keys secure

### Code Reviews
- [ ] Verify new features respect RLS
- [ ] Check for service key usage (backend only)
- [ ] Ensure no RLS bypass in frontend

---

## Status

**Current Status**: 🟡 Policies created, not yet applied

**After applying**: 🟢 Database fully secured

**Priority**: 🔴 HIGH - Apply ASAP

---

## Quick Reference

### Files Created
```
database/
├── migrations/
│   └── enable_rls_policies.sql    ← Run this in Supabase SQL Editor
├── SECURITY_AUDIT.md              ← Detailed documentation
├── RLS_QUICKSTART.md              ← Step-by-step guide
├── SECURITY_SUMMARY.md            ← Overview
└── IMPLEMENTATION_CHECKLIST.md    ← This file
```

### Key Commands

**Verify RLS:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**Count Policies:**
```sql
SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename;
```

**Check Admin:**
```sql
SELECT email, is_admin FROM users WHERE is_admin = true;
```

---

## Notes

- Backend already configured correctly ✅
- Service key properly used ✅
- All policies designed and ready ✅
- Documentation complete ✅

**Next**: Apply policies in Supabase Dashboard

---

**Last Updated**: 2026-02-14
**Ready to Apply**: ✅ YES
