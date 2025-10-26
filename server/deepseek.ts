import OpenAI from "openai";
import type { InsertQuestion } from "@shared/schema";
import { insertQuestionSchema } from "@shared/schema";

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

interface GenerateQuestionsParams {
  category: "NCLEX" | "TEAS" | "HESI";
  count: number;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export async function generateQuestions(params: GenerateQuestionsParams): Promise<InsertQuestion[]> {
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

  const userPrompt = `Generate ${count} ${difficulty || 'medium'} difficulty ${category} questions${subject ? ` on ${subject}` : ''}.

Make questions realistic and clinically relevant. Ensure proper formatting with exactly 4 options per question.`;

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from DeepSeek");
    }

    // Strip markdown code fences if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    // Parse the JSON response
    let questions;
    try {
      questions = JSON.parse(cleanContent);
    } catch (parseError: any) {
      console.error("Failed to parse DeepSeek response:", cleanContent);
      throw new Error(`Invalid JSON response from DeepSeek: ${parseError.message}`);
    }

    if (!Array.isArray(questions)) {
      throw new Error("DeepSeek response is not an array of questions");
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
        // Continue with other questions instead of failing completely
      }
    }

    if (validatedQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }

    return validatedQuestions;
  } catch (error: any) {
    console.error("Error generating questions with DeepSeek:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}
