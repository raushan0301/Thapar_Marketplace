# 🔄 Migration to Supabase Client - Guide

## Overview

We're migrating from direct PostgreSQL connection (`pg` library) to Supabase JavaScript client. This solves the DNS resolution issues and provides better integration with Supabase.

## What Changed

### Before (PostgreSQL Pool):
```typescript
import pool from '../config/database';

const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
);
const user = result.rows[0];
```

### After (Supabase Client):
```typescript
import { supabase } from '../config/supabase';

const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

if (error) throw error;
const user = data;
```

## Migration Steps

### 1. ✅ Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. ✅ Create Supabase Config
File: `src/config/supabase.ts`
- Initializes Supabase client with API keys
- No DNS issues since it uses HTTPS

### 3. ✅ Create Database Helper
File: `src/utils/database.ts`
- Provides helper methods similar to `pool.query()`
- Makes migration easier

### 4. 🔄 Update Controllers (In Progress)
We need to update all controllers to use Supabase client:
- `auth.controller.ts`
- `listing.controller.ts`
- `chat.controller.ts`
- `rating.controller.ts`
- `admin.controller.ts`

### 5. ⏳ Run Database Schema
Execute `database/schema.sql` in Supabase SQL Editor to create tables.

### 6. ⏳ Test All Endpoints
After migration, test all API endpoints to ensure they work.

## Query Conversion Examples

### SELECT with WHERE
**Before:**
```typescript
const result = await pool.query(
    'SELECT * FROM listings WHERE user_id = $1 AND status = $2',
    [userId, 'active']
);
```

**After:**
```typescript
const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');
```

### INSERT
**Before:**
```typescript
const result = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
);
```

**After:**
```typescript
const { data, error } = await supabase
    .from('users')
    .insert({ name, email })
    .select()
    .single();
```

### UPDATE
**Before:**
```typescript
const result = await pool.query(
    'UPDATE listings SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
);
```

**After:**
```typescript
const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
```

### DELETE
**Before:**
```typescript
await pool.query('DELETE FROM listings WHERE id = $1', [id]);
```

**After:**
```typescript
const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);
```

### JOIN Queries
**Before:**
```typescript
const result = await pool.query(`
    SELECT l.*, u.name as seller_name
    FROM listings l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = $1
`, [id]);
```

**After:**
```typescript
const { data, error } = await supabase
    .from('listings')
    .select(`
        *,
        users!user_id (
            name
        )
    `)
    .eq('id', id)
    .single();
```

### COUNT
**Before:**
```typescript
const result = await pool.query('SELECT COUNT(*) FROM listings WHERE status = $1', ['active']);
const count = parseInt(result.rows[0].count);
```

**After:**
```typescript
const { count, error } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
```

## Benefits of Supabase Client

✅ **No DNS Issues** - Uses HTTPS, not direct PostgreSQL connection  
✅ **Built-in Connection Pooling** - Automatic connection management  
✅ **Type Safety** - Better TypeScript support  
✅ **Real-time Support** - Can add real-time subscriptions later  
✅ **Automatic Retries** - Built-in retry logic  
✅ **Better Error Handling** - Clearer error messages  

## Next Steps

1. **Run schema in Supabase SQL Editor**
2. **Migrate auth.controller.ts** (most critical)
3. **Migrate listing.controller.ts**
4. **Migrate other controllers**
5. **Test all endpoints**
6. **Remove old database.ts config**

## Testing

After migration, test these critical flows:
- ✅ User registration
- ✅ User login
- ✅ Create listing
- ✅ View listings
- ✅ Chat functionality
- ✅ Ratings

---

**Status:** Migration in progress  
**Last Updated:** January 31, 2026
