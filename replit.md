# NurseBrace - Nursing Exam Practice Platform

## Overview
NurseBrace is an educational SaaS platform designed to help nursing students prepare for major nursing exams (NCLEX, ATI TEAS, HESI A2). It offers practice questions with instant feedback, detailed explanations, and progress tracking, accessible via a subscription model. The platform features a quiz-taking interface and leverages AI for generating question content. It is built with a React frontend, Express backend, and PostgreSQL database, all type-safe with TypeScript.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend uses **React 18** with **TypeScript** and **Vite**. **Wouter** handles routing. UI components are built with **shadcn/ui** (based on Radix UI) and styled using **Tailwind CSS**, following a custom design system with healthcare aesthetics and light/dark modes. **TanStack Query** manages server state, while local React state handles UI-specific state. Forms use `react-hook-form` with `zod` for validation. The design incorporates a professional admin dashboard and uses **Merriweather** font for headings.

### Backend Architecture
The backend is an **Express.js** application with a RESTful API. It uses **Drizzle ORM** with **Neon Serverless PostgreSQL** for type-safe database operations. Data models include `users`, `subscriptions`, `questions`, `quizAttempts`, and `quizAnswers`. Key decisions include using Drizzle for its lightweight nature and Neon's serverless driver for efficiency. The admin panel at `/admin` is a protected section providing analytics, user management (grant/revoke access, end subscriptions), and broadcast email functionality.

### Admin Authentication
Admin authentication is Firebase-based. The first user to sign up via Firebase Auth is automatically designated as the admin, with their UID stored in database. Firebase ID token verification with custom claims check is used for secure access.

**Recent Updates (Nov 20, 2025)**:
1. **NEW: Paystack Payment Integration** - Replaced PesaPal with Paystack for card payments. Supports USA, European countries, Australia, Canada, and New Zealand. Automatically rejects African countries. Single endpoint for payment initialization with country validation.
2. **NEW: Google Sign-In Account Merging** - Fixed duplicate email issue when users sign up with email/password then sign in with Google using same email. System now automatically merges accounts by updating Firebase ID.
3. **Fixed Free Trial Lockout** - Separated loading state from locked state. Users now correctly see free trial availability without false "locked" states during authentication.
4. **Strict Email Verification** - Users who sign up via email/password **must verify their email before they can log in**. Existing users grandfathered in. Google Sign-In users automatically verified.
5. **Base64 Service Account Support** - Firebase Admin supports base64-encoded credentials via `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` for Coolify.

**Updates (Dec 16, 2025)**:
1. **Subject-Aware Question Generation** - Gemini prompts are now subject-aware and adapt terminology based on subject (Math, Science, Reading, English). No longer hardcoded to nursing/health topics, making TEAS Math, Science, Reading questions accurate.
2. **Required Sample Questions and Topics** - Both sampleQuestion and areasTocover are now required fields (not optional) for question generation, ensuring quality AI output.
3. **KaTeX Math Rendering** - Added MathRenderer and MathTextarea components for LaTeX/KaTeX math notation support. Use $ for inline math ($x^2$) and $$ for block math.
4. **Image Paste/Upload Support** - Sample questions now support pasting screenshots (Ctrl+V) and uploading images via Add Image button for visual reference.
5. **Topic-Level Question Storage** - Questions are now stored with both `subject` (e.g., "Management of Care") AND `topic` (e.g., "Advance Directives"). This enables granular topic selection when students take quizzes.
6. **Equal Topic Distribution** - When generating questions with multiple units/topics (comma-separated), the system automatically splits into separate jobs with equal question counts. Example: 1000 questions with 4 topics = 4 jobs of 250 questions each. Each job focuses on a single topic ensuring guaranteed distribution.
7. **Enhanced Math Explanations** - Math question explanations now MUST include: (1) The exact formula being applied, (2) Step-by-step calculation with actual numbers, (3) Concept explanation of why/when to use the method, (4) Specific error explanation for each wrong answer option.
8. **Fixed Quiz Progress Display** - Progress now shows "Question X of Y" (current position) AND "Z/Y answered" (actual answered count). Previously showed viewing position which was confusing when on the last question.

**Updates (Dec 12, 2025)**:
1. **Manual Question Generation Mode** - Automatic/background question generation has been disabled. Use the admin panel to create generation jobs and manually trigger processing via the "Process Jobs" button.
2. **No Authorization for Generation Routes** - Generation-related API endpoints no longer require authentication. Anyone who can access the admin panel can generate questions.
3. **Topic Breakdown Display** - Admin panel now shows collapsible question counts grouped by topic within each category.
4. **Migration File Updated** - `drizzle/0001_migration.sql` now includes the `generation_jobs` and `user_topic_performance` table creation.
5. **NEW: Personalized Learning System** - Students can now choose specific subjects to focus on before starting a quiz. The system tracks performance by topic and provides recommendations on areas to improve.
6. **NEW: Adaptive Question Selection** - When enabled, the quiz automatically includes questions from weak areas to reinforce learning. Uses up to 30% of quiz for topics where accuracy is below 70%.
7. **NEW: Performance Dashboard** - Color-coded dashboard (`/performance`) showing strong areas (green, 80%+), improving areas (yellow, 60-79%), and areas needing work (red, below 60%) with personalized recommendations.
8. **NEW: Topic Selection Page** - New intermediate page (`/topic-selection`) between categories and quiz, allowing users to select specific subjects and toggle adaptive learning mode.
9. **ENHANCED: Granular Topic Selection** - Users can now expand each subject to select individual topics (e.g., "Advocacy" under "Management of Care") using collapsible nested checkboxes. URL params support both `subjects` (fully selected) and `topics` (format: `subject:topic`) for filtering.
10. **NEW: Admin User Deletion** - Admins can delete users (including other admins, but not themselves) from the admin panel. Cascade deletes all related data (quiz history, subscriptions, payments). Confirmation dialog required.
11. **NEW: Auto-Logout on Inactivity** - Users are automatically logged out after 10 minutes of inactivity for security. Tracks mouse, keyboard, touch, scroll, and click events. Toast notification shown when session expires.

**Previous Updates (Nov 20, 2025)**:
1. Paystack Payment Integration, Google Sign-In Account Merging, Strict Email Verification, Base64 Service Account Support.

**Previous Updates (Nov 19, 2025)**: 
1. **Flexible Gemini Model Support** - System automatically detects which Gemini model works with your API key. Set `GEMINI_MODEL` to specify a particular model, or let it auto-detect.
2. Fixed critical Firebase Admin integration for proper authentication flow.

### UI/UX Decisions
- Modern typography with Poppins font for the pricing section and Merriweather for headings.
- Custom design system inspired by educational platforms like Duolingo and Khan Academy.
- Light/dark theme support.
- Professional admin dashboard with sidebar navigation.

### Feature Specifications
- Quiz initiation, answer submission, and result retrieval.
- AI-driven question generation (admin/seed functionality).
- Admin analytics dashboard for revenue, users, and quiz statistics.
- User management, including subscription control and email capabilities.
- Role-based access control for admin routes.
- Secure payment processing with PesaPal.

## External Dependencies

### AI Content Generation
- **Google Gemini API (gemini-1.5-flash)**: Used for generating practice questions, explanations, and options, adhering to NCLEX/TEAS/HESI standards.
- **Comprehensive Generation System**: Generates 12,500+ questions across all subject areas with proper topic coverage.
- **Cost**: ~$1-2 USD for complete question database (12,500 questions).
- **Modular Approach**: Failures in one subject don't affect others; batch processing with error handling.

### Database Services
- **Neon Serverless PostgreSQL**: Primary database, utilizing WebSocket connection pooling.

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives (Accordion, Alert Dialog, Dialog, etc.).
- **cmdk**: Command palette component.
- **Lucide React**: Icon library.

### Authentication
- **Firebase Authentication**: Used for both frontend (client-side SDK for email/password, Google Sign-In) and backend (firebase-admin for ID token verification).
- **Email Verification (Strict Mode)**: Users who sign up via email/password **cannot log in until they verify their email address**. Verification emails are sent automatically upon signup. Users who attempt to log in without verifying are blocked and shown a "Resend Verification Email" button on the login page. **Existing users in the database are grandfathered in** and can log in regardless of verification status. Only new signups (not yet in database) must verify. Google Sign-In users are automatically verified and bypass this requirement.
- Environment variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.

### Payment Processing
- **Paystack**: Integrated for subscription card payments (USA, Europe, Australia, Canada, NZ only). Supports payment initialization with country validation, automatic webhook verification, and secure email-validated linkages. Rejects African countries per requirements.

### Utilities & Development Tools
- **date-fns**: Date manipulation.
- **zod**: Runtime schema validation.
- **class-variance-authority**: Styling variants.
- **tailwind-merge**: Tailwind class merging.
- **tsx**: TypeScript execution for development.
- **esbuild**: Fast bundling.
- **drizzle-kit**: Database migration and schema management.

### Environment Requirements
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API for question generation (**required**)
- `GEMINI_MODEL` - Optional: specify which Gemini model to use (auto-detects if not set)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` - Firebase configuration
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK credentials (JSON) **OR**
- `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` - Base64-encoded Firebase Admin SDK credentials (recommended for Coolify)
- `PAYSTACK_SECRET_KEY` - Paystack API secret key for payment processing (**required**)
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Set to 'production' in deployment
- `APP_URL` - Your application's public URL (for payment callbacks)