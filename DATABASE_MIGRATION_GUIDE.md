# Database Migration Guide - Missing Schema Fix

## The Problem

Error in production:
```
error: column "first_name" does not exist
```

**Root Cause**: Your **production database** (in Coolify) doesn't have the database tables created yet. The schema exists in the Replit development environment but hasn't been deployed to production.

## The Fix Applied

I've updated `package.json` to **automatically run database migrations** when starting in production:

**Updated `start` script:**
```json
"start": "npm run db:migrate && NODE_ENV=production node dist/index.js"
```

This ensures that every time your app starts in production, it will:
1. Run `drizzle-kit push --force` to sync the database schema
2. Create any missing tables/columns
3. Start the application

## What You Need to Do

### **Option 1: Deploy and Restart (Automatic - Recommended)**

This is the simplest option now that the migration is automated:

1. **Push these changes** to your repository
2. **Deploy to Coolify** (it will rebuild automatically)
3. **Wait for the migration** to complete during startup
4. **App will start** with the correct database schema

The first time it starts, you'll see in the logs:
```
Running database migration...
[✓] Database schema synchronized
Starting application...
```

### **Option 2: Manually Run Migration in Coolify**

If you want to run the migration manually before deploying:

1. In **Coolify**, go to your app
2. Find **Console/Terminal** or **Execute Command**
3. Run:
   ```bash
   npm run db:push
   ```
4. Wait for it to complete
5. Restart your app

## What Gets Created

The migration will create these tables in your production database:

- ✅ `users` - User accounts
- ✅ `subscriptions` - Subscription records
- ✅ `payments` - Payment transactions
- ✅ `questions` - Quiz questions
- ✅ `quiz_attempts` - Quiz attempt records
- ✅ `quiz_answers` - Individual answers
- ✅ `sessions` - User sessions
- ✅ `system_settings` - App configuration (stores admin UID)

## Expected Logs After Fix

Once the migration completes and you log in, you should see:

```
[AUTH USER] Request received
[AUTH USER] Auth header present: true
[AUTH USER] Token verified for: antiperotieno@zohomail.com
[FIREBASE ADMIN] ✓ First Firebase user detected
[AUTH USER] Sending response: { isAdmin: true }
GET /api/auth/user 200 ✅
```

No more column errors!

## Database Schema Details

The `users` table has these columns:
- `id` (varchar) - User ID from Firebase
- `email` (varchar) - Email address
- `first_name` (varchar) - First name
- `last_name` (varchar) - Last name
- `profile_image_url` (varchar) - Profile picture URL
- `has_used_free_trial` (boolean) - Trial usage flag
- `is_admin` (boolean) - Admin status
- `is_banned` (boolean) - Ban status
- `admin_granted_access` (boolean) - Temporary access flag
- `admin_access_expires_at` (timestamp) - Access expiration
- `created_at` (timestamp) - Account creation time
- `updated_at` (timestamp) - Last update time

## Troubleshooting

### If migration fails in Coolify:

1. **Check `DATABASE_URL`** is set correctly
2. **Check database is accessible** from the app
3. **Look at startup logs** for error messages
4. **Manually connect** to the database and check if tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

### If tables already exist but are outdated:

The migration will **update** them automatically. It's safe to run multiple times.

## Summary

**Status:**
- ✅ Code updated to auto-migrate on startup
- ✅ Migration command added to `package.json`
- ⏳ Deploy to Coolify and it will auto-create tables

**Next Steps:**
1. Deploy the updated code to Coolify
2. Wait for migration to complete during startup
3. Log in with antiperotieno@zohomail.com
4. You'll be admin!
