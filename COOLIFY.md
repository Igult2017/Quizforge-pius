# Deploying NurseBrace to Coolify

This guide explains how to deploy the NurseBrace application to Coolify.

## Important: Firebase Environment Variables

**Critical**: Vite requires Firebase environment variables at **BUILD TIME**, not runtime. You must configure these correctly in Coolify or the app will show "Firebase not configured" errors.

## Step 1: Create a New Service in Coolify

1. Log into your Coolify dashboard
2. Create a new **Docker Compose** or **Dockerfile** service
3. Connect your GitHub repository
4. Set the build path to use the `Dockerfile` in the root directory

## Step 2: Configure Environment Variables

Coolify has TWO types of environment variables:
- **Build Environment Variables** - Available during Docker build (for Vite)
- **Runtime Environment Variables** - Available when container runs (for Express server)

**You have two options for providing Firebase environment variables during build:**

### Option A: Build Environment Variables (Recommended)

In Coolify service settings, go to **Environment Variables** → **Build**:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**How to set Build Variables in Coolify:**
1. Go to your service → **Environment Variables**
2. Click **"Add Environment Variable"**
3. For each VITE_* variable, check the **"Available during build"** option
4. Save each variable
5. **Important**: After changing build variables, trigger a **full rebuild** (not just restart)

### Option B: .env File in Repository (Alternative)

If Coolify doesn't properly pass build variables or you prefer managing environment variables in your repository:

1. Create a `.env` file in your project root (this file is gitignored by default)
2. Add your Firebase variables to `.env`:
   ```bash
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. **Security Warning**: If using this approach, either:
   - Add `.env` to `.gitignore` and manually copy it to your deployment server
   - OR use a private repository only (never commit `.env` to public repos)

4. Vite will automatically load these values during `npm run build`

**When to use Option B:**
- Coolify's build environment variables aren't working
- You need to test the build locally first
- You prefer managing all config in one place

**Recommended**: Use Option A (build environment variables) for better security and separation of config from code.

### Runtime Environment Variables

In Coolify service settings, go to **Environment Variables** → **Runtime**:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/nursebrace

# Backend API Keys
DEEPSEEK_API_KEY=your-deepseek-api-key
PESAPAL_CONSUMER_KEY=your-pesapal-key
PESAPAL_CONSUMER_SECRET=your-pesapal-secret

# Firebase Admin (Optional - for custom service account)
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
# FIREBASE_PROJECT_ID=your-firebase-project-id
# Note: Firebase Admin can also use Application Default Credentials automatically

# Session
SESSION_SECRET=generate-a-random-32-character-string

# App URL (for payment callbacks)
APP_URL=https://yourdomain.com

# Environment
NODE_ENV=production
```

## Step 3: Configure Build Settings

In Coolify service settings:

- **Port**: `5000`
- **Health Check Path**: `/` (optional)
- **Build Command**: Automatically runs `docker build`
- **Start Command**: Automatically uses `CMD` from Dockerfile

## Step 4: Database Setup

### Option A: Use Coolify's Built-in PostgreSQL

1. In Coolify, create a new **PostgreSQL** database service
2. Note the connection details
3. Add `DATABASE_URL` to runtime environment variables

### Option B: Use External PostgreSQL (Neon, Supabase, etc.)

1. Create a database on your provider
2. Copy the connection string
3. Add `DATABASE_URL` to runtime environment variables

### Run Migrations

After first deployment, run migrations via Coolify's terminal:

```bash
npm run db:push
```

## Step 5: Deploy

1. Click **Deploy** in Coolify
2. Watch the build logs to ensure:
   - VITE_* variables are available during build
   - `npm run build` completes successfully
   - Container starts on port 5000

## Troubleshooting

### Verify Firebase Configuration Locally

Before deploying, test that your Firebase configuration works:

```bash
# Create a .env file with your Firebase keys
cp .env.example .env
# Edit .env and add your Firebase credentials

# Test the build
npm run build

# Check if your Firebase project ID is baked into the bundle
# Replace "your-project-id" with your actual Firebase project ID
grep -r "your-project-id" dist/client/assets/*.js

# If you see output containing your project ID, Firebase is configured correctly
# If grep returns nothing, the environment variables weren't available during build
```

**Alternative verification**: Open `dist/client/assets/index-*.js` in a text editor and search for your Firebase project ID. If you find it, Firebase is configured correctly.

**What to expect**:
- ✅ **Correct**: You should find your Firebase project ID and other config values in the bundle
- ❌ **Wrong**: If you see `undefined` or don't find any Firebase values, environment variables weren't set during build

### "Firebase not configured" error in production

**Cause**: VITE_* environment variables weren't available during the Docker build.

**Solution**:
1. Verify variables are set in **Build** section, not just Runtime
2. Check the **"Available during build"** checkbox for each VITE_* variable
3. Trigger a **full rebuild** (not just restart) - rebuilds are required for build variables
4. Check Coolify build logs to confirm variables are passed to Docker

### Build fails with environment variable errors

**Check**:
- Ensure all VITE_* variables are set in Build environment
- Variables must be set BEFORE triggering build
- Use Coolify's build logs to verify variables are passed to Docker

### Database connection errors

**Check**:
- `DATABASE_URL` format: `postgresql://user:password@host:5432/database`
- Database is accessible from Coolify network
- Run `npm run db:push` to create tables

### Port 5000 not accessible

**Check**:
- Dockerfile `EXPOSE 5000` is present (it is)
- Coolify port mapping is set to `5000:5000`
- Application is binding to `0.0.0.0:5000` (it does)

## Environment Variable Reference

### Firebase Setup

#### Client-Side Firebase Config (Required)

Get Firebase web app credentials from [Firebase Console](https://console.firebase.google.com/):

1. Go to Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy the config object values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

**These must be set as BUILD environment variables (see Option A above)**

#### Server-Side Firebase Admin (Optional but Recommended)

For production deployments, you should configure Firebase Admin SDK credentials:

**Option 1: Service Account Key (Recommended for most deployments)**

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Set as runtime environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
   ```

**Option 2: Application Default Credentials**

If deploying on Google Cloud Platform, Cloud Run, or similar:
- The platform will automatically provide credentials
- No manual configuration needed

**What if I don't set Firebase Admin credentials?**

The app will still work for authentication (logging in/signing up) but you'll see warnings in logs. ID token verification works with just the project ID, but any admin operations (like creating users via admin API) will fail.

**For production, we strongly recommend setting Firebase Admin credentials via Option 1 or deploying on a platform that supports Option 2.**

### PesaPal Setup

Get PesaPal credentials from [PesaPal Dashboard](https://www.pesapal.com/):

1. Log into PesaPal merchant account
2. Go to API Keys section
3. Copy Consumer Key → `PESAPAL_CONSUMER_KEY`
4. Copy Consumer Secret → `PESAPAL_CONSUMER_SECRET`

### DeepSeek API

Get DeepSeek API key from [DeepSeek Platform](https://platform.deepseek.com/):

1. Create account on DeepSeek
2. Go to API Keys
3. Generate new key → `DEEPSEEK_API_KEY`

## Post-Deployment Checklist

- [ ] Application loads at your domain
- [ ] Sign up page works (tests Firebase)
- [ ] Login page works
- [ ] Database is connected (check admin panel)
- [ ] Payment integration works (test checkout)
- [ ] Quiz functionality works
- [ ] Admin panel accessible to admin users

## Security Notes

- Firebase API keys are public (client-side) - they're safe in the frontend bundle
- Keep `SESSION_SECRET`, `PESAPAL_CONSUMER_SECRET`, and `DEEPSEEK_API_KEY` private
- Use strong passwords for database connections
- Enable Firebase security rules to protect data

## Need Help?

- Check Coolify logs: Service → Logs
- Check application logs: Service → Terminal
- Verify environment variables: Service → Environment Variables
- Test Firebase config: Try signing up a new user

## Coolify-Specific Tips

### Automatic Deployments

Enable automatic deployments from GitHub:
1. Service Settings → Source
2. Enable "Automatic Deployment"
3. Set branch to `main` or your production branch

### Custom Domains

1. Service Settings → Domains
2. Add your custom domain
3. Coolify handles SSL via Let's Encrypt automatically

### Scaling

- Coolify can auto-scale based on resource usage
- Configure in Service Settings → Resources
- Monitor resource usage in Service → Metrics
