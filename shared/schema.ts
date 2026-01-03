import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required by Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// System settings table (for storing app-wide configuration)
export const systemSettings = pgTable("system_settings", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User storage table (updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  nclexFreeTrialUsed: boolean("nclex_free_trial_used").default(false).notNull(),
  teasFreeTrialUsed: boolean("teas_free_trial_used").default(false).notNull(),
  hesiFreeTrialUsed: boolean("hesi_free_trial_used").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  adminGrantedAccess: boolean("admin_granted_access").default(false).notNull(),
  adminAccessExpiresAt: timestamp("admin_access_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(), // "weekly", "monthly", "3-month"
  status: text("status").notNull(), // "active", "cancelled", "expired"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paymentId: integer("payment_id").references(() => payments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderTrackingId: varchar("order_tracking_id").unique(),
  merchantReference: varchar("merchant_reference").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  plan: text("plan").notNull(), // "weekly", "monthly"
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull(), // "pending", "completed", "failed"
  paymentMethod: text("payment_method"),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  topic: text("topic"), // Specific topic within subject, e.g., "Advance Directives"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User performance tracking by topic for adaptive learning
export const userTopicPerformance = pgTable("user_topic_performance", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: text("category").notNull(), // "NCLEX", "TEAS", "HESI"
  subject: text("subject").notNull(), // e.g., "Management of Care"
  topic: text("topic"), // Specific topic (optional - null means subject-level tracking)
  totalAttempted: integer("total_attempted").default(0).notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  accuracy: integer("accuracy").default(0).notNull(), // Percentage 0-100
  lastAttemptedAt: timestamp("last_attempted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  status: text("status").notNull(), // "in_progress", "completed"
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  isFreeTrialAttempt: boolean("is_free_trial_attempt").default(false).notNull(),
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

// Background generation progress tracking
export const generationSubjectProgress = pgTable("generation_subject_progress", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // "NCLEX", "TEAS", "HESI"
  subject: text("subject").notNull(), // e.g., "Management of Care"
  targetCount: integer("target_count").notNull(), // How many questions we want for this subject
  generatedCount: integer("generated_count").default(0).notNull(), // How many we've generated so far
  status: text("status").default("pending").notNull(), // "pending", "running", "completed", "error"
  sortOrder: integer("sort_order").notNull(), // For rotation order
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  errorCount: integer("error_count").default(0).notNull(),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Generation logs for audit trail
export const generationLogs = pgTable("generation_logs", {
  id: serial("id").primaryKey(),
  subjectProgressId: integer("subject_progress_id").references(() => generationSubjectProgress.id),
  generationJobId: integer("generation_job_id").references(() => generationJobs.id),
  category: text("category").notNull(),
  subject: text("subject").notNull(),
  questionsRequested: integer("questions_requested").notNull(),
  questionsGenerated: integer("questions_generated").notNull(),
  questionsSaved: integer("questions_saved").notNull(),
  status: text("status").notNull(), // "success", "partial", "failed"
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Manual generation jobs - for admin batch generation requests
export const generationJobs = pgTable("generation_jobs", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // "NCLEX", "TEAS", "HESI"
  subject: text("subject"), // NEW: Main subject area (e.g., "English", "Math" for TEAS; "Pharmacology" for NCLEX) - used for Gemini context
  topic: text("topic").notNull(), // Specific topic/unit within subject (e.g., "Sentence Structure") - stored in question.topic
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  totalCount: integer("total_count").notNull(), // Total questions requested (5-1000)
  generatedCount: integer("generated_count").default(0).notNull(), // How many generated so far
  batchSize: integer("batch_size").default(5).notNull(), // Questions per API call
  sampleQuestion: text("sample_question"), // Sample question for quality guidance (required at API level)
  areasTocover: text("areas_to_cover"), // Specific areas/subtopics to cover (comma-separated or newline-separated)
  status: text("status").default("pending").notNull(), // "pending", "running", "completed", "paused", "failed"
  errorCount: integer("error_count").default(0).notNull(),
  lastError: text("last_error"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Upsert user type (for Replit Auth)
export type UpsertUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  profileImageUrl: string | null;
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  nclexFreeTrialUsed: true,
  teasFreeTrialUsed: true,
  hesiFreeTrialUsed: true,
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

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGenerationSubjectProgressSchema = createInsertSchema(generationSubjectProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGenerationLogSchema = createInsertSchema(generationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertGenerationJobSchema = createInsertSchema(generationJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  generatedCount: true,
  errorCount: true,
  lastError: true,
  status: true,
});

export const insertUserTopicPerformanceSchema = createInsertSchema(userTopicPerformance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type GenerationSubjectProgress = typeof generationSubjectProgress.$inferSelect;
export type InsertGenerationSubjectProgress = z.infer<typeof insertGenerationSubjectProgressSchema>;

export type GenerationLog = typeof generationLogs.$inferSelect;
export type InsertGenerationLog = z.infer<typeof insertGenerationLogSchema>;

export type GenerationJob = typeof generationJobs.$inferSelect;
export type InsertGenerationJob = z.infer<typeof insertGenerationJobSchema>;

export type UserTopicPerformance = typeof userTopicPerformance.$inferSelect;
export type InsertUserTopicPerformance = z.infer<typeof insertUserTopicPerformanceSchema>;
