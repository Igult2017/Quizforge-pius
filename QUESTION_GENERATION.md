# Question Generation System

## Overview

NurseBrace uses Google Gemini AI (gemini-1.5-flash) to generate high-quality nursing exam practice questions for NCLEX, ATI TEAS, and HESI A2 exams.

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

### 1. Comprehensive Generation (Recommended for Initial Setup)

Generates all questions across all subject areas with comprehensive topic coverage.

```bash
npm run generate:comprehensive
```

**Features:**
- ✅ Generates questions for all exam categories (NCLEX, TEAS, HESI)
- ✅ Covers all subject areas with proper topic distribution
- ✅ Includes multiple difficulty levels (easy, medium, hard)
- ✅ Batch processing with rate limiting (20 questions per batch)
- ✅ Modular approach - failures in one subject don't stop others
- ✅ Detailed progress logging
- ⏱️ Duration: 30-60 minutes
- 💰 Cost: $1-2 USD

### 2. Sample Generation (Quick Testing)

Generates a small sample for testing (35 questions per category).

```bash
npm run generate:sample
```

**Use cases:**
- Testing the generation system
- Quick database seeding for development
- ⏱️ Duration: ~2 minutes
- 💰 Cost: <$0.10 USD

### 3. Admin Panel Generation (Optional - Specific Subjects)

Use the Admin Panel → Questions section for:
- Generating questions for specific subjects when needed
- Adding more questions to underrepresented topics
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

Required environment variable:
```bash
GEMINI_API_KEY=your_google_gemini_api_key
```

The API key should already be configured in your Coolify environment.

## Monitoring Generation

The comprehensive generation script provides detailed logging:

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
