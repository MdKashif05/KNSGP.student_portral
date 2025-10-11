import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, date, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  rollNo: varchar("roll_no", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Admins table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  instructor: text("instructor"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
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
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
  percentage: true, // Auto-calculated
  status: true, // Auto-calculated based on percentage
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
});

export const insertMarksSchema = createInsertSchema(marks).omit({
  id: true,
  createdAt: true,
  percentage: true, // Auto-calculated
  grade: true, // Auto-calculated based on percentage
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryBookSchema = createInsertSchema(libraryBooks).omit({
  id: true,
  createdAt: true,
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
});

export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof notices.$inferSelect;
