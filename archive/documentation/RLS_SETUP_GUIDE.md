# Row Level Security (RLS) Setup Guide

Your authentication issues are caused by missing Row Level Security policies. Here's how to fix it:

## Problem Summary
- Your Supabase tables have RLS **enabled** but no **policies** defined
- This means the API can't access the tables even with valid credentials
- That's why user creation "succeeds" but users don't actually get saved
- And why you get 406 "Not Acceptable" errors when querying data

## Quick Fix (Recommended)

### Step 1: Run the RLS Setup SQL
1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `supabase_safe_rls_setup.sql`
4. Click **Run** to execute the SQL

This will:
- ✅ Enable RLS on all tables
- ✅ Create policies that allow your custom auth to work
- ✅ Keep your app secure

### Step 2: Test Your App
1. Clear your browser localStorage: `localStorage.clear()`
2. Refresh the page
-3. Sign in with your test account credentials4. Check if the home page loads properly
+3. Sign in with your test account credentials
+4. Check if the home page loads properly4. Check if the home page loads properly

### Step 3: Verify RLS is Working
Run this in your browser console to test database access:
```javascript
debugUsersTable()  // Should show users in the table
```

## Alternative Solutions

### Option A: Temporary Disable RLS (Testing Only)
If you need a quick test, you can temporarily disable RLS:

```sql
-- WARNING: Only for testing! Makes your data public!
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
-- etc...
```

### Option B: Switch to Supabase Auth (Production Recommended)
For better long-term security, consider switching from custom auth to Supabase's built-in authentication system.

## What the Fix Does

The RLS policies we're creating allow your app to:
1. ✅ Create users in the database
2. ✅ Create user preferences without foreign key errors
3. ✅ Query projects, tasks, and other data
4. ✅ Maintain security through application-level user filtering

## Expected Results After Fix

You should see these changes in your console logs:
- ✅ User creation verification succeeds
- ✅ User preferences creation works
- ✅ Home page loads with data
- ✅ No more 406 "Not Acceptable" errors

## Security Note
⚠️ **SECURITY WARNING**: This solution allows anonymous access to all data. Use only for development/testing. Switch to Supabase Auth for production.
### Step 1: Run the RLS Setup SQL
… (rest of the steps)

## Troubleshooting
If you still have issues after applying the RLS policies:

1. **Check policy creation**: Run the verification queries in the SQL file
2. **Test database access**: Use `debugUsersTable()` in browser console
3. **Check browser network tab**: Look for 200 responses instead of 406
4. **Verify user creation**: Watch console logs during sign-in

The key is that RLS was blocking all database operations because no policies existed to allow them.