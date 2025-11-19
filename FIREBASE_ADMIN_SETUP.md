# Firebase Admin Setup for Production

## The Admin System

Your NurseBrace application uses **Firebase-based admin authentication**. The first person who signed up to Firebase (by creation date) is automatically the admin.

## How It Works

1. **First Login Detection**: When a user logs in, the backend checks if they are the first Firebase user
2. **Persistence**: The first user's UID is saved to the `system_settings` table to prevent changes
3. **Automatic Admin Access**: The first user gets `is_admin = true` in the database
4. **Auto-Redirect**: Admins are automatically redirected to `/admin` when they log in

## Required Environment Variables for Production

To make the admin detection work in production, you **MUST** configure Firebase Admin credentials:

### Option 1: Service Account Key (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **quizeforge-44a83**
3. Go to **Project Settings** (gear icon) → **Service Accounts** tab
4. Click **Generate New Private Key**
5. Download the JSON file
6. Copy the **entire JSON contents** and set it as an environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"quizeforge-44a83",...}'
```

**Important**: The value must be the complete JSON string, including all quotes and braces.

### Option 2: Application Default Credentials

If deploying on Google Cloud Platform, Cloud Run, or similar:

1. Deploy with a service account that has Firebase Admin SDK permissions
2. Set the project ID environment variable:

```bash
FIREBASE_PROJECT_ID=quizeforge-44a83
```

## Verification

After deployment, check your server logs for:

```
[FIREBASE ADMIN] No persisted first user UID found, querying Firebase Auth...
[FIREBASE ADMIN] Fetching users page... (current total: 0)
[FIREBASE ADMIN] Total Firebase users found: 8
[FIREBASE ADMIN] First user by creation time: antiperotieno@zohom... (Created: Oct 26, 2025)
[FIREBASE ADMIN] First Firebase user identified and persisted: antiperotieno@zohom... (UID: ...)
```

## Testing Admin Access

1. Log in with the first Firebase account: **antiperotieno@zohom...**
2. You should see these logs:
   ```
   [AUTH USER] Token verified for: antiperotieno@zohom...
   [FIREBASE ADMIN] First Firebase user detected: antiperotieno@zohom... (UID: ...)
   [FIREBASE ADMIN] Granting admin status to first Firebase user: antiperotieno@zohom...
   ```
3. You should be automatically redirected to `/admin`

## Troubleshooting

### Not redirecting to /admin?

**Check server logs for:**

1. **Token verification**: Should see `[AUTH USER] Token verified for: your-email`
2. **Admin detection**: Should see `[FIREBASE ADMIN] First Firebase user detected`
3. **Database update**: Should see `[FIREBASE ADMIN] Granting admin status to first Firebase user`

### Error: "Failed to list Firebase users"

This means Firebase Admin credentials are not configured. You need to set `FIREBASE_SERVICE_ACCOUNT_KEY`.

### Error: "Credential implementation failed to fetch"

The service account JSON is invalid or malformed. Make sure you copied the complete JSON.

### Still not working?

1. Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly in production
2. Restart your production server after setting environment variables
3. Clear browser cache and cookies, then log in again
4. Check server logs for any Firebase errors

## Database Table

The admin UID is persisted in the `system_settings` table:

```sql
SELECT * FROM system_settings WHERE key = 'first_firebase_user_uid';
```

This ensures the admin cannot be changed even if users are deleted from Firebase.

## Security Notes

- **Only the first Firebase user** (by creation time) can be admin
- Admin status is **immutable** once persisted to the database
- No hardcoded emails - completely Firebase-driven
- Client-side cannot fake admin status - it's verified on the backend
