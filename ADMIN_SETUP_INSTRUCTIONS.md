# Admin Panel Setup Instructions

## Current Status ✅

The admin panel system is fully implemented and ready to use. Here's what's in place:

### Backend Features
- ✅ Admin middleware to protect admin-only routes
- ✅ Endpoints to make users admin and revoke admin status
- ✅ Endpoint to grant/revoke temporary admin access
- ✅ User management APIs (ban, unban, manage subscriptions)
- ✅ Admin analytics dashboard API
- ✅ Question management APIs

### Frontend Features
- ✅ Automatic redirect to admin panel upon login for admin users
- ✅ Full admin dashboard with user management
- ✅ UI to add/remove admins with Shield icons
- ✅ User banning and subscription management
- ✅ Email sending to users
- ✅ Admin question bank management
- ✅ Analytics dashboard

## How to Set Initial Admin (antiperotieno@zohomail.com)

### Step 1: User Must Log In First
The user with email `antiperotieno@zohomail.com` needs to log in to the application at least once. This will:
1. Authenticate them via Firebase
2. Automatically create their user record in the database

### Step 2: Set Admin Status (Development Only)
After the user has logged in once, run this command to set them as admin:

```bash
curl -X POST http://localhost:5000/api/admin/set-admin-by-email \
  -H "Content-Type: application/json" \
  -d '{"email": "antiperotieno@zohomail.com", "setupToken": "dev-setup-token-change-in-production"}'
```

**Note:** This endpoint is only available in development mode for security reasons.

### Step 3: Verify Admin Access
1. The user should log out and log back in
2. Upon login, they will be automatically redirected to `/admin`
3. They will see the full admin dashboard with all management features

## Adding Additional Admins

Once you have at least one admin, additional admins can be added through the UI:

1. Log in as an admin
2. Navigate to **Admin Panel → Users**
3. Find the user you want to make an admin
4. Click the green **Shield icon** (🛡️) next to their name
5. Confirm the action

The user will immediately have admin privileges and will be redirected to the admin panel on their next login.

## Revoking Admin Status

1. Go to **Admin Panel → Users**
2. Find the admin user (they will have an "Admin" badge)
3. Click the orange **ShieldOff icon** to revoke their admin status
4. Note: You cannot revoke your own admin status or the last admin's status

## Admin Panel Features

### Dashboard
- Total revenue analytics
- Active users count
- User growth trends
- Quiz completion statistics

### Users Management
- View all users with filtering (All, Subscribers, Trial Available, Banned)
- Grant/revoke temporary access
- Make/remove permanent admins
- Ban/unban users
- Manage subscriptions (extend/end)
- Send emails to individual users

### Questions Management
- View all questions in the question bank
- Add new questions
- Bulk upload questions
- Edit existing questions
- Delete questions

### Marketing
- Email campaigns
- User engagement metrics

## Security Notes

1. The `/api/admin/set-admin-by-email` endpoint is:
   - Only accessible in development mode
   - Requires a setup token
   - Disabled in production for security

2. In production, use the admin UI to manage admin users

3. The last admin cannot be removed to prevent lockout

## Troubleshooting

### Admin not redirecting to admin panel
1. Clear browser cache and cookies
2. Log out completely
3. Log back in
4. Check browser console for errors

### Can't access admin features
1. Verify the user's `is_admin` flag in the database:
   ```sql
   SELECT email, is_admin FROM users WHERE email = 'antiperotieno@zohomail.com';
   ```
2. If `is_admin` is false, set it to true using the setup endpoint

### User doesn't exist in database
- The user must log in at least once to create their database record
- Firebase users are automatically synced to the database on first login
