import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, date, serial, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  rollNo: varchar("roll_no", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  securityQuestion: text("security_question"),
  securityAnswer: text("security_answer"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockoutUntil: timestamp("lockout_until"),
  department: varchar("department", { length: 50 }).default('CSE'),
  branchId: integer("branch_id").references(() => branches.id),
  semester: integer("semester").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    deptIdx: index("student_dept_idx").on(table.department),
    semIdx: index("student_sem_idx").on(table.semester),
  };
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
}).extend({
  department: z.string().min(1, "Department is required"),
  branchId: z.number().optional(),
  semester: z.number().min(1).max(6),
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Admins table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('admin'), // 'admin' or 'super_admin'
  status: text("status").notNull().default('active'), // 'active' or 'inactive'
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
}).extend({
  email: z.string().email(),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  instructor: text("instructor"),
  totalMarks: integer("total_marks").notNull().default(20),
  department: varchar("department", { length: 50 }).default('CSE'),
  branchId: integer("branch_id").references(() => branches.id),
  semester: integer("semester").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
}).extend({
  department: z.string().min(1, "Department is required"),
  branchId: z.number().optional(),
  semester: z.number().min(1).max(6),
});

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Attendance table (month-wise tracking)
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  month: varchar("month", { length: 20 }).notNull(), // Format: "YYYY-MM" (e.g., "2025-01")
  totalDays: integer("total_days").notNull(),
  presentDays: integer("present_days").notNull(),
  percentage: real("percentage").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'Good' (≥80%), 'Average' (60-79%), 'Poor' (<60%)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    studentIdx: index("attendance_student_idx").on(table.studentId),
    subjectIdx: index("attendance_subject_idx").on(table.subjectId),
    monthIdx: index("attendance_month_idx").on(table.month),
  };
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
  percentage: true, // Auto-calculated
  status: true, // Auto-calculated based on percentage
}).extend({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Marks table
export const marks = pgTable("marks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  month: varchar("month", { length: 20 }).notNull(), // Format: "YYYY-MM" (e.g., "2025-01")
  testName: varchar("test_name", { length: 100 }).notNull(),
  marksObtained: real("marks_obtained").notNull(),
  totalMarks: real("total_marks").notNull(),
  percentage: real("percentage").notNull(),
  grade: varchar("grade", { length: 5 }).notNull(), // A+, A, B+, B, C, D, F
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    studentIdx: index("marks_student_idx").on(table.studentId),
    subjectIdx: index("marks_subject_idx").on(table.subjectId),
    monthIdx: index("marks_month_idx").on(table.month),
  };
});

export const insertMarksSchema = createInsertSchema(marks).omit({
  id: true,
  createdAt: true,
  percentage: true, // Auto-calculated
  grade: true, // Auto-calculated based on percentage
}).extend({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

export type InsertMarks = z.infer<typeof insertMarksSchema>;
export type Marks = typeof marks.$inferSelect;

// Library books table
export const libraryBooks = pgTable("library_books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  copiesAvailable: integer("copies_available").notNull().default(0),
  totalCopies: integer("total_copies").notNull().default(0),
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryBookSchema = createInsertSchema(libraryBooks).omit({
  id: true,
  createdAt: true,
}).extend({
  branchId: z.number().optional(),
});

export type InsertLibraryBook = z.infer<typeof insertLibraryBookSchema>;
export type LibraryBook = typeof libraryBooks.$inferSelect;

// Book issues table
export const bookIssues = pgTable("book_issues", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  bookId: integer("book_id").notNull().references(() => libraryBooks.id, { onDelete: 'cascade' }),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: varchar("status", { length: 20 }).notNull().default('issued'), // 'issued' or 'returned'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookIssueSchema = createInsertSchema(bookIssues).omit({
  id: true,
  createdAt: true,
});

export type InsertBookIssue = z.infer<typeof insertBookIssueSchema>;
export type BookIssue = typeof bookIssues.$inferSelect;

// Notices table
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default('normal'), // 'high', 'normal', 'low'
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
}).extend({
  branchId: z.number().optional(),
});

export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof notices.$inferSelect;

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  startYear: z.number().int().min(2000, "Invalid start year"),
  endYear: z.number().int().min(2000, "Invalid end year"),
});

export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  batchId: integer("batch_id").notNull().references(() => batches.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    batchIdx: index("branch_batch_idx").on(table.batchId),
  };
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

// Daily Attendance table (Calendar System)
export const dailyAttendance = pgTable("daily_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  date: date("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'present', 'absent'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    studentDateIdx: index("daily_att_student_date_idx").on(table.studentId, table.date),
    subjectDateIdx: index("daily_att_subject_date_idx").on(table.subjectId, table.date),
  };
});

export const insertDailyAttendanceSchema = createInsertSchema(dailyAttendance).omit({
  id: true,
  createdAt: true,
});

export type InsertDailyAttendance = z.infer<typeof insertDailyAttendanceSchema>;
export type DailyAttendance = typeof dailyAttendance.$inferSelect;

// Exams/Tests Definitions
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  totalMarks: real("total_marks").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    subjectIdx: index("exam_subject_idx").on(table.subjectId),
  };
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

// Exam Marks (Linked to Exams table)
export const examMarks = pgTable("exam_marks", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  marksObtained: real("marks_obtained").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    examStudentIdx: index("exam_marks_exam_student_idx").on(table.examId, table.studentId),
  };
});

export const insertExamMarksSchema = createInsertSchema(examMarks).omit({
  id: true,
  createdAt: true,
});

export type InsertExamMarks = z.infer<typeof insertExamMarksSchema>;
export type ExamMarks = typeof examMarks.$inferSelect;
