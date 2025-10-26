import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(), // "weekly", "monthly", "3-month"
  status: text("status").notNull(), // "active", "cancelled", "expired"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // "NCLEX", "TEAS", "HESI"
  question: text("question").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty"), // "easy", "medium", "hard"
  subject: text("subject"), // e.g., "Pharmacology", "Medical-Surgical"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  status: text("status").notNull(), // "in_progress", "completed"
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => quizAttempts.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  answeredAt: timestamp("answered_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  startedAt: true,
});

export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
