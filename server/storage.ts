import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, sql } from "drizzle-orm";
import {
  users,
  subscriptions,
  questions,
  quizAttempts,
  quizAnswers,
  type User,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type Question,
  type InsertQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type QuizAnswer,
  type InsertQuizAnswer,
} from "@shared/schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not set");
}

const client = neon(dbUrl);
const db = drizzle(client);

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getActiveSubscription(userId: number): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: number, status: string): Promise<void>;

  // Questions
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
  getRandomQuestions(category: string, limit: number): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;

  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: number): Promise<QuizAttempt | undefined>;
  updateQuizAttempt(id: number, data: Partial<QuizAttempt>): Promise<void>;
  getUserQuizAttempts(userId: number): Promise<QuizAttempt[]>;

  // Quiz Answers
  saveQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  getQuizAnswers(attemptId: number): Promise<QuizAnswer[]>;
  updateQuizAnswer(id: number, data: Partial<QuizAnswer>): Promise<void>;
}

export class PostgresStorage implements IStorage {
  // Users
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Subscriptions
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSub] = await db.insert(subscriptions).values(subscription).returning();
    return newSub;
  }

  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .orderBy(sql`${subscriptions.endDate} DESC`)
      .limit(1);
    return subscription;
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id));
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

  // Quiz Attempts
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
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

  async getUserQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(sql`${quizAttempts.startedAt} DESC`);
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
}

export const storage = new PostgresStorage();
