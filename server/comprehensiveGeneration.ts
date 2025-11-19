// Comprehensive question generation script
// Generates questions across all subject areas for NCLEX, TEAS, and HESI
// Total target: ~12,500 questions for comprehensive coverage
// Estimated cost with Gemini 1.5 Flash: ~$1-2

import { storage } from "./storage";
import { generateQuestions } from "./gemini";
import { EXAM_CONFIGS, getTotalQuestionCount } from "./questionTopics";
import type { InsertQuestion } from "@shared/schema";

// Configuration
const BATCH_SIZE = 20; // Generate 20 questions at a time to stay within API limits
const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches to avoid rate limits

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate questions for a specific subject
async function generateSubjectQuestions(
  category: "NCLEX" | "TEAS" | "HESI",
  subjectName: string,
  topics: string[],
  questionCount: number,
  difficulties: { easy: number; medium: number; hard: number }
): Promise<void> {
  console.log(`\n📚 Generating ${questionCount} questions for ${category} - ${subjectName}`);
  console.log(`   Topics: ${topics.slice(0, 3).join(", ")}${topics.length > 3 ? '...' : ''}`);
  
  let totalGenerated = 0;
  let totalSaved = 0;
  const errors: string[] = [];

  // Generate questions for each difficulty level
  for (const [difficulty, count] of Object.entries(difficulties)) {
    if (count === 0) continue;

    console.log(`\n   Generating ${count} ${difficulty} questions...`);
    let generatedForDifficulty = 0;

    // Split into batches
    const numBatches = Math.ceil(count / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
      const questionsInBatch = Math.min(BATCH_SIZE, count - generatedForDifficulty);
      
      try {
        // Create a detailed prompt with topics
        const topicPrompt = topics.length > 0 
          ? `Focus on these topics: ${topics.join(", ")}. Distribute questions evenly across topics.`
          : "";

        const questions = await generateQuestions({
          category,
          count: questionsInBatch,
          subject: `${subjectName}. ${topicPrompt}`,
          difficulty: difficulty as "easy" | "medium" | "hard"
        });

        // Save to database
        const saved = await storage.createQuestions(questions);
        
        generatedForDifficulty += questions.length;
        totalGenerated += questions.length;
        totalSaved += saved.length;
        
        console.log(`   ✓ Batch ${batchIndex + 1}/${numBatches}: Generated ${questions.length}, Saved ${saved.length}`);

        // Delay between batches to avoid rate limits
        if (batchIndex < numBatches - 1) {
          await delay(DELAY_BETWEEN_BATCHES);
        }

      } catch (error: any) {
        const errorMsg = `Batch ${batchIndex + 1}/${numBatches} (${difficulty}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ✗ ${errorMsg}`);
        
        // Continue with next batch despite error (modular approach)
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }
  }

  // Summary for this subject
  console.log(`\n   📊 Subject Summary: ${subjectName}`);
  console.log(`   Generated: ${totalGenerated}/${questionCount}`);
  console.log(`   Saved: ${totalSaved}`);
  if (errors.length > 0) {
    console.log(`   ⚠️  Errors: ${errors.length}`);
  }
}

// Main comprehensive generation function
export async function generateComprehensiveQuestions(
  categories?: ("NCLEX" | "TEAS" | "HESI")[]
): Promise<void> {
  const targetCategories = categories || ["NCLEX", "TEAS", "HESI"];
  
  console.log("=".repeat(80));
  console.log("🎓 COMPREHENSIVE NURSING EXAM QUESTION GENERATION");
  console.log("=".repeat(80));
  console.log(`\n📋 Target: ~${getTotalQuestionCount().toLocaleString()} total questions`);
  console.log(`💰 Estimated cost: $1-2 USD (using Gemini 1.5 Flash)`);
  console.log(`⏱️  Estimated time: 30-60 minutes\n`);

  const startTime = Date.now();
  let grandTotalGenerated = 0;
  let grandTotalSaved = 0;

  for (const category of targetCategories) {
    const config = EXAM_CONFIGS[category];
    if (!config) {
      console.log(`⚠️  Skipping unknown category: ${category}`);
      continue;
    }

    console.log("\n" + "=".repeat(80));
    console.log(`📖 ${category} QUESTIONS`);
    console.log(`   Target: ${config.totalQuestions.toLocaleString()} questions`);
    console.log(`   Subjects: ${config.subjects.length}`);
    console.log("=".repeat(80));

    for (const subject of config.subjects) {
      try {
        const beforeCount = await storage.getQuestionsByCategory(category);
        
        await generateSubjectQuestions(
          category,
          subject.name,
          subject.topics,
          subject.questionCount,
          subject.difficulties
        );

        const afterCount = await storage.getQuestionsByCategory(category);
        const newQuestions = afterCount.length - beforeCount.length;
        
        grandTotalGenerated += subject.questionCount; // Target count
        grandTotalSaved += newQuestions;

      } catch (error: any) {
        console.error(`\n❌ Failed to generate subject ${subject.name}: ${error.message}`);
        // Continue with next subject (modular approach - don't let one failure stop everything)
      }

      // Brief delay between subjects
      await delay(1000);
    }
  }

  // Final summary
  const duration = Math.round((Date.now() - startTime) / 1000 / 60);
  console.log("\n" + "=".repeat(80));
  console.log("✅ GENERATION COMPLETE");
  console.log("=".repeat(80));
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`📊 Total Saved: ${grandTotalSaved.toLocaleString()} questions`);
  
  // Show final counts by category
  for (const category of targetCategories) {
    const questions = await storage.getQuestionsByCategory(category);
    console.log(`   ${category}: ${questions.length.toLocaleString()} questions`);
  }
  
  console.log("=".repeat(80));
}

// Run if called directly
if (require.main === module) {
  generateComprehensiveQuestions()
    .then(() => {
      console.log("\n🎉 All questions generated successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Generation failed:", error);
      process.exit(1);
    });
}
