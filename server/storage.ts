import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subscriptions,
  questions,
  quizAttempts,
  quizAnswers,
  payments,
  systemSettings,
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
  getQuestionsByCategory(category: string): Promise<Question[]>;
  getRandomQuestions(category: string, limit: number): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;
  getQuestionCountsByCategory(): Promise<{ category: string; count: number }[]>;
  getQuestionCountsByTopic(): Promise<{ category: string; subject: string; count: number }[]>;

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

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    const results = await db
      .select()
      .from(questions)
      .where(eq(questions.category, category));
    return results;
  }

  async getRandomQuestions(category: string, limit: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.category, category))
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

