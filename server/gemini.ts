// gemini.ts - Question generation using Google Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InsertQuestion } from "@shared/schema";
import { insertQuestionSchema } from "@shared/schema";

let genAI: GoogleGenerativeAI | null = null;

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

Return ONLY a valid JSON array of questions with this exact structure:
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
    
    // Use gemini-1.5-flash for fast and efficient question generation
    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash",
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

    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(cleanContent);
    } catch (parseError: any) {
      console.error("Failed to parse Gemini AI response:", cleanContent);
      throw new Error(`Invalid JSON response from Gemini AI: ${parseError.message}`);
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
