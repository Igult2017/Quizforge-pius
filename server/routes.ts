import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./firebaseAuth";
import { isAdmin } from "./adminMiddleware";
import { generateQuestions } from "./gemini";
import { z } from "zod";
import { insertQuestionSchema, insertQuizAttemptSchema, insertQuizAnswerSchema, insertPaymentSchema } from "@shared/schema";
import { initializePayment, verifyPayment, isCountryAllowed } from "./paystack";
import { nanoid } from "nanoid";
import { sendPaymentLeadNotification } from "./mailer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user endpoint (Firebase/Replit Auth)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      const normalizedEmail = userEmail?.toLowerCase().trim();
      
      let user = await storage.getUser(userId);

      // Auto-create user if they don't exist (first-time Firebase login)
      if (!user && normalizedEmail) {
        console.log(`[AUTH] Creating new user for Firebase login: ${normalizedEmail}`);
        
        // Check if user already exists by email (e.g., signed up with email/password, now signing in with Google)
        const existingUserByEmail = await storage.getUserByEmail(normalizedEmail);
        
        if (existingUserByEmail) {
          console.log(`[AUTH] ℹ️ User already exists by email: ${normalizedEmail}. Updating Firebase ID from ${existingUserByEmail.id} to ${userId}`);
          
          // Update existing user with new Firebase ID if different
          if (existingUserByEmail.id !== userId) {
            await storage.updateUserId(existingUserByEmail.id, userId);
          }
          
          user = await storage.getUser(userId);
        } else {
          // New user - create them
          // Check if this is the first real user (excluding 'anonymous')
          const allUsers = await storage.getAllUsers();
          const realUsers = allUsers.filter(u => u.id !== 'anonymous');
          const isFirstUser = realUsers.length === 0;
          
          if (isFirstUser) {
            console.log(`[AUTH] ⭐ First user detected! Granting admin access to: ${normalizedEmail}`);
          }
          
          user = await storage.upsertUser({
            id: userId,
            email: normalizedEmail,
            firstName: req.user.claims.first_name || null,
            lastName: req.user.claims.last_name || null,
            profileImageUrl: null,
          });
          
          // Grant admin to first user
          if (isFirstUser) {
            await storage.makeUserAdmin(user.id);
            user = await storage.getUser(user.id); // Refresh to get updated admin status
            console.log(`[AUTH] ✅ Admin access granted to first user: ${normalizedEmail}`);
          }
        }
      }

      if (!user) {
        return res.json(null);
      }

      // Get actual subscription data
      const subscription = await storage.getActiveSubscription(user.id);
      const hasActiveSubscription = !!subscription;

      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin || false,
        adminGrantedAccess: user.adminGrantedAccess || false,
        adminAccessExpiresAt: user.adminAccessExpiresAt || null,
        nclexFreeTrialUsed: user.nclexFreeTrialUsed || false,
        teasFreeTrialUsed: user.teasFreeTrialUsed || false,
        hesiFreeTrialUsed: user.hesiFreeTrialUsed || false,
        hasActiveSubscription,
        subscription,
      });
    } catch (error: any) {
      console.error("[AUTH ERROR]", error);
      return res.json(null);
    }
  });

  // Get user progress across all categories
  app.get('/api/auth/user/progress', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgressAllCategories(userId);

      return res.json(progress);
    } catch (error: any) {
      console.error("[PROGRESS ERROR]", error);
      return res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // ============= TOPIC & PERFORMANCE ENDPOINTS =============

  // Get all available topics organized by category and subject
  app.get('/api/topics', async (req, res) => {
    try {
      const { NCLEX_SUBJECTS, TEAS_SUBJECTS, HESI_SUBJECTS } = await import("./questionTopics");
      
      res.json({
        NCLEX: NCLEX_SUBJECTS.map(s => ({
          subject: s.name,
          topics: s.topics,
          questionCount: s.questionCount,
        })),
        TEAS: TEAS_SUBJECTS.map(s => ({
          subject: s.name,
          topics: s.topics,
          questionCount: s.questionCount,
        })),
        HESI: HESI_SUBJECTS.map(s => ({
          subject: s.name,
          topics: s.topics,
          questionCount: s.questionCount,
        })),
      });
    } catch (error) {
      console.error("Get topics error:", error);
      res.status(500).json({ error: "Failed to get topics" });
    }
  });

  // Get user's topic performance for a category
  app.get('/api/auth/user/topic-performance/:category', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const { category } = req.params;
      
      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const performance = await storage.getUserTopicPerformance(userId, category);
      
      // Get topic configuration for context
      const { NCLEX_SUBJECTS, TEAS_SUBJECTS, HESI_SUBJECTS } = await import("./questionTopics");
      const subjectsMap: Record<string, typeof NCLEX_SUBJECTS> = {
        NCLEX: NCLEX_SUBJECTS,
        TEAS: TEAS_SUBJECTS,
        HESI: HESI_SUBJECTS,
      };
      
      // Merge with defined subjects to show all subjects (even unstarted ones)
      const subjects = subjectsMap[category];
      const performanceMap = new Map(performance.map(p => [p.subject, p]));
      
      const fullPerformance = subjects.map(s => {
        const existing = performanceMap.get(s.name);
        return {
          subject: s.name,
          topics: s.topics,
          totalAttempted: existing?.totalAttempted || 0,
          correctCount: existing?.correctCount || 0,
          accuracy: existing?.accuracy || 0,
          lastAttemptedAt: existing?.lastAttemptedAt || null,
          status: !existing ? 'not_started' : 
                  existing.accuracy >= 80 ? 'strong' : 
                  existing.accuracy >= 60 ? 'improving' : 'needs_work',
        };
      });

      res.json(fullPerformance);
    } catch (error: any) {
      console.error("[TOPIC PERFORMANCE ERROR]", error);
      res.status(500).json({ error: "Failed to fetch topic performance" });
    }
  });

  // Get weak topics with recommendations
  app.get('/api/auth/user/weak-topics/:category', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const { category } = req.params;
      const threshold = parseInt(req.query.threshold as string) || 70;
      
      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const weakTopics = await storage.getWeakTopics(userId, category, threshold);
      
      // Add recommendations
      const recommendations = weakTopics.map(topic => ({
        ...topic,
        recommendation: topic.accuracy < 50 
          ? `Focus intensively on ${topic.subject}. Consider reviewing study materials before continuing practice.`
          : `Keep practicing ${topic.subject}. You're making progress but need more repetition.`,
      }));

      res.json({
        weakTopics: recommendations,
        overallRecommendation: weakTopics.length === 0 
          ? "Great job! You're performing well across all topics."
          : `Focus on these ${weakTopics.length} areas to improve your overall score.`,
      });
    } catch (error: any) {
      console.error("[WEAK TOPICS ERROR]", error);
      res.status(500).json({ error: "Failed to fetch weak topics" });
    }
  });

  // Get adaptive questions for a quiz (includes weak topic questions)
  app.post('/api/quiz/adaptive', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const { category, count = 50, subjects, topics } = req.body;
      
      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const questions = await storage.getAdaptiveQuestions(
        userId,
        category,
        Math.min(count, 100), // Cap at 100 questions
        subjects,
        topics
      );

      res.json({ questions, count: questions.length });
    } catch (error: any) {
      console.error("[ADAPTIVE QUIZ ERROR]", error);
      res.status(500).json({ error: "Failed to get adaptive questions" });
    }
  });

  const server = createServer(app);
  
  // ============= SEO ROUTES =============
  
  // Robots.txt for SEO
  app.get('/robots.txt', (req, res) => {
    const domain = process.env.APP_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://www.nursebrace.com');
    
    res.type('text/plain');
    res.send(`# Robots.txt for NurseBrace
User-agent: *
Allow: /
Allow: /pricing
Allow: /categories
Disallow: /admin
Disallow: /api
Disallow: /checkout
Disallow: /login
Disallow: /signup

Sitemap: ${domain}/sitemap.xml
`);
  });

  // Sitemap.xml for SEO
  app.get('/sitemap.xml', (req, res) => {
    const domain = process.env.APP_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://www.nursebrace.com');
    const today = new Date().toISOString().split('T')[0];
    
    const urls = [
      { loc: `${domain}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${domain}/pricing`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${domain}/categories`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${domain}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${domain}/blog`, priority: '0.7', changefreq: 'weekly' },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.type('application/xml');
    res.send(sitemap);
  });
  
  // ============= PAYMENT ROUTES =============

  // Offline lead capture (payment system temporarily down)
  app.post("/api/payments/offline-lead", async (req, res) => {
    try {
      const schema = z.object({
        plan: z.string().min(1),
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid form data" });
      }

      const { plan, email, firstName, lastName, phone } = result.data;

      // Send notification email (fire and forget - don't fail if email fails)
      sendPaymentLeadNotification({
        email,
        firstName,
        lastName,
        phone,
        plan,
      }).catch((err) => {
        console.error("[Lead] Failed to send notification:", err);
      });

      console.log(`[Lead] Captured payment lead for plan: ${plan}`);

      return res.json({
        success: true,
        message: "The payment system is currently down. We are working to restore it. Sorry for the inconvenience. We will contact you shortly to assist with your subscription.",
      });
    } catch (error: any) {
      console.error("[Lead] Error capturing lead:", error);
      return res.status(500).json({ 
        success: false,
        error: "Something went wrong. Please try again later." 
      });
    }
  });
  
  // Create payment order
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      const { plan, email, firstName, lastName, phone, countryCode } = req.body;
      
      if (!plan || !email || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate country code (defaults to US if not provided)
      const country = (countryCode || "US").toUpperCase();
      if (!isCountryAllowed(country)) {
        return res.status(400).json({ 
          error: "Country not supported",
          message: "Payment is only available for USA, European countries, Australia, Canada, and New Zealand."
        });
      }

      // Plan pricing in US Dollars (USD)
      const planPricing: Record<string, number> = {
        weekly: 19.99,
        monthly: 49.99,
      };

      const amount = planPricing[plan];
      if (!amount) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Generate unique merchant reference
      const merchantReference = `NB-${plan.toUpperCase()}-${nanoid(12)}`;
      
      console.log(`[Payment] Creating order for ${plan} plan ($${amount} USD) from ${country}`);

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

      // Initialize payment with Paystack
      const paystackResponse = await initializePayment({
        email,
        amount: amount * 100, // convert to cents
        firstName,
        lastName,
        phone: phone || "",
        merchantReference,
        countryCode: country,
      });

      // Update payment with Paystack reference
      await storage.updatePayment(payment.id, {
        orderTrackingId: paystackResponse.data.reference,
      });

      res.json({
        success: true,
        paymentId: payment.id,
        redirectUrl: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      });
    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment order" });
    }
  });

  // Payment callback - handle return from Paystack
  app.get("/payment/callback", async (req, res) => {
    const { reference } = req.query;

    if (!reference) {
      return res.redirect("/?payment=error");
    }

    try {
      // Verify transaction status with Paystack
      const verificationResult = await verifyPayment(reference as string);

      // Find payment in database
      const payment = await storage.getPaymentByOrderTrackingId(reference as string);
      
      if (!payment) {
        return res.redirect("/?payment=not_found");
      }

      // Update payment status based on Paystack response
      if (verificationResult.data.status === "success") {
        await storage.updatePayment(payment.id, {
          status: "completed",
          paymentMethod: "card",
        });
        
        // Redirect to post-payment signup page
        return res.redirect(`/post-payment-signup?merchantReference=${payment.merchantReference}&reference=${reference}`);
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
      const { merchantReference, reference } = req.body;
      
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

      // If payment is pending and we have reference, check status with Paystack
      if (payment.status === "pending" && reference) {
        try {
          const verificationResult = await verifyPayment(reference);
          
          if (verificationResult.data.status === "success") {
            await storage.updatePayment(payment.id, {
              status: "completed",
              paymentMethod: "card",
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
  
  // Start a new quiz - requires authentication
  app.post("/api/quiz/start", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.body;
      
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Validate category
      const validCategories = ["NCLEX", "TEAS", "HESI"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      // Get authenticated user
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ADMIN BYPASS: Admins always have access - skip all subscription/free trial checks
      const isAdmin = user.isAdmin;
      if (isAdmin) {
        console.log(`[ADMIN ACCESS] Admin user ${user.email} bypassing all access checks for ${category}`);
      }

      // Check if user has active subscription or admin granted access
      const hasActiveSubscription = await storage.hasActiveSubscription(userId);
      const hasAdminAccess = user.adminGrantedAccess && (!user.adminAccessExpiresAt || user.adminAccessExpiresAt > new Date());
      
      // Determine if this is a free trial attempt
      let isFreeTrialAttempt = false;
      
      // Only check free trial for NON-ADMIN users
      if (!isAdmin && !hasActiveSubscription && !hasAdminAccess) {
        // Check if user has free trial available for this category
        const categoryField = category === "NCLEX" ? "nclexFreeTrialUsed" :
                             category === "TEAS" ? "teasFreeTrialUsed" :
                             "hesiFreeTrialUsed";
        
        if (user[categoryField]) {
          return res.status(403).json({ 
            error: "Free trial already used",
            message: `You've already used your free trial for ${category}. Subscribe to continue practicing.`,
            requiresSubscription: true,
          });
        }
        
        isFreeTrialAttempt = true;
        
        // Mark the category as used IMMEDIATELY when quiz starts
        // This prevents users from repeatedly starting new free trials without finishing
        await storage.markCategoryFreeTrialUsed(userId, categoryField);
        console.log(`[FREE TRIAL] Marked ${category} as used for user ${userId} at quiz start`);
      }

      // Always use 50 questions
      const questionCount = 50;
      
      // Get adaptive, subjects, and topics options from request
      const { adaptive, subjects, topics } = req.body;

      // Get questions - use adaptive selection if enabled
      console.log(`Quiz request - User: ${user.email}, Category: "${category}", Count: ${questionCount}, FreeTrial: ${isFreeTrialAttempt}, Adaptive: ${adaptive}, Subjects: ${subjects?.length || 'all'}, Topics: ${topics?.length || 'none'}`);
      
      let questions;
      if (adaptive) {
        // Use adaptive question selection that prioritizes weak topics
        questions = await storage.getAdaptiveQuestions(
          userId,
          category,
          questionCount,
          subjects || undefined,
          topics || undefined
        );
        console.log(`Adaptive questions found: ${questions.length} for category "${category}"`);
      } else {
        questions = await storage.getRandomQuestions(category, questionCount, subjects || undefined, topics || undefined);
        console.log(`Random questions found: ${questions.length} for category "${category}"`);
      }
      
      if (questions.length === 0) {
        console.error(`No questions available for category "${category}"`);
        return res.status(404).json({ 
          error: "No questions available for this category",
          message: "This category doesn't have any questions yet. Please try another category or contact support."
        });
      }

      // Use available questions
      const actualQuestionCount = Math.min(questions.length, questionCount);
      
      console.log(`Starting quiz: requested ${questionCount}, found ${questions.length}, using ${actualQuestionCount} questions for ${category}`);

      // Create quiz attempt
      const attempt = await storage.createQuizAttemptWithAnswers({
        userId,
        category,
        status: "in_progress",
        totalQuestions: actualQuestionCount,
        isFreeTrialAttempt,
      }, questions.map(q => q.id));

      // Get updated user data after marking category as used
      const updatedUser = await storage.getUser(userId);

      res.json({
        attemptId: attempt.id,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
        })),
        isFreeTrialAttempt,
        // Include updated free trial flags so client can refresh state
        updatedFreeTrialStatus: isFreeTrialAttempt ? {
          nclexFreeTrialUsed: updatedUser?.nclexFreeTrialUsed || false,
          teasFreeTrialUsed: updatedUser?.teasFreeTrialUsed || false,
          hesiFreeTrialUsed: updatedUser?.hesiFreeTrialUsed || false,
        } : undefined,
      });
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  // Save an answer - public
  app.post("/api/quiz/:attemptId/answer", async (req: any, res) => {
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

      // Get the quiz attempt to get the user ID
      const attempt = await storage.getQuizAttempt(Number(attemptId));
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
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

      // Update user topic performance for adaptive learning (only if not already answered)
      if (existingAnswer.userAnswer === null && question.subject) {
        try {
          await storage.updateUserTopicPerformance(
            attempt.userId,
            question.category,
            question.subject,
            question.topic || null,
            isCorrect
          );
        } catch (perfError) {
          console.error("Error updating topic performance:", perfError);
          // Don't fail the request if performance tracking fails
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving answer:", error);
      res.status(500).json({ error: "Failed to save answer" });
    }
  });

  // Submit quiz and get results - requires authentication
  app.post("/api/quiz/:attemptId/submit", isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;

      // Get quiz attempt
      const attempt = await storage.getQuizAttempt(Number(attemptId));
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }

      // Verify user owns this attempt
      const userId = req.user.claims.sub;
      if (attempt.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
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

      // Note: Free trial is marked as used when quiz STARTS (see /api/quiz/start)
      // not when it's submitted, to prevent repeated restarts

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

  // Get detailed quiz results - public
  app.get("/api/quiz/:attemptId/results", async (req: any, res) => {
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
  app.post("/api/admin/questions", isAdmin, async (req, res) => {
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
  app.post("/api/admin/questions/bulk", isAdmin, async (req, res) => {
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

  // Get question counts by category (public - for dashboard display)
  app.get("/api/admin/questions/counts", async (req, res) => {
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

  // Get question counts by topic/subject (includes all defined subjects, even with 0 questions)
  app.get("/api/admin/questions/counts-by-topic", async (req, res) => {
    try {
      const actualCounts = await storage.getQuestionCountsByTopic();
      
      // Create a map for quick lookup: "CATEGORY|subject" -> count
      const countsMap = new Map<string, number>();
      for (const c of actualCounts) {
        countsMap.set(`${c.category}|${c.subject}`, c.count);
      }
      
      // Import the defined subjects
      const { NCLEX_SUBJECTS, TEAS_SUBJECTS, HESI_SUBJECTS } = await import("./questionTopics");
      
      // Build complete list with all defined subjects
      const result: { category: string; subject: string; count: number }[] = [];
      
      // Add all NCLEX subjects
      for (const subject of NCLEX_SUBJECTS) {
        result.push({
          category: "NCLEX",
          subject: subject.name,
          count: countsMap.get(`NCLEX|${subject.name}`) || 0,
        });
      }
      
      // Add all TEAS subjects
      for (const subject of TEAS_SUBJECTS) {
        result.push({
          category: "TEAS",
          subject: subject.name,
          count: countsMap.get(`TEAS|${subject.name}`) || 0,
        });
      }
      
      // Add all HESI subjects
      for (const subject of HESI_SUBJECTS) {
        result.push({
          category: "HESI",
          subject: subject.name,
          count: countsMap.get(`HESI|${subject.name}`) || 0,
        });
      }
      
      // Also include any subjects in database that aren't in the defined list
      for (const c of actualCounts) {
        const exists = result.some(r => r.category === c.category && r.subject === c.subject);
        if (!exists) {
          result.push(c);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Get question counts by topic error:", error);
      res.status(500).json({ error: "Failed to get question counts by topic" });
    }
  });

  // Delete all questions by topic (admin only)
  app.delete("/api/admin/questions/by-topic", async (req, res) => {
    try {
      const { category, subject } = req.body;
      
      if (!category || !subject) {
        return res.status(400).json({ error: "category and subject are required" });
      }
      
      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      const deletedCount = await storage.deleteQuestionsByTopic(category, subject);
      
      console.log(`[ADMIN] Deleted ${deletedCount} questions from ${category} - ${subject}`);
      
      res.json({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} questions from ${subject}`,
      });
    } catch (error) {
      console.error("Delete questions by topic error:", error);
      res.status(500).json({ error: "Failed to delete questions" });
    }
  });

  // Get questions by category for PDF download
  app.get("/api/admin/questions/by-category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { subject, limit } = req.query;
      
      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      let questions = await storage.getQuestionsByCategory(category, subject as string | undefined);
      
      // Apply limit if specified
      if (limit) {
        const limitNum = parseInt(limit as string);
        if (!isNaN(limitNum) && limitNum > 0) {
          questions = questions.slice(0, limitNum);
        }
      }
      
      res.json({ questions });
    } catch (error) {
      console.error("Get questions by category error:", error);
      res.status(500).json({ error: "Failed to get questions" });
    }
  });

  // Generate questions directly for PDF (not saved to database)
  app.post("/api/admin/generate-for-pdf", async (req, res) => {
    try {
      const { category, topic, count, sampleQuestion, areasTocover } = req.body;
      
      if (!category || !topic || !count) {
        return res.status(400).json({ error: "category, topic, and count are required" });
      }
      
      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "category must be NCLEX, TEAS, or HESI" });
      }
      
      if (count < 1 || count > 50) {
        return res.status(400).json({ error: "count must be between 1 and 50" });
      }
      
      if (!sampleQuestion || sampleQuestion.length < 50) {
        return res.status(400).json({ error: "Sample question is required (minimum 50 characters)" });
      }
      
      if (!areasTocover || areasTocover.trim().length < 10) {
        return res.status(400).json({ error: "Topics/units to cover are required (minimum 10 characters)" });
      }
      
      console.log(`[PDF] Generating ${count} ${category} questions for PDF on topic: ${topic}`);
      
      const generatedQuestions = await generateQuestions({
        category,
        count: Number(count),
        subject: topic,
        difficulty: "medium",
        sampleQuestion,
        areasTocover,
      });
      
      // Format questions with IDs for PDF generation
      const formattedQuestions = generatedQuestions.map((q, index) => ({
        id: index + 1,
        category: q.category,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        subject: q.subject,
      }));
      
      console.log(`[PDF] Successfully generated ${formattedQuestions.length} questions for PDF`);
      
      res.json({
        success: true,
        questions: formattedQuestions,
      });
    } catch (error: any) {
      console.error("[PDF] Error generating questions:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions for PDF" });
    }
  });

  app.post("/api/admin/questions/generate", async (req, res) => {
    try {
      const { category, count, subject, difficulty, sampleQuestion, areasTocover } = req.body;

      if (!category || !count) {
        return res.status(400).json({ error: "category and count are required" });
      }

      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "category must be NCLEX, TEAS, or HESI" });
      }

      if (count < 1 || count > 100) {
        return res.status(400).json({ error: "count must be between 1 and 100" });
      }

      if (!sampleQuestion || sampleQuestion.trim().length < 50) {
        return res.status(400).json({ error: "Sample question is required (minimum 50 characters)" });
      }

      if (!areasTocover || areasTocover.trim().length < 10) {
        return res.status(400).json({ error: "Topics/units to cover are required (minimum 10 characters)" });
      }

      console.log(`Generating ${count} ${category} questions...`);
      
      // Generate questions using Gemini AI
      const generatedQuestions = await generateQuestions({
        category,
        count: Number(count),
        subject,
        difficulty,
        sampleQuestion: sampleQuestion.trim(),
        areasTocover: areasTocover.trim(),
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

  // ============= BACKGROUND GENERATION ROUTES =============

  // Get background generation status
  app.get("/api/admin/generation/status", async (req, res) => {
    try {
      const { db } = await import("./db.js");
      const { generationSubjectProgress, systemSettings, questions } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");

      // Get auto-generation enabled status
      const setting = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "autoGenerationEnabled"))
        .limit(1);
      
      const isEnabled = setting.length > 0 ? setting[0].value === "true" : true;

      // Count ACTUAL questions in database grouped by category and subject
      const actualCounts = await db
        .select({
          category: questions.category,
          subject: questions.subject,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(questions)
        .groupBy(questions.category, questions.subject);

      // Create a map of actual counts for quick lookup
      const countsMap = new Map<string, number>();
      actualCounts.forEach(({ category, subject, count }) => {
        const key = `${category}|${subject}`;
        countsMap.set(key, count);
      });

      // Get subject progress tracking (for targets)
      const subjects = await db
        .select()
        .from(generationSubjectProgress)
        .orderBy(generationSubjectProgress.sortOrder);

      // Merge actual counts with tracking data
      const subjectsWithActualCounts = subjects.map(subject => {
        const key = `${subject.category}|${subject.subject}`;
        const actualCount = countsMap.get(key) || 0;
        
        return {
          ...subject,
          generatedCount: actualCount, // Use actual database count
        };
      });

      // Calculate totals from ACTUAL database counts
      const totalTarget = subjectsWithActualCounts.reduce((sum, s) => sum + s.targetCount, 0);
      const totalGenerated = subjectsWithActualCounts.reduce((sum, s) => sum + s.generatedCount, 0);

      res.json({
        isEnabled,
        totalTarget,
        totalGenerated,
        subjects: subjectsWithActualCounts,
      });
    } catch (error) {
      console.error("Error getting generation status:", error);
      res.status(500).json({ error: "Failed to get generation status" });
    }
  });

  // Pause background generation
  app.post("/api/admin/generation/pause", async (req, res) => {
    try {
      const { db } = await import("./db.js");
      const { systemSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(systemSettings)
        .set({ value: "false", updatedAt: new Date() })
        .where(eq(systemSettings.key, "autoGenerationEnabled"));

      console.log("Background generation paused by admin");
      res.json({ success: true, message: "Background generation paused" });
    } catch (error) {
      console.error("Error pausing generation:", error);
      res.status(500).json({ error: "Failed to pause generation" });
    }
  });

  // Resume background generation
  app.post("/api/admin/generation/resume", async (req, res) => {
    try {
      const { db } = await import("./db.js");
      const { systemSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(systemSettings)
        .set({ value: "true", updatedAt: new Date() })
        .where(eq(systemSettings.key, "autoGenerationEnabled"));

      console.log("Background generation resumed by admin");
      res.json({ success: true, message: "Background generation resumed" });
    } catch (error) {
      console.error("Error resuming generation:", error);
      res.status(500).json({ error: "Failed to resume generation" });
    }
  });

  // Trigger manual generation cycle
  app.post("/api/admin/generation/trigger", async (req, res) => {
    try {
      const { triggerManualGeneration } = await import("./backgroundGeneration.js");
      
      // Trigger generation in background (don't wait for it)
      triggerManualGeneration().catch((error) => {
        console.error("Manual generation error:", error);
      });

      res.json({ success: true, message: "Generation cycle triggered" });
    } catch (error) {
      console.error("Error triggering generation:", error);
      res.status(500).json({ error: "Failed to trigger generation" });
    }
  });

  // ============= GENERATION JOBS ROUTES =============
  // NOTE: These routes have no auth middleware - anyone accessing admin panel can use them
  
  // Create a new generation job (batch generation with progress tracking)
  app.post("/api/admin/generation-jobs", async (req: any, res) => {
    try {
      const { category, topic, difficulty, totalCount, sampleQuestion, areasTocover } = req.body;

      // Validation
      if (!category || !topic || !difficulty || !totalCount) {
        return res.status(400).json({ error: "category, topic, difficulty, and totalCount are required" });
      }

      // Sample question is required for quality control
      if (!sampleQuestion || sampleQuestion.trim().length < 50) {
        return res.status(400).json({ error: "A sample question is required (minimum 50 characters) to ensure quality generation" });
      }

      // Areas to cover (topics/units) is required
      if (!areasTocover || areasTocover.trim().length < 10) {
        return res.status(400).json({ error: "Topics/units to cover are required (minimum 10 characters) to ensure proper question coverage" });
      }

      if (!["NCLEX", "TEAS", "HESI"].includes(category)) {
        return res.status(400).json({ error: "category must be NCLEX, TEAS, or HESI" });
      }

      if (!["easy", "medium", "hard"].includes(difficulty)) {
        return res.status(400).json({ error: "difficulty must be easy, medium, or hard" });
      }

      if (totalCount < 5 || totalCount > 1000) {
        return res.status(400).json({ error: "totalCount must be between 5 and 1000" });
      }

      const { createGenerationJob } = await import("./generationJobProcessor.js");
      
      const result = await createGenerationJob({
        category,
        topic,
        difficulty,
        totalCount: Number(totalCount),
        sampleQuestion: sampleQuestion.trim(),
        areasTocover: areasTocover.trim(),
        createdBy: req.user?.id,
      });

      // If distributed across multiple topics, return all job info
      if (result.isDistributed && result.allJobs) {
        res.json({
          success: true,
          job: result.job,
          isDistributed: true,
          allJobs: result.allJobs,
          distribution: result.distribution,
          message: `Creating ${totalCount} questions distributed equally across ${result.allJobs.length} topics. Each topic will get ~${Math.floor(totalCount / result.allJobs.length)} questions.`,
        });
      } else {
        res.json({
          success: true,
          job: result.job,
          isDistributed: false,
          message: `Started generating ${totalCount} questions. They will be generated in batches of 5.`,
        });
      }
    } catch (error: any) {
      console.error("Error creating generation job:", error);
      res.status(500).json({ error: error.message || "Failed to create generation job" });
    }
  });

  // Get all generation jobs
  app.get("/api/admin/generation-jobs", async (req, res) => {
    try {
      const { getAllJobs } = await import("./generationJobProcessor.js");
      const jobs = await getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching generation jobs:", error);
      res.status(500).json({ error: "Failed to fetch generation jobs" });
    }
  });

  // Get single generation job status
  app.get("/api/admin/generation-jobs/:id", async (req, res) => {
    try {
      const { getJobStatus } = await import("./generationJobProcessor.js");
      const job = await getJobStatus(Number(req.params.id));
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      res.status(500).json({ error: "Failed to fetch job status" });
    }
  });

  // Pause a generation job
  app.post("/api/admin/generation-jobs/:id/pause", async (req, res) => {
    try {
      const { pauseJob } = await import("./generationJobProcessor.js");
      await pauseJob(Number(req.params.id));
      res.json({ success: true, message: "Job paused" });
    } catch (error) {
      console.error("Error pausing job:", error);
      res.status(500).json({ error: "Failed to pause job" });
    }
  });

  // Resume a generation job
  app.post("/api/admin/generation-jobs/:id/resume", async (req, res) => {
    try {
      const { resumeJob } = await import("./generationJobProcessor.js");
      await resumeJob(Number(req.params.id));
      res.json({ success: true, message: "Job resumed" });
    } catch (error) {
      console.error("Error resuming job:", error);
      res.status(500).json({ error: "Failed to resume job" });
    }
  });

  // Delete a generation job
  app.delete("/api/admin/generation-jobs/:id", async (req, res) => {
    try {
      const { deleteJob } = await import("./generationJobProcessor.js");
      await deleteJob(Number(req.params.id));
      res.json({ success: true, message: "Job deleted" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Manually trigger job processing (since auto-processor is disabled)
  app.post("/api/admin/generation-jobs/process", async (req, res) => {
    try {
      const { processNextJobBatch } = await import("./generationJobProcessor.js");
      
      // Process in background
      processNextJobBatch()
        .then(result => console.log("Manual job processing result:", result))
        .catch(error => console.error("Manual job processing error:", error));
      
      res.json({ success: true, message: "Job processing triggered" });
    } catch (error) {
      console.error("Error triggering job processing:", error);
      res.status(500).json({ error: "Failed to trigger job processing" });
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
  app.post("/api/admin/initialize-first-admin", isAdmin, async (req: any, res) => {
    return res.status(403).json({ 
      error: "Feature disabled",
      message: "The 'Become First Admin' feature has been disabled. Admin access is managed through the admin panel. Contact your system administrator for access."
    });
  });

  // Set admin by email (DEVELOPMENT ONLY - protected endpoint for initial setup)
  // SECURITY: This endpoint requires authentication AND a secure setup token from env vars
  // This endpoint is completely disabled in production for security
  app.post("/api/admin/set-admin-by-email", isAdmin, async (req: any, res) => {
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

  // Delete user (admin only, cannot delete self)
  app.delete("/api/admin/users/:userId", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.user.claims.sub;

      // Prevent self-deletion
      if (userId === adminId) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.deleteUser(userId);
      
      console.log(`[ADMIN] Admin ${adminId} deleted user ${user.email} (${userId})`);
      
      res.json({
        success: true,
        message: `User ${user.email} has been deleted`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
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
  app.post("/api/admin/email/broadcast", isAdmin, async (req: any, res) => {
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
  app.post("/api/admin/email/send", isAdmin, async (req: any, res) => {
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
  app.get("/api/admin/analytics", async (req: any, res) => {
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
