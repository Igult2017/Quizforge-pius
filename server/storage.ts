import { eq, and, or, sql, inArray, gte, lte, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subscriptions,
  questions,
  quizAttempts,
  quizAnswers,
  payments,
  systemSettings,
  userTopicPerformance,
  type User,
  type UpsertUser,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type Question,
  type InsertQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type QuizAnswer,
  type InsertQuizAnswer,
  type Payment,
  type InsertPayment,
  type UserTopicPerformance,
} from "@shared/schema";

export interface IStorage {
  // System Settings
  getSystemSetting(key: string): Promise<string | null>;
  setSystemSetting(key: string, value: string): Promise<void>;
  
  // Users (Replit Auth required methods)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserId(oldId: string, newId: string): Promise<void>;
  
  // Users (legacy methods)
  getUserByEmail(email: string): Promise<User | undefined>;
  markCategoryFreeTrialUsed(userId: string, categoryField: string): Promise<void>;
  hasActiveSubscription(userId: string): Promise<boolean>;
  
  // Admin user management
  getAllUsers(): Promise<User[]>;
  grantAdminAccess(userId: string, expiresAt: Date | null): Promise<void>;
  revokeAdminAccess(userId: string): Promise<void>;
  makeUserAdmin(userId: string): Promise<void>;
  revokeAdminStatus(userId: string): Promise<void>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  updateUser(userId: string, data: Partial<User>): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  // Subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  updateSubscriptionStatus(id: number, status: string): Promise<void>;
  extendSubscription(subscriptionId: number, days: number): Promise<void>;
  getAllSubscriptions(): Promise<Subscription[]>;

  // Questions
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  getQuestionsByCategory(category: string, subject?: string): Promise<Question[]>;
  getRandomQuestions(category: string, limit: number, subjects?: string[], topics?: string[]): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;
  getQuestionCountsByCategory(): Promise<{ category: string; count: number }[]>;
  getQuestionCountsByTopic(): Promise<{ category: string; subject: string; count: number }[]>;
  getDistinctSubjectsAndTopics(): Promise<{ category: string; subject: string | null; topic: string | null; count: number }[]>;
  deleteQuestionsByTopic(category: string, subject: string): Promise<number>;

  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  createQuizAttemptWithAnswers(attempt: InsertQuizAttempt, questionIds: number[]): Promise<QuizAttempt>;
  getQuizAttempt(id: number): Promise<QuizAttempt | undefined>;
  updateQuizAttempt(id: number, data: Partial<QuizAttempt>): Promise<void>;
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  getAllQuizAttempts(): Promise<QuizAttempt[]>;

  // Quiz Answers
  saveQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  
  // Progress Tracking
  getUserProgressByCategory(userId: string, category: string): Promise<{ answered: number; total: number; percentage: number }>;
  getUserProgressAllCategories(userId: string): Promise<Record<string, { answered: number; total: number; percentage: number }>>;
  getQuizAnswers(attemptId: number): Promise<QuizAnswer[]>;
  updateQuizAnswer(id: number, data: Partial<QuizAnswer>): Promise<void>;

  // User Topic Performance (Adaptive Learning)
  getUserTopicPerformance(userId: string, category: string): Promise<UserTopicPerformance[]>;
  updateUserTopicPerformance(userId: string, category: string, subject: string, topic: string | null, isCorrect: boolean): Promise<void>;
  getWeakTopics(userId: string, category: string, threshold?: number): Promise<UserTopicPerformance[]>;
  getAdaptiveQuestions(userId: string, category: string, count: number, subjects?: string[], topics?: string[]): Promise<Question[]>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentById(id: number): Promise<Payment | undefined>;
  getPaymentByOrderTrackingId(orderTrackingId: string): Promise<Payment | undefined>;
  getPaymentByMerchantReference(merchantReference: string): Promise<Payment | undefined>;
  updatePayment(id: number, data: Partial<Payment>): Promise<void>;
  getAllPayments(): Promise<Payment[]>;
}

export class PostgresStorage implements IStorage {
  // System Settings
  async getSystemSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting?.value || null;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  // Users (Replit Auth required methods)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserId(oldId: string, newId: string): Promise<void> {
    await db
      .update(users)
      .set({ id: newId, updatedAt: new Date() })
      .where(eq(users.id, oldId));
  }

  async markCategoryFreeTrialUsed(userId: string, categoryField: string): Promise<void> {
    // Update the specific category free trial field
    const updateData: any = { updatedAt: new Date() };
    updateData[categoryField] = true;
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    return subscription !== undefined;
  }

  // Admin user management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async grantAdminAccess(userId: string, expiresAt: Date | null): Promise<void> {
    await db
      .update(users)
      .set({ 
        adminGrantedAccess: true, 
        adminAccessExpiresAt: expiresAt,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async revokeAdminAccess(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        adminGrantedAccess: false, 
        adminAccessExpiresAt: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async makeUserAdmin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isAdmin: true,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async revokeAdminStatus(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isAdmin: false,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async banUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isBanned: true,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isBanned: false,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Get all quiz attempts for this user
    const userAttempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));
    
    const attemptIds = userAttempts.map(a => a.id);
    
    // Delete quiz answers first (foreign key constraint)
    if (attemptIds.length > 0) {
      await db.delete(quizAnswers).where(inArray(quizAnswers.attemptId, attemptIds));
    }
    
    // Delete quiz attempts
    await db.delete(quizAttempts).where(eq(quizAttempts.userId, userId));
    
    // Delete user topic performance
    await db.delete(userTopicPerformance).where(eq(userTopicPerformance.userId, userId));
    
    // Delete subscriptions
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    
    // Delete payments (keep for audit or delete based on requirements - deleting here as per user request)
    await db.delete(payments).where(eq(payments.userId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`[ADMIN] User ${userId} deleted with all related data`);
  }

  // Subscriptions
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSub] = await db.insert(subscriptions).values(subscription).returning();
    return newSub;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const now = new Date();
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          sql`${subscriptions.endDate} > ${now}`
        )
      )
      .orderBy(sql`${subscriptions.endDate} DESC`)
      .limit(1);
    return subscription;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(sql`${subscriptions.createdAt} DESC`);
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id));
  }

  async extendSubscription(subscriptionId: number, days: number): Promise<void> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId));
    
    if (subscription) {
      const currentEndDate = new Date(subscription.endDate);
      currentEndDate.setDate(currentEndDate.getDate() + days);
      
      await db
        .update(subscriptions)
        .set({ endDate: currentEndDate })
        .where(eq(subscriptions.id, subscriptionId));
    }
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(subscriptions.createdAt);
  }

  // Questions
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async createQuestions(questionsList: InsertQuestion[]): Promise<Question[]> {
    if (questionsList.length === 0) return [];
    const newQuestions = await db.insert(questions).values(questionsList).returning();
    return newQuestions;
  }

  async getQuestionsByCategory(category: string, subject?: string): Promise<Question[]> {
    if (subject) {
      const results = await db
        .select()
        .from(questions)
        .where(and(eq(questions.category, category), eq(questions.subject, subject)));
      return results;
    }
    const results = await db
      .select()
      .from(questions)
      .where(eq(questions.category, category));
    return results;
  }

  async getRandomQuestions(category: string, limit: number, subjects?: string[], topics?: string[]): Promise<Question[]> {
    // Parse topics parameter: format is "subject:topic" pairs
    const topicFilters: { subject: string; topic: string }[] = [];
    if (topics && topics.length > 0) {
      for (const topicStr of topics) {
        const [subject, topic] = topicStr.split(':');
        if (subject && topic) {
          topicFilters.push({ subject, topic });
        }
      }
    }

    console.log(`[getRandomQuestions] category=${category}, subjects=${JSON.stringify(subjects)}, topics=${JSON.stringify(topics)}, topicFilters=${JSON.stringify(topicFilters)}`);

    // Build query conditions
    const conditions = [eq(questions.category, category)];
    
    if (subjects && subjects.length > 0 && topicFilters.length > 0) {
      // Both fully selected subjects AND individual topics
      // Get questions from fully selected subjects OR specific topics
      const subjectConditions = inArray(questions.subject, subjects);
      const topicConditions = topicFilters.map(tf => 
        and(eq(questions.subject, tf.subject), eq(questions.topic, tf.topic))
      );
      conditions.push(or(subjectConditions, ...topicConditions)!);
    } else if (subjects && subjects.length > 0) {
      // Only fully selected subjects
      conditions.push(inArray(questions.subject, subjects));
    } else if (topicFilters.length > 0) {
      // Only individual topics selected
      const topicConditions = topicFilters.map(tf => 
        and(eq(questions.subject, tf.subject), eq(questions.topic, tf.topic))
      );
      if (topicConditions.length === 1) {
        conditions.push(topicConditions[0]!);
      } else {
        conditions.push(or(...topicConditions)!);
      }
    }
    // If neither subjects nor topics specified, use all questions in category

    return await db
      .select()
      .from(questions)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async getQuestionById(id: number): Promise<Question | undefined> {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return question;
  }

  async getQuestionCountsByCategory(): Promise<{ category: string; count: number }[]> {
    const results = await db
      .select({
        category: questions.category,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .groupBy(questions.category);
    
    return results;
  }

  async getQuestionCountsByTopic(): Promise<{ category: string; subject: string; count: number }[]> {
    const results = await db
      .select({
        category: questions.category,
        subject: questions.subject,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .groupBy(questions.category, questions.subject)
      .orderBy(questions.category, questions.subject);
    
    return results.map(r => ({
      category: r.category,
      subject: r.subject || "General",
      count: r.count,
    }));
  }

  async getDistinctSubjectsAndTopics(): Promise<{ category: string; subject: string | null; topic: string | null; count: number }[]> {
    const results = await db
      .select({
        category: questions.category,
        subject: questions.subject,
        topic: questions.topic,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .groupBy(questions.category, questions.subject, questions.topic)
      .orderBy(questions.category, questions.subject, questions.topic);
    
    return results;
  }

  async deleteQuestionsByTopic(category: string, subject: string): Promise<number> {
    // First, get the question IDs that will be deleted
    const questionsToDelete = await db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.category, category), eq(questions.subject, subject)));
    
    if (questionsToDelete.length === 0) {
      return 0;
    }
    
    const questionIds = questionsToDelete.map(q => q.id);
    
    // Delete related quiz answers first (to avoid foreign key constraint violation)
    await db
      .delete(quizAnswers)
      .where(inArray(quizAnswers.questionId, questionIds));
    
    // Now delete the questions
    const result = await db
      .delete(questions)
      .where(and(eq(questions.category, category), eq(questions.subject, subject)))
      .returning({ id: questions.id });
    
    return result.length;
  }

  // Quiz Attempts
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async createQuizAttemptWithAnswers(attempt: InsertQuizAttempt, questionIds: number[]): Promise<QuizAttempt> {
    // Create attempt
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();

    // Bulk create placeholder answers for all questions
    if (questionIds.length > 0) {
      const answers = questionIds.map(qId => ({
        attemptId: newAttempt.id,
        questionId: qId,
        userAnswer: null,
        isCorrect: null,
        answeredAt: null,
      }));
      
      await db.insert(quizAnswers).values(answers);
    }

    return newAttempt;
  }

  async getQuizAttempt(id: number): Promise<QuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, id));
    return attempt;
  }

  async updateQuizAttempt(id: number, data: Partial<QuizAttempt>): Promise<void> {
    await db
      .update(quizAttempts)
      .set(data)
      .where(eq(quizAttempts.id, id));
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(sql`${quizAttempts.startedAt} DESC`);
  }

  async getAllQuizAttempts(): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).orderBy(sql`${quizAttempts.startedAt} DESC`);
  }

  // Quiz Answers
  async saveQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer> {
    const [newAnswer] = await db.insert(quizAnswers).values(answer).returning();
    return newAnswer;
  }

  async getQuizAnswers(attemptId: number): Promise<QuizAnswer[]> {
    return await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.attemptId, attemptId));
  }

  async updateQuizAnswer(id: number, data: Partial<QuizAnswer>): Promise<void> {
    await db
      .update(quizAnswers)
      .set(data)
      .where(eq(quizAnswers.id, id));
  }

  // Progress Tracking
  async getUserProgressByCategory(userId: string, category: string): Promise<{ answered: number; total: number; percentage: number }> {
    // Import EXAM_CONFIGS to get total questions
    const { EXAM_CONFIGS } = await import("./questionTopics");
    const totalQuestions = EXAM_CONFIGS[category]?.totalQuestions || 0;

    // Count unique questions answered in this category across all attempts
    const result = await db
      .selectDistinct({ questionId: quizAnswers.questionId })
      .from(quizAnswers)
      .innerJoin(quizAttempts, eq(quizAnswers.attemptId, quizAttempts.id))
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.category, category),
          eq(quizAttempts.status, "completed")
        )
      );

    const answeredCount = result.length;
    const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return {
      answered: answeredCount,
      total: totalQuestions,
      percentage,
    };
  }

  async getUserProgressAllCategories(userId: string): Promise<Record<string, { answered: number; total: number; percentage: number }>> {
    const categories = ["NCLEX", "TEAS", "HESI"];
    const progress: Record<string, { answered: number; total: number; percentage: number }> = {};

    for (const category of categories) {
      progress[category] = await this.getUserProgressByCategory(userId, category);
    }

    return progress;
  }

  // User Topic Performance (Adaptive Learning)
  async getUserTopicPerformance(userId: string, category: string): Promise<UserTopicPerformance[]> {
    return await db
      .select()
      .from(userTopicPerformance)
      .where(and(
        eq(userTopicPerformance.userId, userId),
        eq(userTopicPerformance.category, category)
      ))
      .orderBy(desc(userTopicPerformance.totalAttempted));
  }

  async updateUserTopicPerformance(
    userId: string,
    category: string,
    subject: string,
    topic: string | null,
    isCorrect: boolean
  ): Promise<void> {
    // Try to find existing record
    const existing = await db
      .select()
      .from(userTopicPerformance)
      .where(and(
        eq(userTopicPerformance.userId, userId),
        eq(userTopicPerformance.category, category),
        eq(userTopicPerformance.subject, subject),
        topic ? eq(userTopicPerformance.topic, topic) : sql`${userTopicPerformance.topic} IS NULL`
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      const record = existing[0];
      const newTotal = record.totalAttempted + 1;
      const newCorrect = record.correctCount + (isCorrect ? 1 : 0);
      const newAccuracy = Math.round((newCorrect / newTotal) * 100);

      console.log(`[PERFORMANCE] Updating ${userId} for ${category}/${subject}/${topic}: Correct=${isCorrect}, NewAcc=${newAccuracy}%`);

      await db
        .update(userTopicPerformance)
        .set({
          totalAttempted: newTotal,
          correctCount: newCorrect,
          accuracy: newAccuracy,
          lastAttemptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userTopicPerformance.id, record.id));

      // Also update the parent subject-level record if this was a topic update
      if (topic) {
        // Use setImmediate or similar to avoid potential infinite recursion if logic changes,
        // though here it's safe as we pass null for topic.
        await this.updateUserTopicPerformance(userId, category, subject, null, isCorrect);
      }
    } else {
      // Create new record
      console.log(`[PERFORMANCE] Creating new record for ${userId} for ${category}/${subject}/${topic}: Correct=${isCorrect}`);
      await db.insert(userTopicPerformance).values({
        userId,
        category,
        subject,
        topic,
        totalAttempted: 1,
        correctCount: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
        lastAttemptedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Also ensure parent subject-level record exists/is updated if this was a topic update
      if (topic) {
        await this.updateUserTopicPerformance(userId, category, subject, null, isCorrect);
      }
    }
  }

  async getWeakTopics(userId: string, category: string, threshold: number = 70): Promise<UserTopicPerformance[]> {
    // Get topics where accuracy is below threshold and user has attempted at least 5 questions
    return await db
      .select()
      .from(userTopicPerformance)
      .where(and(
        eq(userTopicPerformance.userId, userId),
        eq(userTopicPerformance.category, category),
        lte(userTopicPerformance.accuracy, threshold),
        gte(userTopicPerformance.totalAttempted, 5)
      ))
      .orderBy(userTopicPerformance.accuracy);
  }

  async getAdaptiveQuestions(
    userId: string,
    category: string,
    count: number,
    subjects?: string[],
    topics?: string[]
  ): Promise<Question[]> {
    // Parse topics parameter: format is "subject:topic" pairs
    const topicFilters: { subject: string; topic: string }[] = [];
    if (topics && topics.length > 0) {
      for (const topicStr of topics) {
        const [subject, topic] = topicStr.split(':');
        if (subject && topic) {
          topicFilters.push({ subject, topic });
        }
      }
    }

    // Get weak topics for this user
    const weakTopics = await this.getWeakTopics(userId, category);
    
    // Get questions from weak topics first (at least 5 per weak topic if available)
    const weakTopicQuestions: Question[] = [];
    const questionsPerWeakTopic = Math.min(5, Math.floor(count * 0.3 / Math.max(weakTopics.length, 1)));
    
    for (const weakTopic of weakTopics) {
      if (weakTopicQuestions.length >= count * 0.3) break; // Don't use more than 30% for weak topics
      
      const topicQuestions = await db
        .select()
        .from(questions)
        .where(and(
          eq(questions.category, category),
          eq(questions.subject, weakTopic.subject)
        ))
        .orderBy(sql`RANDOM()`)
        .limit(questionsPerWeakTopic);
      
      weakTopicQuestions.push(...topicQuestions);
    }
    
    // Get remaining questions from requested subjects/topics
    const remainingCount = count - weakTopicQuestions.length;
    const weakQuestionIds = weakTopicQuestions.map(q => q.id);
    
    // Build filter conditions for remaining questions
    const filterConditions = [
      eq(questions.category, category),
      weakQuestionIds.length > 0 ? sql`${questions.id} NOT IN (${sql.join(weakQuestionIds.map(id => sql`${id}`), sql`, `)})` : sql`1=1`
    ];

    if (subjects && subjects.length > 0 && topicFilters.length > 0) {
      // Both fully selected subjects AND individual topics
      const subjectConditions = inArray(questions.subject, subjects);
      const topicConditions = topicFilters.map(tf => 
        and(eq(questions.subject, tf.subject), eq(questions.topic, tf.topic))
      );
      filterConditions.push(or(subjectConditions, ...topicConditions)!);
    } else if (subjects && subjects.length > 0) {
      filterConditions.push(inArray(questions.subject, subjects));
    } else if (topicFilters.length > 0) {
      const topicConditions = topicFilters.map(tf => 
        and(eq(questions.subject, tf.subject), eq(questions.topic, tf.topic))
      );
      if (topicConditions.length === 1) {
        filterConditions.push(topicConditions[0]!);
      } else {
        filterConditions.push(or(...topicConditions)!);
      }
    }

    const remainingQuestions = await db
      .select()
      .from(questions)
      .where(and(...filterConditions))
      .orderBy(sql`RANDOM()`)
      .limit(remainingCount);
    
    // Combine and shuffle
    const allQuestions = [...weakTopicQuestions, ...remainingQuestions];
    
    // Shuffle the combined array
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }
    
    return allQuestions.slice(0, count);
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentById(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByOrderTrackingId(orderTrackingId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderTrackingId, orderTrackingId));
    return payment;
  }

  async getPaymentByMerchantReference(merchantReference: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.merchantReference, merchantReference));
    return payment;
  }

  async updatePayment(id: number, data: Partial<Payment>): Promise<void> {
    await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(payments.createdAt);
  }
}

export const storage = new PostgresStorage();

