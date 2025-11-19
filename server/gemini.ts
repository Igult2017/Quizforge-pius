// gemini.ts - Question generation using Google Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InsertQuestion } from "@shared/schema";
import { insertQuestionSchema } from "@shared/schema";

let genAI: GoogleGenerativeAI | null = null;
let detectedModel: string | null = null;

// Initialize Gemini AI safely
function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Please add your Gemini API key."
      );
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Common Gemini models in order of preference
const FALLBACK_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro'
];

// Try to generate with a specific model to test if it works
async function testModel(client: GoogleGenerativeAI, modelName: string): Promise<boolean> {
  try {
    const model = client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 100, // Small token limit for test
      },
    });
    
    // Simple test prompt
    const result = await model.generateContent("Say 'OK' if you can generate content.");
    const response = result.response.text();
    
    return response.length > 0;
  } catch (error: any) {
    // If we get a 404, the model doesn't exist
    if (error.status === 404) {
      return false;
    }
    // Other errors might be temporary, so we'll consider the model valid
    console.warn(`⚠️  Warning testing model ${modelName}: ${error.message}`);
    return true;
  }
}

// Get the model name to use (from env var or auto-detect with fallback)
async function getModelName(): Promise<string> {
  // If model is specified in environment, use it (no fallback)
  if (process.env.GEMINI_MODEL) {
    console.log(`📌 Using Gemini model from environment: ${process.env.GEMINI_MODEL}`);
    return process.env.GEMINI_MODEL;
  }

  // If we've already detected a working model, use it
  if (detectedModel) {
    return detectedModel;
  }

  // Try models in order until we find one that works
  const client = getGeminiClient();
  console.log(`🔍 Auto-detecting working Gemini model...`);
  
  for (const modelName of FALLBACK_MODELS) {
    console.log(`   Testing: ${modelName}...`);
    const works = await testModel(client, modelName);
    
    if (works) {
      detectedModel = modelName;
      console.log(`✓ Found working model: ${detectedModel}`);
      return detectedModel;
    } else {
      console.log(`   ✗ Model ${modelName} not available (404)`);
    }
  }

  // If no models work, throw error with helpful message
  throw new Error(
    `No working Gemini models found. Tried: ${FALLBACK_MODELS.join(', ')}. ` +
    `Set GEMINI_MODEL environment variable to a model supported by your API key.`
  );
}

interface GenerateQuestionsParams {
  category: "NCLEX" | "TEAS" | "HESI";
  count: number;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<InsertQuestion[]> {
  const { category, count, subject, difficulty } = params;

  const systemPrompt = `You are an expert nursing exam question writer. Generate high-quality, realistic practice questions for ${category} exams.

Requirements:
- Each question must have exactly 4 answer options
- Only ONE option should be correct
- Include a detailed explanation for the correct answer
- Questions should test critical thinking, not just memorization
- Use proper medical terminology
- Follow NCLEX/TEAS/HESI question format standards

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON - no extra text before or after
2. Use double quotes for all property names and string values
3. If text contains quotes, use ONLY apostrophes (') instead of double quotes (")
4. Keep all text concise to ensure complete response
5. Never truncate or cut off any question object

Return a JSON array with this exact structure:
[
  {
    "question": "The complete question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact text of the correct option",
    "explanation": "Detailed explanation of why this answer is correct",
    "subject": "Subject area (e.g., Pharmacology, Medical-Surgical)",
    "difficulty": "easy|medium|hard"
  }
]`;

  const userPrompt = `Generate ${count} ${difficulty || "medium"} difficulty ${category} questions${
    subject ? ` on ${subject}` : ""
  }.

Make questions realistic and clinically relevant. Ensure proper formatting with exactly 4 options per question.`;

  try {
    const client = getGeminiClient();
    
    // Get the model name (from env var or auto-detect with fallback)
    const modelName = await getModelName();
    
    const model = client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const response = result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No content received from Gemini AI");
    }

    // Strip markdown code fences if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    // Parse JSON with aggressive cleanup
    let questions;
    try {
      questions = JSON.parse(cleanContent);
    } catch (parseError: any) {
      console.error("❌ JSON parse error:", parseError.message);
      
      // Try aggressive JSON cleanup
      let fixedContent = cleanContent
        // Remove trailing commas before closing brackets/braces
        .replace(/,(\s*[}\]])/g, '$1')
        // Remove any text before the first [
        .replace(/^[^[]*/, '')
        // Remove any text after the last ]
        .replace(/[^\]]*$/, '')
        // Try to fix truncated strings by closing them
        .replace(/("[^"]*$)/, '$1"');
      
      try {
        console.log("🔧 Attempting to parse cleaned JSON (attempt 1)...");
        questions = JSON.parse(fixedContent);
        console.log("✅ Successfully parsed after cleanup");
      } catch (secondError: any) {
        // Try more aggressive cleanup - extract only complete question objects
        try {
          console.log("🔧 Attempting manual question extraction (attempt 2)...");
          
          // Find all complete question objects using regex
          const questionPattern = /\{[^}]*"question"[^}]*"options"[^}]*"correctAnswer"[^}]*"explanation"[^}]*\}/g;
          const matches = cleanContent.match(questionPattern);
          
          if (matches && matches.length > 0) {
            // Wrap in array and try to parse
            fixedContent = '[' + matches.join(',') + ']';
            questions = JSON.parse(fixedContent);
            console.log(`✅ Extracted ${questions.length} complete questions via pattern matching`);
          } else {
            throw new Error("Could not extract any complete questions");
          }
        } catch (thirdError: any) {
          // If all fails, log details and throw
          const errorPosition = parseInt(secondError.message.match(/\d+/)?.[0] || '0');
          const sample = cleanContent.substring(Math.max(0, errorPosition - 100), errorPosition + 100);
          console.error("Failed all cleanup attempts. Sample around error position:");
          console.error(sample);
          console.error("\nFirst 500 chars of response:", cleanContent.substring(0, 500));
          console.error("\nLast 500 chars of response:", cleanContent.substring(cleanContent.length - 500));
          throw new Error(`Invalid JSON response from Gemini AI: ${parseError.message}`);
        }
      }
    }

    if (!Array.isArray(questions)) {
      throw new Error("Gemini AI response is not an array of questions");
    }

    // Validate and transform to InsertQuestion format
    const validatedQuestions: InsertQuestion[] = [];
    for (const q of questions) {
      try {
        const validated = insertQuestionSchema.parse({
          category,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty || "medium",
          subject: q.subject || subject,
        });
        validatedQuestions.push(validated);
      } catch (validationError: any) {
        console.error("Question validation failed:", validationError);
      }
    }

    if (validatedQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }

    return validatedQuestions;
  } catch (error: any) {
    console.error("Error generating questions with Gemini AI:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}
