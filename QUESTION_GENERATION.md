# Question Generation System

## Overview

NurseBrace uses Google Gemini AI (gemini-1.5-flash) to generate high-quality nursing exam practice questions for NCLEX, ATI TEAS, and HESI A2 exams.

## ✨ NEW: Automatic Background Generation

The system now includes **automatic background generation** that runs without any user interaction! Once deployed with the Gemini API key configured, the system will:

- ⚡ **Start automatically** after server startup
- 🔄 **Generate 100 questions every 5 minutes** in rotation across all subjects
- 📊 **Track progress** for each subject area
- ⏸️ **Pause automatically** when all 12,500 questions are generated
- 🔧 **Resume after restarts** - remembers where it left off
- 📈 **Fully monitored** through the Admin Panel → Generation page

**No manual intervention needed!** Just deploy with the API key and the questions will be generated automatically.

## Total Question Target

- **NCLEX**: 7,000 questions across 8 subject areas
- **ATI TEAS**: 2,500 questions across 4 subject areas  
- **HESI A2**: 3,000 questions across 7 subject areas
- **Total**: ~12,500 questions

## Cost Estimate

Using Gemini 1.5 Flash pricing (as of 2025):
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens
- **Estimated cost for 12,500 questions**: ~$1-2 USD
- **Budget for $30**: Can generate ~39,000 questions

## Generation Methods

### 1. **Automatic Background Generation** (Recommended - Default Behavior)

**This is now the primary method!** The system automatically generates questions in the background without any user interaction.

**How it works:**
- Runs every 5 minutes via cron scheduler
- Generates 100 questions per cycle
- Rotates through all 19 subject areas in order
- Continues until all 12,500 questions are generated
- Pauses automatically when complete
- Resumes where it left off after server restarts

**Features:**
- ✅ Zero user interaction required
- ✅ Persistent progress tracking in database
- ✅ Error handling with automatic retries
- ✅ Detailed logging for monitoring
- ✅ Pause/resume controls via Admin Panel → Generation
- ✅ Real-time progress monitoring
- ⏱️ Duration: Runs in background over ~10 hours (non-blocking)
- 💰 Cost: $1-2 USD total

**Monitoring:**
- Log in as admin
- Navigate to Admin Panel → Generation
- View real-time progress, pause/resume, or trigger manual runs

### 2. Manual Comprehensive Generation (Alternative - One-Time Run)

If you prefer to generate all questions in one session instead of background generation:

```bash
npm run generate:comprehensive
```

**Features:**
- Generates all questions in a single blocking run
- ⏱️ Duration: 30-60 minutes (blocking)
- 💰 Cost: $1-2 USD

### 3. Sample Generation (Quick Testing)

Generates a small sample for testing (35 questions per category).

```bash
npm run generate:sample
```

**Use cases:**
- Testing the generation system
- Quick database seeding for development
- ⏱️ Duration: ~2 minutes
- 💰 Cost: <$0.10 USD

### 4. Admin Panel Generation (Optional - Specific Subjects)

Use the Admin Panel → Questions section for:
- Adding more questions to specific subjects after automatic generation completes
- Custom difficulty distributions
- Testing new prompts

**How to use:**
1. Log in as admin
2. Navigate to Admin Panel → Questions
3. Select category, subject, difficulty, and count
4. Click "Generate Questions"

## Subject Area Coverage

### NCLEX (7,000 questions)

1. **Management of Care** (850 questions)
   - Advance Directives, Advocacy, Case Management, Client Rights, etc.

2. **Safety and Infection Control** (600 questions)
   - Accident Prevention, Standard Precautions, Equipment Safety, etc.

3. **Health Promotion and Maintenance** (850 questions)
   - Aging Process, Disease Prevention, Health Screening, etc.

4. **Psychosocial Integrity** (850 questions)
   - Abuse/Neglect, Crisis Intervention, Mental Health, Therapeutic Communication, etc.

5. **Basic Care and Comfort** (600 questions)
   - Assistive Devices, Elimination, Mobility, Nutrition, etc.

6. **Pharmacological and Parenteral Therapies** (1,100 questions)
   - Medication Administration, Dosage Calculation, IV Therapies, etc.

7. **Reduction of Risk Potential** (650 questions)
   - Diagnostic Tests, Laboratory Values, Vital Signs, etc.

8. **Physiological Adaptation** (1,500 questions)
   - Body System Alterations, Fluid/Electrolyte, Medical Emergencies, etc.

### ATI TEAS (2,500 questions)

1. **Reading** (600 questions)
   - Main Ideas, Inferences, Author's Purpose, Text Structure, etc.

2. **Mathematics** (700 questions)
   - Arithmetic, Fractions/Decimals, Ratios, Algebra, Statistics, etc.

3. **Science** (850 questions)
   - Anatomy & Physiology, Cell Biology, Genetics, Chemistry, etc.

4. **English and Language Usage** (350 questions)
   - Grammar, Punctuation, Spelling, Vocabulary, etc.

### HESI A2 (3,000 questions)

1. **Mathematics** (500 questions)
   - Basic Operations, Fractions, Dosage Calculations, Conversions, etc.

2. **Reading Comprehension** (400 questions)
   - Main Ideas, Inferences, Context Clues, etc.

3. **Vocabulary** (300 questions)
   - Medical Terminology, Word Roots, Prefixes/Suffixes, etc.

4. **Grammar** (300 questions)
   - Parts of Speech, Sentence Structure, Verb Tenses, etc.

5. **Biology** (450 questions)
   - Cell Biology, Genetics, Metabolism, etc.

6. **Chemistry** (350 questions)
   - Atomic Structure, Chemical Reactions, Acids/Bases, etc.

7. **Anatomy and Physiology** (700 questions)
   - All body systems with comprehensive coverage

## Question Quality Standards

Each generated question includes:
- **Question text**: Clear, clinically relevant scenario
- **4 options**: Only one correct answer
- **Correct answer**: Matches exactly one of the options
- **Explanation**: Detailed rationale for correct answer
- **Subject**: Specific subject area
- **Difficulty**: easy, medium, or hard
- **Category**: NCLEX, TEAS, or HESI

## Modular Architecture

The system is designed to be fault-tolerant:

1. **Subject-level isolation**: Failure in one subject doesn't affect others
2. **Batch processing**: Questions generated in small batches (20 at a time)
3. **Error logging**: Detailed error tracking without stopping execution
4. **Rate limiting**: 2-second delays between batches to respect API limits
5. **Database validation**: All questions validated before storage

## Environment Requirements

### Required: API Key
```bash
GEMINI_API_KEY=your_google_gemini_api_key
```

### Optional: Specify Model
By default, the system **automatically detects** which Gemini model works with your API key by trying models in this order:
1. `gemini-2.0-flash-exp` (preferred - latest experimental)
2. `gemini-1.5-flash-latest` (stable flash)
3. `gemini-1.5-flash` (standard flash)
4. `gemini-1.5-pro-latest` (latest pro)
5. `gemini-1.5-pro` (standard pro)
6. `gemini-pro` (original pro)

The system tests each model and uses the first one that works. Once found, it caches the working model for all subsequent requests.

**To manually specify a model** (skips auto-detection):
```bash
GEMINI_MODEL=gemini-1.5-flash-latest
# or
GEMINI_MODEL=gemini-1.5-pro
# or
GEMINI_MODEL=gemini-pro
```

**When to set GEMINI_MODEL:**
- ✅ If you know your API key only supports a specific model
- ✅ If you want to use a specific model for cost/performance reasons
- ✅ To skip the auto-detection process (saves a few seconds on first run)
- ❌ If unsure - auto-detection will find the right model automatically!

The API key and model should be configured in your Coolify environment variables.

## Admin Panel - Generation Monitoring

Access real-time generation monitoring at **Admin Panel → Generation**:

### Features:
- **Overall Progress**: Visual progress bar showing total questions generated
- **Subject-by-Subject Breakdown**: See progress for each of the 19 subject areas
- **Status Indicators**: Active, paused, completed, or error states
- **Controls**:
  - Pause/Resume automatic generation
  - Trigger manual generation cycle
  - View error messages and retry counts
- **Auto-refresh**: Status updates every 10 seconds

### Server Logs

The background generation service also provides detailed server logging:

```
=================================================
🎓 COMPREHENSIVE NURSING EXAM QUESTION GENERATION
=================================================

📋 Target: ~12,500 total questions
💰 Estimated cost: $1-2 USD
⏱️  Estimated time: 30-60 minutes

📖 NCLEX QUESTIONS (Target: 7,000)
  📚 Generating questions for Management of Care
     ✓ Batch 1/43: Generated 20, Saved 20
     ...
  📊 Subject Summary: Management of Care
     Generated: 850/850
     Saved: 850

✅ GENERATION COMPLETE
  ⏱️  Duration: 45 minutes
  📊 Total Saved: 12,341 questions
     NCLEX: 6,987 questions
     TEAS: 2,498 questions  
     HESI: 2,856 questions
```

## Database Schema

Questions are stored in the `questions` table:

```typescript
{
  id: number (auto-increment)
  category: string (NCLEX, TEAS, HESI)
  question: string
  options: string[] (JSON array)
  correctAnswer: string
  explanation: string
  difficulty: string (easy, medium, hard)
  subject: string
  createdAt: timestamp
}
```

## Troubleshooting

### API Rate Limits
If you encounter rate limit errors:
- Increase `DELAY_BETWEEN_BATCHES` in `comprehensiveGeneration.ts`
- Reduce `BATCH_SIZE` from 20 to 10

### Invalid Responses
The system automatically:
- Strips markdown code fences from responses
- Validates against schema before saving
- Logs failed validations without stopping

### Database Connection
Make sure `DATABASE_URL` is properly configured in your environment.

## Next Steps

After generating questions:
1. Verify question counts in Admin Panel → Questions
2. Test quiz functionality with generated questions
3. Monitor user feedback on question quality
4. Use admin panel to add more questions for specific subjects as needed
