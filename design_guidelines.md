# Design Guidelines: Nursing Exam Practice Platform

## Design Approach: Design System-Based (Educational SaaS)

**Selected Reference**: Combination of Duolingo's gamified learning UI + Khan Academy's educational clarity + healthcare professional aesthetics

**Justification**: Utility-focused educational platform requiring clarity, trust, and consistent patterns for quiz-taking and progress tracking.

---

## Core Design Elements

### A. Color Palette

**Primary Colors (Medical Professional)**
- Primary Blue: 210 85% 45% (trust, medical professionalism)
- Primary Dark: 210 90% 35% (headers, emphasis)
- Success Green: 145 70% 45% (correct answers, achievements)
- Error Red: 0 75% 55% (incorrect answers, alerts)

**Neutral Foundation**
- Background Light: 210 20% 98%
- Background Dark: 215 25% 12%
- Card Light: 0 0% 100%
- Card Dark: 215 20% 16%
- Text Primary Light: 215 25% 15%
- Text Primary Dark: 210 20% 95%
- Border Light: 215 15% 85%
- Border Dark: 215 15% 25%

**Accent Colors**
- NCLEX Purple: 270 60% 55%
- TEAS Orange: 25 85% 60%
- HESI Teal: 180 65% 50%

### B. Typography

**Font Families**
- Primary: 'Inter' (UI, body text, questions)
- Headings: 'Inter' with semibold/bold weights
- Monospace: 'JetBrains Mono' (for question numbers, stats)

**Scale**
- Headings: text-3xl (dashboard), text-2xl (sections), text-xl (cards)
- Body: text-base (questions), text-sm (metadata)
- Small: text-xs (hints, timestamps)

**Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Card gaps: gap-4 to gap-6
- Container max-width: max-w-7xl (dashboard), max-w-3xl (quiz view)

**Grid System**
- Dashboard: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 (category cards)
- Quiz: Single column max-w-3xl (optimal reading width)
- Results: Two-column split for stats and review

### D. Component Library

**Navigation**
- Top navbar: Fixed header with logo, user profile, subscription badge
- Sidebar (desktop): Category navigation with icons and progress indicators
- Mobile: Bottom navigation or hamburger menu

**Category Cards**
- Large clickable cards with exam type icon
- Color-coded borders (purple/NCLEX, orange/TEAS, teal/HESI)
- Progress ring showing completion percentage
- "Start Practice" CTA button

**Quiz Interface**
- Question card: Clean white/dark card with generous padding
- Question number indicator: Top-left with total count
- Multiple choice options: Large touch targets (min h-12) with radio buttons
- Navigation: "Previous" | Progress dots | "Next/Submit" buttons
- Timer (optional): Top-right corner

**Results Display**
- Score card: Large percentage with visual gauge/circle
- Summary stats: Correct/Incorrect/Skipped counts in grid
- Question review: Expandable accordion showing each question with user answer vs correct answer
- Color coding: Green backgrounds for correct, red for incorrect

**Progress Tracking**
- Linear progress bars for category completion
- Circular progress rings for overall progress
- Streak counters with fire icon
- Achievement badges (locked/unlocked states)

**Subscription Components**
- Plan cards with feature comparison table
- "Current Plan" badge highlighting active tier
- Upgrade prompts (subtle, non-intrusive)

**Forms & Inputs**
- Clean, rounded inputs with focus states
- Primary action buttons: Large, high-contrast
- Secondary buttons: Outline style
- Consistent dark mode support for all inputs

### E. Visual Patterns

**Cards & Elevation**
- Subtle shadows: shadow-sm to shadow-md
- Rounded corners: rounded-lg to rounded-xl
- Hover states: Slight scale (scale-[1.02]) and shadow increase

**Interactive States**
- Buttons: Clear hover/active states with color shifts
- Selected answers: Border highlight + background tint
- Disabled states: Reduced opacity (opacity-50)

**Feedback & Validation**
- Success: Green border-l-4 with light green background
- Error: Red border-l-4 with light red background
- Info: Blue border-l-4 with light blue background

**Icons**
- Library: Heroicons (outline for navigation, solid for actions)
- Sizes: w-5 h-5 (inline), w-6 h-6 (buttons), w-12 h-12 (category cards)

---

## Images

**Hero Section (Dashboard/Landing)**
- Full-width hero with blurred medical/studying background image
- Overlay gradient: from-blue-900/80 to-blue-800/60
- Centered CTA with "Start Your Practice Journey" messaging

**Category Illustrations**
- NCLEX: Stethoscope/medical tools illustration
- TEAS: Study materials/books illustration
- HESI: Brain/knowledge icon illustration
- Use as subtle backgrounds in category cards

**Empty States**
- Friendly illustration when no practice attempts yet
- Encouraging messaging with "Take Your First Quiz" CTA

**Profile/Achievement Section**
- Placeholder avatar (user initials in colored circle)
- Achievement badge icons (trophy, star, ribbon)

---

## Key Interactions

- Smooth transitions (transition-all duration-200)
- Page transitions: Fade in/out
- Loading states: Skeleton screens for questions
- Quiz submission: Confirmation modal before submit
- Answer selection: Immediate visual feedback (no delays)

**Design Philosophy**: Medical professionalism meets modern educational UX. Clean, distraction-free quiz experience with motivating progress visualization.