# NurseBrace - Nursing Exam Practice Platform

## Overview

NurseBrace is an educational SaaS platform designed to help nursing students prepare for major nursing exams (NCLEX, ATI TEAS, and HESI A2). The platform provides practice questions with instant feedback, detailed explanations, and progress tracking. It features a quiz-taking interface, subscription-based access, and AI-generated question content using DeepSeek's API.

The application follows a modern full-stack architecture with a React frontend, Express backend, and PostgreSQL database, all built with TypeScript for type safety.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 2025)

### Deployment Migration Preparation
- Added `APP_URL` environment variable support for payment callbacks (replaces Replit-specific `REPLIT_DOMAINS`)
- Created comprehensive DEPLOYMENT.md with deployment instructions for external platforms
- Added runtime warnings for missing APP_URL in production environments
- Suppressed harmless PostCSS warning from Tailwind CSS (cosmetic issue, doesn't affect functionality)

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, configured for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing (no React Router dependency)

**UI Component System**
- **shadcn/ui** components based on Radix UI primitives for accessible, unstyled base components
- **Tailwind CSS** for utility-first styling with custom design tokens
- Custom design system inspired by educational platforms (Duolingo, Khan Academy) with healthcare aesthetics
- Theme system supporting light/dark modes via `ThemeProvider` context

**State Management**
- **TanStack Query (React Query)** for server state management, caching, and data synchronization
- Local React state (`useState`) for UI-specific state
- No global state management library (Redux, Zustand) - keeps architecture simple

**Key Design Decisions**
- Component co-location: UI components live in `client/src/components` with nested `ui/` folder for reusable primitives
- Path aliases configured (`@/`, `@shared/`, `@assets/`) for clean imports
- Form handling with `react-hook-form` and `@hookform/resolvers` for validation
- Professional admin dashboard with sidebar navigation (shadcn sidebar components)
- **Merriweather** serif font for all headings and titles (professional, academic aesthetic)

### Backend Architecture

**Server Framework**
- **Express.js** as the HTTP server framework
- RESTful API design with routes defined in `server/routes.ts`
- Middleware for JSON parsing, logging, and error handling

**API Structure**
- `/api/quiz/start` - Initiates a new quiz session with random questions
- `/api/quiz/:attemptId/answer` - Submits answers during quiz attempts
- `/api/quiz/:attemptId/results` - Retrieves completed quiz results
- `/api/questions/generate` - Triggers AI question generation (admin/seed functionality)
- `/api/admin/analytics` - Returns dashboard analytics (revenue, users, quiz stats, trends)
- `/api/admin/users` - Lists all users with subscription/access status
- `/api/admin/users/:userId/grant-access` - Grants manual access to users (can override subscriptions)
- `/api/admin/users/:userId/revoke-access` - Revokes manual access
- `/api/admin/users/:userId/end-subscription` - Cancels active subscriptions
- `/api/admin/email/send` - Sends email to individual users
- `/api/admin/email/broadcast` - Sends broadcast email to all users

**Database Layer**
- **Drizzle ORM** for type-safe database operations without heavy abstractions
- **Neon Serverless PostgreSQL** as the database provider (WebSocket-based connection pooling)
- Schema-first approach with migrations in `/migrations` directory
- Storage abstraction layer (`server/storage.ts`) separating business logic from ORM implementation

**Data Models**
- `users` - User accounts (currently simplified, ready for auth integration)
- `subscriptions` - Plan management (weekly, monthly, 3-month)
- `questions` - Practice question bank with JSONB options array
- `quizAttempts` - Quiz sessions tracking progress and scores
- `quizAnswers` - Individual answer records linked to attempts

**Key Design Decisions**
- Chose Drizzle over Prisma for lighter weight and better PostgreSQL-specific features
- Used Neon's serverless driver with WebSocket support for connection efficiency
- Implemented storage interface pattern for potential future database swapping
- Quiz sessions use transactional-like patterns (creating attempt + answer records together)
- Admin dashboard aggregates analytics in real-time from multiple tables

**Admin Panel**
- **Route**: `/admin` - Protected admin-only section with authentication middleware
- **Dashboard** (`/admin`): Analytics overview with revenue metrics, user stats, quiz performance, and trend charts
- **Users** (`/admin/users`): User management table with grant/revoke access, end subscriptions, send emails
- **Marketing** (`/admin/marketing`): Broadcast email functionality to all users
- **Features**: 
  - Analytics cards showing total revenue, active users, quiz attempts, conversion rate
  - Chart visualizations using recharts for revenue and user growth trends  
  - Manual access control that overrides subscription requirements
  - Individual and broadcast email functionality (stubs - requires email service integration)

### External Dependencies

**AI Content Generation**
- **DeepSeek API** via OpenAI-compatible client for generating practice questions
- Structured prompts ensure questions follow NCLEX/TEAS/HESI format standards
- Generates questions with 4 options, correct answers, and detailed explanations
- Configurable by category, subject, and difficulty level

**Database Services**
- **Neon Serverless PostgreSQL** - Primary database with WebSocket connection pooling
- Environment variable `DATABASE_URL` required for connection
- Uses `@neondatabase/serverless` package with custom WebSocket constructor (ws library)

**UI Component Libraries**
- **Radix UI** - Comprehensive set of unstyled, accessible component primitives
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, and 20+ more
  - Chosen for accessibility compliance and flexibility in styling
- **cmdk** - Command palette component (likely for future search/navigation features)
- **Lucide React** - Icon library for consistent iconography

**Utilities**
- **date-fns** - Date manipulation and formatting
- **zod** - Runtime schema validation (paired with Drizzle via `drizzle-zod`)
- **class-variance-authority** - Styling variants for components
- **tailwind-merge** - Intelligent Tailwind class merging

**Development Tools**
- **tsx** - TypeScript execution for development server
- **esbuild** - Fast bundling for production server code
- **drizzle-kit** - Database migration and schema management tool

**Authentication**
- **Frontend**: Firebase Auth (email/password and Google Sign-In)
  - Custom branded UI with Firebase SDK
  - `firebase` package for client-side authentication
  - ID tokens sent with all API requests via Authorization header
  - Configuration uses environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID)
- **Backend**: Firebase Authentication
  - **firebase-admin** for verifying Firebase ID tokens
  - Token-based authentication (no session management required)
  - Server-side token verification ensures secure API access
  - `isAuthenticated` middleware protects all authenticated routes
  - Uses same VITE_FIREBASE_PROJECT_ID as frontend for consistency
- **Admin Auto-Redirect**: Admins are automatically redirected to /admin panel on login and when accessing root path

**Payment Processing**
- **PesaPal** payment gateway integration for subscription payments
  - Card payments only (no automatic recurring)
  - Manual subscription renewal flow
  - Payment verification via callback URL
  - Secure payment linkage with email validation
- Payment flow: Checkout → PesaPal payment → Account creation → Subscription activation

**Environment Requirements**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `DEEPSEEK_API_KEY` - API key for question generation (required for content creation)
- `VITE_FIREBASE_API_KEY` - Firebase client API key (required for auth)
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (required for auth)
- `VITE_FIREBASE_APP_ID` - Firebase app ID (required for auth)
- `PESAPAL_CONSUMER_KEY` - PesaPal consumer key (required for payments)
- `PESAPAL_CONSUMER_SECRET` - PesaPal consumer secret (required for payments)
- `SESSION_SECRET` - Session encryption key (required)
- `NODE_ENV` - Environment flag (development/production)