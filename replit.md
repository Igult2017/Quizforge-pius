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

**Recent Updates (Nov 19, 2025)**: 
1. **NEW: Automatic Background Question Generation** - System now automatically generates all 12,500 questions in the background without user interaction. Runs every 5 minutes, rotating through all subjects until complete. Fully monitored via Admin Panel → Generation.
2. **NEW: Flexible Gemini Model Support** - System automatically detects which Gemini model works with your API key. Set `GEMINI_MODEL` to specify a particular model, or let it auto-detect.
3. Fixed critical Firebase Admin integration for proper authentication flow.

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
- Environment variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.

### Payment Processing
- **PesaPal**: Integrated for subscription payments, supporting card payments with manual renewal, payment verification via callback, and secure email-validated linkages.

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
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK credentials (JSON)
- `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET` - For payment processing
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Set to 'production' in deployment