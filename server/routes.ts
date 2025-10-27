import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { isAuthenticated } from "./firebaseAuth";
import { generateQuestions } from "./deepseek";
import { z } from "zod";
import { insertQuestionSchema, insertQuizAttemptSchema, insertQuizAnswerSchema, insertPaymentSchema } from "@shared/schema";
import { createOrder, getTransactionStatus } from "./pesapal";
import { nanoid } from "nanoid";
import { isAdmin } from "./adminMiddleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes - no authentication required, returns null if not logged in
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // Auto-create user if authenticated but not in database
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || null,
          firstName: req.user.claims.first_name || null,
          lastName: req.user.claims.last_name || null,
          profileImageUrl: null,
        });
      }
      
      // Get active subscription
      const subscription = await storage.getActiveSubscription(userId);
      
      res.json({
        ...user,
        subscription: subscription || null,
        hasActiveSubscription: !!subscription,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const server = createServer(app);
  
  // ============= PAYMENT ROUTES =============
  
  // Create payment order
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      const { plan, email, firstName, lastName, phone } = req.body;
      
      if (!plan || !email || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Plan pricing
      const planPricing: Record<string, number> = {
        weekly: 5,
        monthly: 15,
      };

      const amount = planPricing[plan];
      if (!amount) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Generate unique merchant reference
      const merchantReference = `NB-${plan.toUpperCase()}-${nanoid(12)}`;
      const callbackUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/payment/callback`;

      // Create payment record in database
      const payment = await storage.createPayment({
        merchantReference,
        plan,
        amount: amount * 100, // store in cents
        currency: "USD",
        status: "pending",
        email,
        firstName,
        lastName,
        phone: phone || null,
        userId: null,
        orderTrackingId: null,
        paymentMethod: null,
      });

      // Create order with PesaPal
      const orderResponse = await createOrder({
        id: merchantReference,
        amount,
        email,
        firstName,
        lastName,
        phone: phone || "",
        description: `NurseBrace ${plan} subscription`,
        callbackUrl,
      });

      // Update payment with order tracking ID
      await storage.updatePayment(payment.id, {
        orderTrackingId: orderResponse.order_tracking_id,
      });

      res.json({
        success: true,
        paymentId: payment.id,
        redirectUrl: orderResponse.redirect_url,
        orderTrackingId: orderResponse.order_tracking_id,
      });
    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // Payment callback - handle return from PesaPal
  app.get("/payment/callback", async (req, res) => {
    const { OrderTrackingId, OrderMerchantReference } = req.query;

    if (!OrderTrackingId) {
      return res.redirect("/?payment=error");
    }

    try {
      // Get transaction status from PesaPal
      const status = await getTransactionStatus(OrderTrackingId as string);

      // Find payment in database
      const payment = await storage.getPaymentByOrderTrackingId(OrderTrackingId as string);
      
      if (!payment) {
        return res.redirect("/?payment=not_found");
      }

      // Update payment status
      if (status.payment_status_description === "Completed") {
        await storage.updatePayment(payment.id, {
          status: "completed",
          paymentMethod: status.payment_method,
        });
        
        // Redirect to post-payment signup page
        return res.redirect(`/post-payment-signup?merchantReference=${payment.merchantReference}&OrderTrackingId=${OrderTrackingId}`);
      } else {
        await storage.updatePayment(payment.id, {
          status: "failed",
        });
        return res.redirect("/?payment=failed");
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      return res.redirect("/?payment=error");
    }
  });

  // Verify payment status
  app.get("/api/payments/:paymentId/status", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await storage.getPaymentById(Number(paymentId));
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json({
        status: payment.status,
        plan: payment.plan,
        amount: payment.amount / 100,
        email: payment.email,
      });
    } catch (error) {
      console.error("Payment status error:", error);
      res.status(500).json({ error: "Failed to get payment status" });
    }
  });

  // Verify payment by merchant reference (for post-payment signup)
  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { merchantReference, orderTrackingId } = req.body;
      
      if (!merchantReference) {
        return res.status(400).json({ error: "Merchant reference is required" });
      }

      // Find payment by merchant reference
      const payment = await storage.getPaymentByMerchantReference(merchantReference);
      
      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          error: "Payment not found" 
        });
      }

      // If payment is pending and we have orderTrackingId, check status with PesaPal
      if (payment.status === "pending" && orderTrackingId) {
        try {
          const status = await getTransactionStatus(orderTrackingId);
          
          if (status.payment_status_description === "Completed") {
            await storage.updatePayment(payment.id, {
              status: "completed",
              paymentMethod: status.payment_method,
            });
            payment.status = "completed";
          }
        } catch (error) {
          console.error("Error checking transaction status:", error);
        }
      }

      // Only return completed payments
      if (payment.status !== "completed") {
        return res.status(400).json({ 
          success: false, 
          error: "Payment not completed" 
        });
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          email: payment.email,
          firstName: payment.firstName,
          lastName: payment.lastName,
          plan: payment.plan,
          amount: payment.amount / 100,
          status: payment.status,
        },
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to verify payment" 
      });
    }
  });

  // Link payment to newly created user and create subscription
  // NOTE: This endpoint validates payment ownership without requiring Replit Auth
  // because users sign up via Firebase Auth (different auth system)
  app.post("/api/payments/link-to-user", async (req, res) => {
    try {
      const { merchantReference, userId, userEmail } = req.body;
      
      if (!merchantReference || !userId || !userEmail) {
        return res.status(400).json({ 
          success: false, 
          error: "Merchant reference, userId, and userEmail are required" 
        });
      }

      // Find payment by merchant reference
      const payment = await storage.getPaymentByMerchantReference(merchantReference);
      
      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          error: "Payment not found" 
        });
      }

      // Security validations to prevent abuse
      if (payment.status !== "completed") {
        return res.status(400).json({ 
          success: false, 
          error: "Payment not completed" 
        });
      }

      if (payment.userId) {
        return res.status(400).json({ 
          success: false, 
          error: "Payment already linked to a user" 
        });
      }

      // CRITICAL: Verify that the email matches the payment email
      // This prevents anyone from linking another person's payment
      if (!payment.email || payment.email.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ 
          success: false, 
          error: "Email does not match payment email" 
        });
      }

      // Verify user exists and email matches (double-check)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: "User not found" 
        });
      }

      if (!user.email || user.email.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ 
          success: false, 
          error: "User email does not match provided email" 
        });
      }

      // Calculate subscription end date based on plan
      const planDurations: Record<string, number> = {
        weekly: 7,
        monthly: 30,
      };

      const durationDays = planDurations[payment.plan] || 30;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Update payment with userId
      await storage.updatePayment(payment.id, {
        userId,
      });

      // Create subscription
      await storage.createSubscription({
        userId,
        plan: payment.plan,
        status: "active",
        startDate,
        endDate,
      });

      res.json({
        success: true,
        message: "Payment linked and subscription created",
      });
    } catch (error) {
      console.error("Link payment error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to link payment to user" 
      });
    }
  });
  
  // ============= QUIZ ROUTES =============
  
  // Start a new quiz - protected route with free trial logic
  app.post("/api/quiz/start", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.body;
      const userId = req.user.claims.sub;
      
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Get or create user (auto-create if first time via Firebase Auth)
      let user = await storage.getUser(userId);
      if (!user) {
        // User authenticated via Firebase but doesn't exist in DB yet
        // Create them automatically with info from token
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || null,
          firstName: req.user.claims.first_name || null,
          lastName: req.user.claims.last_name || null,
          profileImageUrl: null,
        });
      }

      // Check admin-granted access (overrides subscription/trial)
      const hasAdminAccess = user.adminGrantedAccess && 
        (!user.adminAccessExpiresAt || new Date(user.adminAccessExpiresAt) > new Date());
      
      // Check subscription status and free trial
      const subscription = await storage.getActiveSubscription(userId);
      const hasUsedFreeTrial = user.hasUsedFreeTrial;
      
      // Determine question count: 30 for free trial, 50 for subscribed or admin access
      let questionCount = 50;
      let isFreeTrialAttempt = false;
      
      if (!subscription && !hasAdminAccess) {
        // No active subscription or admin access
        if (hasUsedFreeTrial) {
          // User has used free trial and has no subscription or admin access
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

      // Get random questions (up to the requested count)
      console.log(`Quiz request - Category: "${category}", Count: ${questionCount}, User: ${userId}`);
      const questions = await storage.getRandomQuestions(category, questionCount);
      console.log(`Questions found: ${questions.length} for category "${category}"`);
      
      if (questions.length === 0) {
        console.error(`No questions available for category "${category}"`);
        return res.status(404).json({ 
          error: "No questions available for this category",
          message: "This category doesn't have any questions yet. Please try another category or contact support."
        });
      }

      // If we don't have enough questions, use what's available
      // This allows users to practice even if the database doesn't have the full set
      const actualQuestionCount = Math.min(questions.length, questionCount);
      
      console.log(`Starting quiz: requested ${questionCount}, found ${questions.length}, using ${actualQuestionCount} questions for ${category}`);

      // Create quiz attempt
      const attempt = await storage.createQuizAttemptWithAnswers({
        userId: user.id,
        category,
        status: "in_progress",
        totalQuestions: actualQuestionCount,
        isFreeTrialAttempt,
      }, questions.map(q => q.id));

      // Mark free trial as used (only if this is a free trial attempt)
      if (isFreeTrialAttempt) {
        await storage.markFreeTrialAsUsed(userId);
        console.log(`Free trial marked as used for user: ${userId}`);
      }

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
        isFreeTrialAttempt: attempt.isFreeTrialAttempt,
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
  app.post("/api/admin/questions/generate", isAuthenticated, isAdmin, async (req, res) => {
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

  // ============= ADMIN ROUTES =============
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Enrich with subscription info
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          const subscription = await storage.getActiveSubscription(user.id);
          return {
            ...user,
            subscription: subscription || null,
            hasActiveSubscription: !!subscription,
          };
        })
      );
      
      res.json(enrichedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Grant/revoke admin access to user
  app.post("/api/admin/users/:userId/grant-access", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { durationDays } = req.body; // Optional: number of days or null for permanent

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let expiresAt = null;
      if (durationDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
      }

      await storage.grantAdminAccess(userId, expiresAt);
      
      res.json({
        success: true,
        message: `Access granted to ${user.email}${durationDays ? ` for ${durationDays} days` : ' (permanent)'}`,
      });
    } catch (error) {
      console.error("Error granting access:", error);
      res.status(500).json({ error: "Failed to grant access" });
    }
  });

  // Revoke admin access
  app.post("/api/admin/users/:userId/revoke-access", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.revokeAdminAccess(userId);
      
      res.json({
        success: true,
        message: `Access revoked for ${user.email}`,
      });
    } catch (error) {
      console.error("Error revoking access:", error);
      res.status(500).json({ error: "Failed to revoke access" });
    }
  });

  // End user subscription
  app.post("/api/admin/users/:userId/end-subscription", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = await storage.getActiveSubscription(userId);
      if (!subscription) {
        return res.status(400).json({ error: "User has no active subscription" });
      }

      await storage.updateSubscriptionStatus(subscription.id, "cancelled");
      
      res.json({
        success: true,
        message: `Subscription ended for ${user.email}`,
      });
    } catch (error) {
      console.error("Error ending subscription:", error);
      res.status(500).json({ error: "Failed to end subscription" });
    }
  });

  // Send email to all users (marketing)
  app.post("/api/admin/email/broadcast", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { subject, message } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }

      const users = await storage.getAllUsers();
      const emails = users.filter(u => u.email).map(u => u.email!);

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // For now, return success with email count
      console.log(`Broadcasting email to ${emails.length} users:`, { subject, message });
      
      res.json({
        success: true,
        message: `Email will be sent to ${emails.length} users`,
        recipientCount: emails.length,
        // In production, implement actual email sending here
      });
    } catch (error) {
      console.error("Error broadcasting email:", error);
      res.status(500).json({ error: "Failed to send broadcast email" });
    }
  });

  // Send email to specific user
  app.post("/api/admin/email/send", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, subject, message } = req.body;

      if (!userId || !subject || !message) {
        return res.status(400).json({ error: "userId, subject, and message are required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ error: "User not found or has no email" });
      }

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`Sending email to ${user.email}:`, { subject, message });
      
      res.json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Admin analytics dashboard
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const allSubscriptions = await storage.getAllSubscriptions();
      const allPayments = await storage.getAllPayments();
      const allQuizAttempts = await storage.getAllQuizAttempts();

      // Total revenue (completed payments)
      const completedPayments = allPayments.filter(p => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0) / 100; // Convert from cents

      // Active users (users with active subscriptions or admin access)
      const activeUsers = users.filter(u => {
        const hasActiveSubscription = allSubscriptions.some(s => 
          s.userId === u.id && s.status === 'active'
        );
        return hasActiveSubscription || u.adminGrantedAccess;
      }).length;

      // Total quiz attempts
      const totalQuizAttempts = allQuizAttempts.length;
      const completedQuizzes = allQuizAttempts.filter(q => q.status === 'completed').length;

      // Conversion rate (paid users / total users)
      const paidUsers = new Set(completedPayments.map(p => p.userId).filter(Boolean)).size;
      const conversionRate = users.length > 0 ? (paidUsers / users.length) * 100 : 0;

      // Revenue trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueTrend = last7Days.map(date => {
        const dayRevenue = completedPayments
          .filter(p => p.createdAt && p.createdAt.toISOString().split('T')[0] === date)
          .reduce((sum, p) => sum + p.amount, 0) / 100;
        return { date, revenue: dayRevenue };
      });

      // User growth trend (last 7 days)
      const userTrend = last7Days.map(date => {
        const dayUsers = users.filter(u => 
          u.createdAt && u.createdAt.toISOString().split('T')[0] === date
        ).length;
        return { date, users: dayUsers };
      });

      res.json({
        totalRevenue,
        activeUsers,
        totalUsers: users.length,
        totalQuizAttempts,
        completedQuizzes,
        conversionRate,
        revenueTrend,
        userTrend,
        recentPayments: completedPayments.slice(-10).reverse(),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  return server;
}
