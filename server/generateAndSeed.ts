import { storage } from "./storage";
import { generateQuestions } from "./gemini";

async function generateAndSeedQuestions() {
  try {
    console.log("Generating questions using Gemini API...\n");

    // Generate 35 questions for each category
    const categories = ["NCLEX", "TEAS", "HESI"] as const;
    
    for (const category of categories) {
      console.log(`Generating 35 ${category} questions...`);
      
      try {
        const questions = await generateQuestions({
          category,
          count: 35,
        });

        console.log(`✓ Generated ${questions.length} ${category} questions`);
        
        // Save to database
        const created = await storage.createQuestions(questions);
        console.log(`✓ Saved ${created.length} ${category} questions to database\n`);
      } catch (error: any) {
        console.error(`✗ Failed to generate ${category} questions:`, error.message);
      }
    }

    console.log("Question generation complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating questions:", error);
    process.exit(1);
  }
}

// Run generation
generateAndSeedQuestions();
