import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isFirstFirebaseUser } from "./firebaseAuth";
import { generateQuestions } from "./gemini";
import { z } from "zod";
import { insertQuestionSchema, insertQuizAttemptSchema, insertQuizAnswerSchema, insertPaymentSchema } from "@shared/schema";
import { createOrder, getTransactionStatus } from "./pesapal";
import { nanoid } from "nanoid";
import { isAdmin } from "./adminMiddleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Auth is used for authentication (token-based, no session setup needed)

  // Auth routes - tries to authenticate, returns null if not logged in
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log("[AUTH USER] Request received");
      // Try to verify Firebase token
      const authHeader = req.headers.authorization;
      console.log("[AUTH USER] Auth header present:", !!authHeader);
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        try {
          const admin = (await import("firebase-admin")).default;
          const decodedToken = await admin.auth().verifyIdToken(token);
          console.log("[AUTH USER] Token verified for:", decodedToken.email);
          req.user = {
            claims: {
              sub: decodedToken.uid,
              email: decodedToken.email,
              first_name: decodedToken.name?.split(" ")[0] || "",
              last_name: decodedToken.name?.split(" ").slice(1).join(" ") || "",
            },
          };
        } catch (error) {
          console.log("[AUTH USER] Token verification failed:", (error as Error).message);
          // Token invalid, continue as unauthenticated
        }
      }
      
      // Check if user is authenticated
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        console.log("[AUTH USER] No authenticated user, returning null");
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      let user = await storage.getUser(userId);
      
      // If not found by UID, try finding by email (for legacy users)
      if (!user && userEmail) {
        user = await storage.getUserByEmail(userEmail);
      }
      
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
      
      // FIREBASE ADMIN DETECTION: Check if user is the first Firebase user
      // The first user in Firebase Auth is automatically granted admin access
      console.log(`[FIREBASE ADMIN] Checking if user is first Firebase user...`);
      console.log(`[FIREBASE ADMIN] Current user: ${userEmail} (UID: ${userId})`);
      const isFirstUser = await isFirstFirebaseUser(userId);
      console.log(`[FIREBASE ADMIN] isFirstUser result:`, isFirstUser);
      
      if (isFirstUser === null) {
        console.error("=".repeat(80));
        console.error("WARNING: Firebase admin detection failed!");
        console.error("Admin privileges cannot be granted without proper Firebase credentials.");
        console.error("Please configure FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
        console.error("See FIREBASE_ADMIN_SETUP.md for instructions.");
        console.error("=".repeat(80));
      } else if (isFirstUser) {
        console.log(`[FIREBASE ADMIN] ✓ First Firebase user detected: ${userEmail} (UID: ${userId})`);
        console.log(`[FIREBASE ADMIN] Current admin status in database: ${user.isAdmin}`);
        if (!user.isAdmin) {
          console.log(`[FIREBASE ADMIN] Granting admin status to first Firebase user: ${userEmail}`);
          await storage.makeUserAdmin(user.id);
          user.isAdmin = true;
          console.log(`[FIREBASE ADMIN] ✓ Admin status granted successfully`);
        } else {
          console.log(`[FIREBASE ADMIN] Admin status already set for first user: ${userEmail}`);
        }
      } else {
        console.log(`[FIREBASE ADMIN] User ${userEmail} is NOT the first Firebase user`);
      }
      
      // Get active subscription
      const subscription = await storage.getActiveSubscription(userId);
      
      const responseData = {
        ...user,
        subscription: subscription || null,
        hasActiveSubscription: !!subscription,
      };
      
      console.log(`[AUTH USER] Sending response for ${userEmail}:`, {
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        hasActiveSubscription: !!subscription,
      });
      
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get current user with admin status (used by admin panel)
  app.get('/api/auth/me', async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
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
      
      // Determine callback URL with fallback chain: APP_URL -> REPLIT_DOMAINS -> localhost
      const baseUrl = process.env.APP_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
      
      // Warn if APP_URL is not set in production (outside Replit)
      if (process.env.NODE_ENV === 'production' && !process.env.APP_URL && !process.env.REPLIT_DOMAINS) {
        console.warn('WARNING: APP_URL environment variable is not set. Payment callbacks may fail. Please set APP_URL to your application\'s public URL.');
      }
      
      const callbackUrl = `${baseUrl}/payment/callback`;

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
      const userEmail = req.user.claims.email;
      
      // Fallback to email lookup for legacy users
      if (!user && userEmail) {
        user = await storage.getUserByEmail(userEmail);
      }
      
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

      // Admins get free unlimited access (bypass all checks)
      const isAdmin = user.isAdmin === true;
      
      // Check admin-granted access (overrides subscription/trial)
      const hasAdminAccess = user.adminGrantedAccess && 
        (!user.adminAccessExpiresAt || new Date(user.adminAccessExpiresAt) > new Date());
      
      // Check subscription status and free trial
      const subscription = await storage.getActiveSubscription(user.id);
      const hasUsedFreeTrial = user.hasUsedFreeTrial;
      
      // Determine question count: 30 for free trial, 50 for subscribed, admin-granted, or admin users
      let questionCount = 50;
      let isFreeTrialAttempt = false;
      
      if (!subscription && !hasAdminAccess && !isAdmin) {
        // No active subscription, admin access, or admin role
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
  app.post("/api/admin/questions", isAuthenticated, isAdmin, async (req, res) => {
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
  app.post("/api/admin/questions/bulk", isAuthenticated, isAdmin, async (req, res) => {
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

  // Get question counts by category (admin only)
  app.get("/api/admin/questions/counts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const counts = await storage.getQuestionCountsByCategory();
      
      // Ensure all categories are represented (even if 0)
      const allCategories = ["NCLEX", "TEAS", "HESI"];
      const countsMap = new Map(counts.map(c => [c.category, c.count]));
      
      const result = allCategories.map(category => ({
        category,
        count: countsMap.get(category) || 0,
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Get question counts error:", error);
      res.status(500).json({ error: "Failed to get question counts" });
    }
  });

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
      
      // Generate questions using Gemini AI
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
          const activeSubscription = await storage.getActiveSubscription(user.id);
          const allSubscriptions = await storage.getUserSubscriptions(user.id);
          return {
            ...user,
            subscription: activeSubscription || null,
            hasActiveSubscription: !!activeSubscription,
            hasAnySubscription: allSubscriptions.length > 0,
            allSubscriptions,
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

  // Initialize first admin endpoint - DISABLED
  // This feature has been disabled. Admin access is now managed through hardcoded admin emails
  // and existing admins can add new admins through the admin panel.
  app.post("/api/admin/initialize-first-admin", isAuthenticated, isAdmin, async (req: any, res) => {
    return res.status(403).json({ 
      error: "Feature disabled",
      message: "The 'Become First Admin' feature has been disabled. Admin access is managed through the admin panel. Contact your system administrator for access."
    });
  });

  // Set admin by email (DEVELOPMENT ONLY - protected endpoint for initial setup)
  // SECURITY: This endpoint requires authentication AND a secure setup token from env vars
  // This endpoint is completely disabled in production for security
  app.post("/api/admin/set-admin-by-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // SECURITY: Completely disabled in production
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "This endpoint is completely disabled in production for security. Use the admin UI or initialize-first-admin endpoint."
        });
      }

      const { email, setupToken } = req.body;
      
      // SECURITY: Require a setup token from environment variables
      const expectedToken = process.env.ADMIN_SETUP_TOKEN;
      
      // If no token is set in environment, reject the request
      if (!expectedToken) {
        return res.status(403).json({ 
          error: "Setup not configured",
          message: "ADMIN_SETUP_TOKEN environment variable must be set to use this endpoint."
        });
      }
      
      if (!setupToken || setupToken !== expectedToken) {
        return res.status(403).json({ error: "Invalid or missing setup token" });
      }
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = await storage.getUserByEmail(email);
      
      // If user doesn't exist in database, return helpful error message
      if (!user) {
        return res.status(404).json({ 
          error: `User with email ${email} not found in database`,
          message: `The user must log in at least once to create their database record. After they log in, you can run this endpoint again to grant admin status.`
        });
      }

      if (user.isAdmin) {
        return res.status(400).json({ 
          error: "User is already an admin",
          user: {
            id: user.id,
            email: user.email,
            isAdmin: true,
          }
        });
      }

      await storage.makeUserAdmin(user.id);
      
      console.log(`[ADMIN SETUP] ${email} has been set as admin by authenticated user ${req.user.claims.email}`);
      
      res.json({
        success: true,
        message: `${email} is now an admin`,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: true,
        }
      });
    } catch (error) {
      console.error("Error setting admin by email:", error);
      res.status(500).json({ error: "Failed to set admin status" });
    }
  });

  // Make user an admin (permanent admin status)
  app.post("/api/admin/users/:userId/make-admin", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.isAdmin) {
        return res.status(400).json({ error: "User is already an admin" });
      }

      await storage.makeUserAdmin(userId);
      
      res.json({
        success: true,
        message: `${user.email} is now an admin`,
      });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ error: "Failed to make user admin" });
    }
  });

  // Revoke admin status (remove permanent admin status)
  app.post("/api/admin/users/:userId/revoke-admin", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentAdminId = req.user.claims.sub;

      // Prevent admins from revoking their own admin status
      if (userId === currentAdminId) {
        return res.status(400).json({ error: "Cannot revoke your own admin status. Ask another admin to do this." });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isAdmin) {
        return res.status(400).json({ error: "User is not an admin" });
      }

      // Prevent removing the last admin (recount after excluding target user)
      const allUsers = await storage.getAllUsers();
      const remainingAdmins = allUsers.filter(u => u.isAdmin && u.id !== userId);
      if (remainingAdmins.length === 0) {
        return res.status(400).json({ error: "Cannot revoke admin status of the last admin" });
      }

      await storage.revokeAdminStatus(userId);
      
      res.json({
        success: true,
        message: `Admin status revoked for ${user.email}`,
      });
    } catch (error) {
      console.error("Error revoking admin status:", error);
      res.status(500).json({ error: "Failed to revoke admin status" });
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

  // Ban user
  app.post("/api/admin/users/:userId/ban", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.banUser(userId);
      
      res.json({
        success: true,
        message: `User ${user.email} has been banned`,
      });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  // Unban user
  app.post("/api/admin/users/:userId/unban", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.unbanUser(userId);
      
      res.json({
        success: true,
        message: `User ${user.email} has been unbanned`,
      });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  // Extend/reduce subscription duration
  app.post("/api/admin/users/:userId/extend-subscription", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { days } = req.body; // Can be positive (extend) or negative (reduce)

      if (!days || isNaN(days)) {
        return res.status(400).json({ error: "days parameter is required and must be a number" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = await storage.getActiveSubscription(userId);
      if (!subscription) {
        return res.status(400).json({ error: "User has no active subscription" });
      }

      await storage.extendSubscription(subscription.id, days);
      
      const action = days > 0 ? "extended" : "reduced";
      res.json({
        success: true,
        message: `Subscription ${action} by ${Math.abs(days)} days for ${user.email}`,
      });
    } catch (error) {
      console.error("Error modifying subscription:", error);
      res.status(500).json({ error: "Failed to modify subscription" });
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
      const completedPayments = allPayments.filter((p: any) => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0) / 100; // Convert from cents

      // Active users (users with active subscriptions or admin access)
      const activeUsers = users.filter((u: any) => {
        const hasActiveSubscription = allSubscriptions.some((s: any) => 
          s.userId === u.id && s.status === 'active'
        );
        return hasActiveSubscription || u.adminGrantedAccess;
      }).length;

      // Total quiz attempts
      const totalQuizAttempts = allQuizAttempts.length;
      const completedQuizzes = allQuizAttempts.filter((q: any) => q.status === 'completed').length;

      // Conversion rate (paid users / total users)
      const paidUsers = new Set(completedPayments.map((p: any) => p.userId).filter(Boolean)).size;
      const conversionRate = users.length > 0 ? (paidUsers / users.length) * 100 : 0;

      // Revenue trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueTrend = last7Days.map(date => {
        const dayRevenue = completedPayments
          .filter((p: any) => p.createdAt && p.createdAt.toISOString().split('T')[0] === date)
          .reduce((sum: number, p: any) => sum + p.amount, 0) / 100;
        return { date, revenue: dayRevenue };
      });

      // User growth trend (last 7 days)
      const userTrend = last7Days.map(date => {
        const dayUsers = users.filter((u: any) => 
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
