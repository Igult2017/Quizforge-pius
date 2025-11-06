# NurseBrace - Deployment Guide

This guide helps you deploy NurseBrace to any hosting platform (Dockploy, Heroku, Railway, VPS, etc.).

## Build & Start Commands

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

The build process:
1. Builds the React frontend to `dist/public/` (including HTML, CSS, JS, and assets)
2. Bundles the Express server to `dist/index.js`

## Port Configuration

The application listens on the port specified by the `PORT` environment variable, defaulting to `5000` if not set.

**Important**: Make sure your hosting platform exposes port 5000 or sets the PORT environment variable.

## Required Environment Variables

### Database (Required)
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - SSL is automatically enabled in production mode
  - Example: `postgresql://user:pass@db.example.com:5432/nursebrace`

### Firebase Authentication (Required)
- `VITE_FIREBASE_API_KEY` - Firebase client API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

**Note**: These must be prefixed with `VITE_` to be accessible in the frontend build.

### Session Management (Required)
- `SESSION_SECRET` - Secret key for session encryption
  - Generate a strong random string (minimum 32 characters)
  - Example: Use `openssl rand -base64 32` to generate

### Application URL (Required for Production)
- `APP_URL` - The full URL where your app is hosted
  - Used for payment callbacks and other absolute URLs
  - Example: `https://nursebrace.com` or `https://your-app.dokploy.com`
  - **Important**: Do NOT include a trailing slash
  - **Required**: Must be set for payment callbacks to work correctly in production
  - **Note**: In Replit, this falls back to `REPLIT_DOMAINS` automatically, but for all other platforms `APP_URL` is required

### PesaPal Payment Integration (Required for payments)
- `PESAPAL_CONSUMER_KEY` - PesaPal consumer key
- `PESAPAL_CONSUMER_SECRET` - PesaPal consumer secret

### DeepSeek AI (Optional - for question generation)
- `DEEPSEEK_API_KEY` - API key for AI question generation
  - Only required if you want to generate new practice questions
  - Not needed for the app to function with existing questions

## Environment Configuration

Set `NODE_ENV=production` in your hosting platform. This enables:
- Production optimizations
- SSL for database connections
- Static file serving from `dist/public/`

## Database Setup

### 1. Create PostgreSQL Database
Create a PostgreSQL database on your preferred provider (Neon, Supabase, Railway, etc.).

### 2. Run Migrations
Push the database schema using Drizzle:

```bash
npm run db:push
```

### 3. Seed Questions (Optional)
If you need to populate the database with practice questions, you can run the seed scripts after deployment.

## Deployment Platform Specific Instructions

### Dockploy

1. **Create Application** in Dockploy dashboard
2. **Connect Git Repository** (or use Docker)
3. **Build Type**: Select "Nixpacks" (auto-detects Node.js)
4. **Environment Variables**: Add all required variables listed above
5. **Deploy**: Click deploy and watch the build logs
6. **Configure Domain**: 
   - Generate a free domain or add your custom domain
   - Set the port to 5000 (or use PORT env var)
   - Update `APP_URL` environment variable with your domain

### Heroku

1. Create a new app: `heroku create your-app-name`
2. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
3. Set environment variables: `heroku config:set KEY=VALUE`
4. Deploy: `git push heroku main`
5. Run migrations: `heroku run npm run db:push`

### Railway

1. Create new project from GitHub repo
2. Add PostgreSQL database
3. Set environment variables in Railway dashboard
4. Railway auto-detects and builds the app
5. Get the public URL and set it as `APP_URL`

### Docker (Custom VPS)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t nursebrace .
docker run -p 5000:5000 --env-file .env nursebrace
```

## Files Changed for External Deployment

The following files were modified to work outside Replit:

1. **server/routes.ts** (line 132)
   - Changed payment callback URL to use `APP_URL` environment variable first
   - Falls back to `REPLIT_DOMAINS` for Replit deployments
   - Falls back to localhost for local development
   - **Priority order**: `APP_URL` → `REPLIT_DOMAINS` → `http://localhost:5000`

2. **postcss.config.cjs**
   - Updated PostCSS plugin configuration format

## Replit-Specific Notes

If you're deploying on Replit:
- The Replit-specific vite plugins remain in package.json but only activate when `REPL_ID` environment variable is present
- `REPLIT_DOMAINS` is automatically set and used as a fallback for `APP_URL`
- You can still set `APP_URL` to override the Replit domain if needed

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] `SESSION_SECRET` is a strong random string
- [ ] Database URL uses SSL (automatically enabled in production)
- [ ] Firebase credentials are from your production project
- [ ] `APP_URL` matches your actual domain (no trailing slash)
- [ ] PesaPal credentials are production keys (not test/sandbox)

## Troubleshooting

### Build fails with module not found
- Run `npm install` to ensure all dependencies are installed
- Check that `NODE_ENV` is set correctly

### Database connection errors
- Verify `DATABASE_URL` format is correct
- Ensure SSL is enabled if required by your database provider
- Check database firewall settings allow connections

### Payment callbacks fail
- Verify `APP_URL` is set correctly with HTTPS
- Ensure the URL is publicly accessible
- Check PesaPal dashboard for webhook delivery status

### App starts but shows blank page
- Check that `dist/public/` directory exists after build
- Verify all `VITE_` prefixed environment variables are set
- Check browser console for Firebase configuration errors

## Post-Deployment

1. Test authentication (signup/login)
2. Test quiz functionality
3. Test payment flow (use test mode first)
4. Create an admin user in the database
5. Access admin panel at `/admin`
6. Monitor logs for errors

## Support

For issues specific to NurseBrace, check the application logs in your hosting platform's dashboard.
