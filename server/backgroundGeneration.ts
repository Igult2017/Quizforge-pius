import * as cron from "node-cron";
import { db } from "./db";
import { generationSubjectProgress, generationLogs, systemSettings } from "@shared/schema";
import { eq, and, sql, asc, or } from "drizzle-orm";
import { generateQuestions } from "./gemini";
import { storage } from "./storage";

// Configuration
const BATCH_SIZE = 10; // Questions per batch (reduced further to avoid JSON parsing errors)
const CRON_SCHEDULE = "*/5 * * * *"; // Every 5 minutes
const GENERATION_TIMEOUT_MS = 300000; // 5 minutes timeout

let isRunning = false;
let cronJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Initialize the generation progress table with all subject areas
 */
export async function initializeGenerationProgress() {
  try {
    console.log("🔧 Initializing background generation progress...");
    
    // Check if progress table is already initialized
    const existing = await db
      .select()
      .from(generationSubjectProgress)
      .limit(1);
    
    if (existing.length > 0) {
      console.log("✓ Generation progress already initialized");
      return;
    }

    // Define all subjects with their targets
    const subjects = [
      // NCLEX (7,000 total)
      { category: "NCLEX", subject: "Management of Care", targetCount: 850, sortOrder: 1 },
      { category: "NCLEX", subject: "Safety and Infection Control", targetCount: 600, sortOrder: 2 },
      { category: "NCLEX", subject: "Health Promotion and Maintenance", targetCount: 850, sortOrder: 3 },
      { category: "NCLEX", subject: "Psychosocial Integrity", targetCount: 850, sortOrder: 4 },
      { category: "NCLEX", subject: "Basic Care and Comfort", targetCount: 600, sortOrder: 5 },
      { category: "NCLEX", subject: "Pharmacological and Parenteral Therapies", targetCount: 1100, sortOrder: 6 },
      { category: "NCLEX", subject: "Reduction of Risk Potential", targetCount: 650, sortOrder: 7 },
      { category: "NCLEX", subject: "Physiological Adaptation", targetCount: 1500, sortOrder: 8 },
      
      // TEAS (2,500 total)
      { category: "TEAS", subject: "Reading", targetCount: 600, sortOrder: 9 },
      { category: "TEAS", subject: "Mathematics", targetCount: 700, sortOrder: 10 },
      { category: "TEAS", subject: "Science", targetCount: 850, sortOrder: 11 },
      { category: "TEAS", subject: "English and Language Usage", targetCount: 350, sortOrder: 12 },
      
      // HESI (3,000 total)
      { category: "HESI", subject: "Mathematics", targetCount: 500, sortOrder: 13 },
      { category: "HESI", subject: "Reading Comprehension", targetCount: 400, sortOrder: 14 },
      { category: "HESI", subject: "Vocabulary", targetCount: 300, sortOrder: 15 },
      { category: "HESI", subject: "Grammar", targetCount: 300, sortOrder: 16 },
      { category: "HESI", subject: "Biology", targetCount: 450, sortOrder: 17 },
      { category: "HESI", subject: "Chemistry", targetCount: 350, sortOrder: 18 },
      { category: "HESI", subject: "Anatomy and Physiology", targetCount: 700, sortOrder: 19 },
    ];

    // Insert all subjects
    await db.insert(generationSubjectProgress).values(subjects);
    
    console.log(`✓ Initialized ${subjects.length} subject areas for background generation`);
    console.log(`📊 Total target: ${subjects.reduce((sum, s) => sum + s.targetCount, 0)} questions`);
  } catch (error) {
    console.error("Error initializing generation progress:", error);
    throw error;
  }
}

/**
 * Check if auto-generation is enabled
 */
async function isAutoGenerationEnabled(): Promise<boolean> {
  try {
    const setting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "autoGenerationEnabled"))
      .limit(1);
    
    if (setting.length === 0) {
      // Default to enabled if not set
      await db.insert(systemSettings).values({
        key: "autoGenerationEnabled",
        value: "true",
      });
      return true;
    }
    
    return setting[0].value === "true";
  } catch (error) {
    console.error("Error checking auto-generation setting:", error);
    return false;
  }
}

/**
 * Get the next subject that needs questions
 */
async function getNextSubject() {
  try {
    // First, reset any subjects stuck in "running" state (from crashes/restarts)
    await db
      .update(generationSubjectProgress)
      .set({ status: "pending" })
      .where(eq(generationSubjectProgress.status, "running"));
    
    // Find next subject that needs questions (not completed)
    const subjects = await db
      .select()
      .from(generationSubjectProgress)
      .where(
        and(
          sql`${generationSubjectProgress.generatedCount} < ${generationSubjectProgress.targetCount}`,
          or(
            eq(generationSubjectProgress.status, "pending"),
            eq(generationSubjectProgress.status, "error")
          )
        )
      )
      .orderBy(asc(generationSubjectProgress.sortOrder))
      .limit(1);
    
    return subjects.length > 0 ? subjects[0] : null;
  } catch (error) {
    console.error("Error getting next subject:", error);
    return null;
  }
}

/**
 * Generate questions for a subject
 */
async function generateForSubject(subject: any) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🎓 Generating questions for ${subject.category} - ${subject.subject}`);
    console.log(`   Progress: ${subject.generatedCount}/${subject.targetCount}`);
    
    // Mark as running
    await db
      .update(generationSubjectProgress)
      .set({ status: "running", lastRunAt: new Date() })
      .where(eq(generationSubjectProgress.id, subject.id));
    
    // Calculate how many questions we need (don't overshoot target)
    const remaining = subject.targetCount - subject.generatedCount;
    const questionsToGenerate = Math.min(BATCH_SIZE, remaining);
    
    // Generate questions
    const questions = await generateQuestions({
      category: subject.category,
      subject: subject.subject,
      count: questionsToGenerate,
    });
    
    // Save to database
    const saved = await storage.createQuestions(questions);
    
    const duration = Date.now() - startTime;
    
    // Update progress
    const newGeneratedCount = subject.generatedCount + saved.length;
    const isComplete = newGeneratedCount >= subject.targetCount;
    
    await db
      .update(generationSubjectProgress)
      .set({
        generatedCount: newGeneratedCount,
        status: isComplete ? "completed" : "pending",
        errorCount: 0, // Reset error count on success
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(generationSubjectProgress.id, subject.id));
    
    // Log the generation
    await db.insert(generationLogs).values({
      subjectProgressId: subject.id,
      category: subject.category,
      subject: subject.subject,
      questionsRequested: questionsToGenerate,
      questionsGenerated: questions.length,
      questionsSaved: saved.length,
      status: "success",
      durationMs: duration,
    });
    
    console.log(`   ✓ Generated and saved ${saved.length} questions in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   📊 New progress: ${newGeneratedCount}/${subject.targetCount} ${isComplete ? "✅ COMPLETE" : ""}`);
    
    return true;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`   ✗ Error generating questions:`, error.message);
    
    // Update subject with error
    await db
      .update(generationSubjectProgress)
      .set({
        status: "error",
        errorCount: sql`${generationSubjectProgress.errorCount} + 1`,
        lastError: error.message,
        updatedAt: new Date(),
      })
      .where(eq(generationSubjectProgress.id, subject.id));
    
    // Log the failure
    await db.insert(generationLogs).values({
      subjectProgressId: subject.id,
      category: subject.category,
      subject: subject.subject,
      questionsRequested: Math.min(BATCH_SIZE, subject.targetCount - subject.generatedCount),
      questionsGenerated: 0,
      questionsSaved: 0,
      status: "failed",
      errorMessage: error.message,
      durationMs: duration,
    });
    
    return false;
  }
}

/**
 * Run one generation cycle
 */
async function runGenerationCycle() {
  // Prevent concurrent runs
  if (isRunning) {
    console.log("⏭️  Skipping generation cycle - already running");
    return;
  }
  
  isRunning = true;
  
  try {
    // Check if auto-generation is enabled
    const enabled = await isAutoGenerationEnabled();
    if (!enabled) {
      console.log("⏸️  Auto-generation is paused");
      return;
    }
    
    // Get next subject
    const subject = await getNextSubject();
    
    if (!subject) {
      console.log("✅ All subjects completed! Auto-generation stopping.");
      // Disable auto-generation since we're done
      await db
        .update(systemSettings)
        .set({ value: "false" })
        .where(eq(systemSettings.key, "autoGenerationEnabled"));
      return;
    }
    
    // Generate for this subject
    await generateForSubject(subject);
    
  } catch (error) {
    console.error("Error in generation cycle:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the background generation service
 */
export async function startBackgroundGeneration() {
  try {
    console.log("\n🚀 Starting background question generation service");
    console.log(`   Schedule: ${CRON_SCHEDULE} (every 5 minutes)`);
    console.log(`   Batch size: ${BATCH_SIZE} questions per run`);
    
    // Initialize progress table if needed
    await initializeGenerationProgress();
    
    // Check if there's work to do
    const subject = await getNextSubject();
    if (!subject) {
      console.log("✅ No subjects need generation - service will remain idle");
    }
    
    // Schedule the cron job
    cronJob = cron.schedule(CRON_SCHEDULE, runGenerationCycle);
    
    console.log("✓ Background generation service started\n");
    
    // Run immediately on startup (after a short delay)
    setTimeout(() => {
      runGenerationCycle();
    }, 5000); // Wait 5 seconds after startup
    
  } catch (error) {
    console.error("Error starting background generation:", error);
  }
}

/**
 * Stop the background generation service
 */
export function stopBackgroundGeneration() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("⏹️  Background generation service stopped");
  }
}

/**
 * Manually trigger a generation cycle (for admin use)
 */
export async function triggerManualGeneration() {
  return runGenerationCycle();
}
