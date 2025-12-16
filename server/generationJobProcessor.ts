import { db } from "./db";
import { generationJobs, generationLogs, questions } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { generateQuestions } from "./gemini";
import { storage } from "./storage";

const BATCH_SIZE = 5; // Generate 5 questions per API call
const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 second delay between batches to avoid rate limits
const MAX_ERRORS_BEFORE_PAUSE = 3;

let isProcessing = false;
let shouldStopProcessing = false;

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
      // Ensure required fields are present
      if (!job.sampleQuestion || !job.areasTocover) {
        throw new Error("Job is missing required sampleQuestion or areasTocover fields");
      }
      
      // Generate questions - use job.subject if available, fallback to job.topic for backwards compatibility
      const generatedQuestions = await generateQuestions({
        category: job.category as "NCLEX" | "TEAS" | "HESI",
        count: batchSize,
        subject: job.subject || job.topic, // Use dedicated subject field, fallback to topic for old jobs
        difficulty: job.difficulty as "easy" | "medium" | "hard",
        sampleQuestion: job.sampleQuestion,
        areasTocover: job.areasTocover,
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

// Continuously process jobs until all are done or stopped
async function runContinuousProcessing() {
  if (isProcessing) {
    console.log("📋 Processor already running");
    return;
  }

  shouldStopProcessing = false;
  
  console.log(`\n📋 Starting automatic job processing...`);
  console.log(`   Batch size: ${BATCH_SIZE} questions per API call`);
  console.log(`   Delay between batches: ${DELAY_BETWEEN_BATCHES_MS / 1000} seconds`);

  while (!shouldStopProcessing) {
    const result = await processNextJobBatch();
    
    if (!result.processed) {
      // No jobs to process, stop the loop
      console.log("📋 No pending jobs, stopping processor");
      break;
    }

    if (result.error) {
      // Error occurred, check if we should continue
      const [activeJob] = await db
        .select()
        .from(generationJobs)
        .where(inArray(generationJobs.status, ["pending", "running"]))
        .limit(1);
      
      if (!activeJob) {
        console.log("📋 No more active jobs after error, stopping processor");
        break;
      }
    }

    // Wait between batches to avoid rate limits
    if (!shouldStopProcessing) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  console.log("📋 Automatic processing stopped");
}

export function stopJobProcessor() {
  shouldStopProcessing = true;
  console.log("📋 Stopping job processor...");
}

// Helper function to parse topics from areasTocover string
function parseTopics(areasTocover: string): string[] {
  // Split by comma, semicolon, or newline and clean up
  const topics = areasTocover
    .split(/[,;\n]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
  return topics;
}

// Return type for createGenerationJob - can return single job or multiple jobs
export type GenerationJobResult = {
  job: typeof generationJobs.$inferSelect;
  isDistributed: boolean;
  allJobs?: typeof generationJobs.$inferSelect[];
  distribution?: { topic: string; count: number; jobId: number }[];
};

export async function createGenerationJob(params: {
  category: string;
  subject: string; // Main subject area (e.g., "English", "Math" for TEAS; "Pharmacology" for NCLEX)
  topic?: string; // Optional: specific topic if not using areasTocover
  difficulty: string;
  totalCount: number;
  sampleQuestion: string;
  areasTocover?: string; // Specific UNITS/TOPICS within the subject (comma-separated)
  createdBy?: string;
}): Promise<GenerationJobResult> {
  // Check if multiple topics are provided - if so, split into separate jobs for equal distribution
  if (params.areasTocover) {
    const topics = parseTopics(params.areasTocover);
    
    if (topics.length > 1) {
      // Ensure we have enough questions for all topics (at least 1 per topic)
      if (params.totalCount < topics.length) {
        throw new Error(
          `Cannot distribute ${params.totalCount} questions across ${topics.length} topics. ` +
          `Please request at least ${topics.length} questions (1 per topic) or reduce the number of topics.`
        );
      }
      
      // Multiple topics: create separate jobs with equal distribution
      const questionsPerTopic = Math.floor(params.totalCount / topics.length);
      let remainder = params.totalCount % topics.length;
      
      console.log(`\n📋 EQUAL DISTRIBUTION MODE: ${params.totalCount} questions ÷ ${topics.length} topics = ${questionsPerTopic} each`);
      if (remainder > 0) {
        console.log(`   (${remainder} extra questions distributed across first ${remainder} topics)`);
      }
      
      const jobs = [];
      const distribution = [];
      
      for (let i = 0; i < topics.length; i++) {
        const topicName = topics[i];
        // Distribute remainder across topics (1 extra question to first N topics where N = remainder)
        const hasExtraQuestion = i < remainder;
        const topicCount = questionsPerTopic + (hasExtraQuestion ? 1 : 0);
        
        const [job] = await db
          .insert(generationJobs)
          .values({
            category: params.category,
            subject: params.subject, // Main subject area (e.g., "English", "Math") - passed to Gemini for context
            topic: topicName, // Specific topic/unit (e.g., "Sentence Structure") - stored in question.topic
            difficulty: params.difficulty,
            totalCount: topicCount,
            batchSize: BATCH_SIZE,
            sampleQuestion: params.sampleQuestion,
            areasTocover: topicName, // Also pass as areasTocover for Gemini prompt
            createdBy: params.createdBy || null,
          })
          .returning();
        
        console.log(`   ✓ Job #${job.id}: ${topicCount} questions for "${params.subject}" - "${topicName}"`);
        jobs.push(job);
        distribution.push({ topic: topicName, count: topicCount, jobId: job.id });
      }
      
      console.log(`📋 Created ${jobs.length} generation jobs for equal distribution\n`);
      
      // Start automatic continuous processing (runs in background)
      setTimeout(() => runContinuousProcessing(), 1000);
      
      // Return all jobs with distribution info
      return {
        job: jobs[0],
        isDistributed: true,
        allJobs: jobs,
        distribution
      };
    }
  }
  
  // Single topic or no areasTocover: create one job as before
  const singleTopic = params.areasTocover || params.topic || params.subject;
  const [job] = await db
    .insert(generationJobs)
    .values({
      category: params.category,
      subject: params.subject, // Main subject area for Gemini context
      topic: singleTopic, // Specific topic or fallback to subject
      difficulty: params.difficulty,
      totalCount: params.totalCount,
      batchSize: BATCH_SIZE,
      sampleQuestion: params.sampleQuestion,
      areasTocover: params.areasTocover || null,
      createdBy: params.createdBy || null,
    })
    .returning();

  console.log(`📋 Created generation job #${job.id}: ${params.totalCount} ${params.category} questions on "${params.subject}" - "${singleTopic}"`);
  
  // Start automatic continuous processing (runs in background)
  setTimeout(() => runContinuousProcessing(), 1000);

  return {
    job,
    isDistributed: false
  };
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
  
  // Start automatic continuous processing
  setTimeout(() => runContinuousProcessing(), 1000);
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
