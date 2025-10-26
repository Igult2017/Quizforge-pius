# NurseBrace - Nursing Exam Practice Platform

## Overview

NurseBrace is an educational SaaS platform designed to help nursing students prepare for major nursing exams (NCLEX, ATI TEAS, and HESI A2). The platform provides practice questions with instant feedback, detailed explanations, and progress tracking. It features a quiz-taking interface, subscription-based access, and AI-generated question content using DeepSeek's API.

The application follows a modern full-stack architecture with a React frontend, Express backend, and PostgreSQL database, all built with TypeScript for type safety.

## User Preferences

Preferred communication style: Simple, everyday language.

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

**Session Management**
- **express-session** with **connect-pg-simple** for PostgreSQL-backed sessions
- Configured for future authentication implementation

**Environment Requirements**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `DEEPSEEK_API_KEY` - API key for question generation (required for content creation)
- `NODE_ENV` - Environment flag (development/production)