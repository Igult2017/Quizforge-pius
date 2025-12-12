import { db } from "./db";
import { generationJobs, generationLogs, questions } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { generateQuestions } from "./gemini";
import { storage } from "./storage";

const BATCH_SIZE = 5; // Generate 5 questions per API call
const PROCESSING_INTERVAL_MS = 30000; // Process every 30 seconds to minimize API calls
const MAX_ERRORS_BEFORE_PAUSE = 3;
const RETRY_DELAY_MS = 60000; // Wait 1 minute after an error before retrying

let isProcessing = false;
let processingInterval: NodeJS.Timeout | null = null;

export async function processNextJobBatch(): Promise<{ processed: boolean; jobId?: number; generated?: number; error?: string }> {
  if (isProcessing) {
    return { processed: false, error: "Already processing" };
  }

  isProcessing = true;
  
  try {
    // Find the next pending or running job
    const [job] = await db
      .select()
      .from(generationJobs)
      .where(
        inArray(generationJobs.status, ["pending", "running"])
      )
      .orderBy(generationJobs.createdAt)
      .limit(1);

    if (!job) {
      isProcessing = false;
      return { processed: false };
    }

    // Mark job as running
    if (job.status === "pending") {
      await db
        .update(generationJobs)
        .set({ status: "running", updatedAt: new Date() })
        .where(eq(generationJobs.id, job.id));
    }

    // Calculate how many questions to generate in this batch
    const remaining = job.totalCount - job.generatedCount;
    if (remaining <= 0) {
      // Job is complete
      await db
        .update(generationJobs)
        .set({ 
          status: "completed", 
          updatedAt: new Date(),
          completedAt: new Date()
        })
        .where(eq(generationJobs.id, job.id));
      
      isProcessing = false;
      return { processed: true, jobId: job.id, generated: 0 };
    }

    const batchSize = Math.min(job.batchSize || BATCH_SIZE, remaining);
    const startTime = Date.now();

    console.log(`\n📝 Processing generation job #${job.id}`);
    console.log(`   Topic: ${job.topic} | Category: ${job.category} | Difficulty: ${job.difficulty}`);
    console.log(`   Progress: ${job.generatedCount}/${job.totalCount} (generating ${batchSize} more)`);

    try {
      // Generate questions
      const generatedQuestions = await generateQuestions({
        category: job.category as "NCLEX" | "TEAS" | "HESI",
        count: batchSize,
        subject: job.topic,
        difficulty: job.difficulty as "easy" | "medium" | "hard",
        sampleQuestion: job.sampleQuestion || undefined,
        areasTocover: job.areasTocover || undefined,
      });

      // Save to database
      const saved = await storage.createQuestions(generatedQuestions);
      const duration = Date.now() - startTime;

      // Update job progress
      const newGeneratedCount = job.generatedCount + saved.length;
      const isComplete = newGeneratedCount >= job.totalCount;

      await db
        .update(generationJobs)
        .set({
          generatedCount: newGeneratedCount,
          status: isComplete ? "completed" : "running",
          errorCount: 0, // Reset error count on success
          lastError: null,
          updatedAt: new Date(),
          completedAt: isComplete ? new Date() : null,
        })
        .where(eq(generationJobs.id, job.id));

      // Log the generation
      await db.insert(generationLogs).values({
        generationJobId: job.id,
        category: job.category,
        subject: job.topic,
        questionsRequested: batchSize,
        questionsGenerated: generatedQuestions.length,
        questionsSaved: saved.length,
        status: "success",
        durationMs: duration,
      });

      console.log(`   ✓ Generated ${saved.length} questions in ${(duration / 1000).toFixed(1)}s`);
      console.log(`   📊 Progress: ${newGeneratedCount}/${job.totalCount} ${isComplete ? "✅ COMPLETE" : ""}`);

      isProcessing = false;
      return { processed: true, jobId: job.id, generated: saved.length };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`   ✗ Error generating questions:`, error.message);

      // Update job with error
      const newErrorCount = job.errorCount + 1;
      const shouldPause = newErrorCount >= MAX_ERRORS_BEFORE_PAUSE;

      await db
        .update(generationJobs)
        .set({
          status: shouldPause ? "failed" : "running",
          errorCount: newErrorCount,
          lastError: error.message,
          updatedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));

      // Log the failure
      await db.insert(generationLogs).values({
        generationJobId: job.id,
        category: job.category,
        subject: job.topic,
        questionsRequested: batchSize,
        questionsGenerated: 0,
        questionsSaved: 0,
        status: "failed",
        errorMessage: error.message,
        durationMs: duration,
      });

      if (shouldPause) {
        console.log(`   ⚠️ Job paused after ${MAX_ERRORS_BEFORE_PAUSE} consecutive errors`);
      }

      isProcessing = false;
      return { processed: true, jobId: job.id, generated: 0, error: error.message };
    }

  } catch (error: any) {
    console.error("Job processor error:", error);
    isProcessing = false;
    return { processed: false, error: error.message };
  }
}

export function startJobProcessor() {
  if (processingInterval) {
    console.log("📋 Job processor already running");
    return;
  }

  console.log(`\n📋 Starting generation job processor`);
  console.log(`   Interval: ${PROCESSING_INTERVAL_MS / 1000} seconds`);
  console.log(`   Batch size: ${BATCH_SIZE} questions per run`);

  // Process immediately on start
  processNextJobBatch();

  // Then process on interval
  processingInterval = setInterval(async () => {
    await processNextJobBatch();
  }, PROCESSING_INTERVAL_MS);
}

export function stopJobProcessor() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
    console.log("📋 Generation job processor stopped");
  }
}

export async function createGenerationJob(params: {
  category: string;
  topic: string;
  difficulty: string;
  totalCount: number;
  sampleQuestion: string;
  areasTocover?: string;
  createdBy?: string;
}) {
  const [job] = await db
    .insert(generationJobs)
    .values({
      category: params.category,
      topic: params.topic,
      difficulty: params.difficulty,
      totalCount: params.totalCount,
      batchSize: BATCH_SIZE,
      sampleQuestion: params.sampleQuestion,
      areasTocover: params.areasTocover || null,
      createdBy: params.createdBy || null,
    })
    .returning();

  console.log(`📋 Created generation job #${job.id}: ${params.totalCount} ${params.category} questions on "${params.topic}"`);
  
  // Trigger immediate processing
  setTimeout(() => processNextJobBatch(), 1000);

  return job;
}

export async function getJobStatus(jobId: number) {
  const [job] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.id, jobId));

  return job;
}

export async function getAllJobs() {
  return db
    .select()
    .from(generationJobs)
    .orderBy(sql`${generationJobs.createdAt} DESC`)
    .limit(50);
}

export async function pauseJob(jobId: number) {
  await db
    .update(generationJobs)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(generationJobs.id, jobId));
}

export async function resumeJob(jobId: number) {
  await db
    .update(generationJobs)
    .set({ status: "pending", errorCount: 0, lastError: null, updatedAt: new Date() })
    .where(eq(generationJobs.id, jobId));
  
  // Trigger immediate processing
  setTimeout(() => processNextJobBatch(), 1000);
}

export async function deleteJob(jobId: number) {
  // First delete related logs
  await db
    .delete(generationLogs)
    .where(eq(generationLogs.generationJobId, jobId));
  
  // Then delete the job
  await db
    .delete(generationJobs)
    .where(eq(generationJobs.id, jobId));
}
