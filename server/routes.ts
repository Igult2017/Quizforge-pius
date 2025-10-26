import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateQuestions } from "./deepseek";
import { z } from "zod";
import { insertQuestionSchema, insertQuizAttemptSchema, insertQuizAnswerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const server = createServer(app);
  
  // ============= QUIZ ROUTES =============
  
  // Start a new quiz - protected route with free trial logic
  app.post("/api/quiz/start", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.body;
      const userId = req.user.claims.sub;
      
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check subscription status and free trial
      const subscription = await storage.getActiveSubscription(userId);
      const hasUsedFreeTrial = user.hasUsedFreeTrial;
      
      // Determine question count: 30 for free trial, 50 for subscribed
      let questionCount = 50;
      let isFreeTrialAttempt = false;
      
      if (!subscription) {
        // No active subscription
        if (hasUsedFreeTrial) {
          // User has used free trial and has no subscription
          return res.status(403).json({ 
            error: "Subscription required",
            message: "Your free trial has been used. Please subscribe to continue practicing."
          });
        } else {
          // First time user - give free trial with 30 questions
          questionCount = 30;
          isFreeTrialAttempt = true;
        }
      }

      // Get random questions
      const questions = await storage.getRandomQuestions(category, questionCount);
      
      if (questions.length === 0) {
        return res.status(404).json({ error: "No questions available for this category" });
      }

      // Create quiz attempt
      const attempt = await storage.createQuizAttemptWithAnswers({
        userId: user.id,
        category,
        status: "in_progress",
        totalQuestions: questions.length,
        isFreeTrialAttempt,
      }, questions.map(q => q.id));

      res.json({
        attemptId: attempt.id,
        isFreeTrialAttempt,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
        })),
      });
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  // Save an answer - protected
  app.post("/api/quiz/:attemptId/answer", isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const { questionId, userAnswer } = req.body;

      if (!questionId || !userAnswer) {
        return res.status(400).json({ error: "questionId and userAnswer are required" });
      }

      // Get the question to check the answer
      const question = await storage.getQuestionById(Number(questionId));
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Get existing answers for this attempt to find the right one to update
      const answers = await storage.getQuizAnswers(Number(attemptId));
      const existingAnswer = answers.find(a => a.questionId === Number(questionId));

      if (!existingAnswer) {
        return res.status(404).json({ error: "Answer record not found" });
      }

      // Check if answer is correct
      const isCorrect = userAnswer === question.correctAnswer;

      // Update the answer
      await storage.updateQuizAnswer(existingAnswer.id, {
        userAnswer,
        isCorrect,
        answeredAt: new Date(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving answer:", error);
      res.status(500).json({ error: "Failed to save answer" });
    }
  });

  // Submit quiz and get results - protected
  app.post("/api/quiz/:attemptId/submit", isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const userId = req.user.claims.sub;

      // Get quiz attempt
      const attempt = await storage.getQuizAttempt(Number(attemptId));
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }

      // Get all answers
      const answers = await storage.getQuizAnswers(Number(attemptId));
      
      // Calculate score
      const correctCount = answers.filter(a => a.isCorrect === true).length;

      // Update quiz attempt
      await storage.updateQuizAttempt(Number(attemptId), {
        status: "completed",
        score: correctCount,
        completedAt: new Date(),
      });

      // If this was a free trial attempt, mark the free trial as used
      if (attempt.isFreeTrialAttempt) {
        await storage.markFreeTrialAsUsed(userId);
      }

      res.json({
        success: true,
        score: correctCount,
        totalQuestions: answers.length,
      });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get detailed quiz results - protected
  app.get("/api/quiz/:attemptId/results", isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;

      // Get quiz attempt
      const attempt = await storage.getQuizAttempt(Number(attemptId));
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }

      if (attempt.status !== "completed") {
        return res.status(400).json({ error: "Quiz not yet completed" });
      }

      // Get all answers
      const answers = await storage.getQuizAnswers(Number(attemptId));

      // Get all questions with details
      const detailedAnswers = await Promise.all(
        answers.map(async (answer) => {
          const question = await storage.getQuestionById(answer.questionId);
          return {
            questionId: answer.questionId,
            question: question?.question || "",
            options: question?.options || [],
            userAnswer: answer.userAnswer,
            correctAnswer: question?.correctAnswer || "",
            isCorrect: answer.isCorrect,
            explanation: question?.explanation,
          };
        })
      );

      const correctCount = answers.filter(a => a.isCorrect === true).length;
      const incorrectCount = answers.filter(a => a.isCorrect === false).length;
      const skippedCount = answers.filter(a => a.userAnswer === null).length;

      res.json({
        attemptId: attempt.id,
        category: attempt.category,
        score: correctCount,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        skippedAnswers: skippedCount,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        questions: detailedAnswers,
      });
    } catch (error: any) {
      console.error("Error fetching results:", error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // ============= ADMIN ROUTES =============
  
  // Create a single question (admin only)
  app.post("/api/admin/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error: any) {
      console.error("Error creating question:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid question data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  // Bulk create questions (admin only)
  app.post("/api/admin/questions/bulk", async (req, res) => {
    try {
      const { questions } = req.body;
      
      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: "questions must be an array" });
      }

      // Validate all questions
      const validatedQuestions = questions.map(q => insertQuestionSchema.parse(q));
      
      // Insert all questions
      const created = await storage.createQuestions(validatedQuestions);
      
      res.json({
        success: true,
        count: created.length,
        questions: created,
      });
    } catch (error: any) {
      console.error("Error creating questions:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid question data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create questions" });
    }
  });

  // Get question count by category
  app.get("/api/admin/questions/stats", async (req, res) => {
    try {
      const nclex = await storage.getQuestionsByCategory("NCLEX");
      const teas = await storage.getQuestionsByCategory("TEAS");
      const hesi = await storage.getQuestionsByCategory("HESI");

      res.json({
        NCLEX: nclex.length,
        TEAS: teas.length,
        HESI: hesi.length,
        total: nclex.length + teas.length + hesi.length,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Generate questions with DeepSeek AI (admin only)
  app.post("/api/admin/questions/generate", async (req, res) => {
    try {
      const { category, count, subject, difficulty } = req.body;

      if (!category || !count) {
        return res.status(400).json({ error: "category and count are required" });
      }

      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "category must be NCLEX, TEAS, or HESI" });
      }

      if (count < 1 || count > 100) {
        return res.status(400).json({ error: "count must be between 1 and 100" });
      }

      console.log(`Generating ${count} ${category} questions...`);
      
      // Generate questions using DeepSeek
      const generatedQuestions = await generateQuestions({
        category,
        count: Number(count),
        subject,
        difficulty,
      });

      // Save to database
      const saved = await storage.createQuestions(generatedQuestions);

      res.json({
        success: true,
        generated: saved.length,
        questions: saved,
      });
    } catch (error: any) {
      console.error("Error generating questions:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  return server;
}
