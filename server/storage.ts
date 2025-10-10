import { db } from "./db";
import { 
  students, 
  admins, 
  subjects, 
  attendance, 
  marks, 
  libraryBooks, 
  bookIssues,
  type Student,
  type Admin,
  type Subject,
  type Attendance,
  type Marks,
  type LibraryBook,
  type BookIssue,
  type InsertStudent,
  type InsertAdmin,
  type InsertSubject,
  type InsertAttendance,
  type InsertMarks,
  type InsertLibraryBook,
  type InsertBookIssue
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudentByRollNo(rollNo: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Admins
  getAdminByName(name: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getSubjectById(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Attendance
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAllAttendance(): Promise<Attendance[]>;
  createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendanceRecord: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Marks
  getMarksByStudent(studentId: number): Promise<Marks[]>;
  getAllMarks(): Promise<Marks[]>;
  createMarks(marksRecord: InsertMarks): Promise<Marks>;
  updateMarks(id: number, marksRecord: Partial<InsertMarks>): Promise<Marks | undefined>;
  deleteMarks(id: number): Promise<boolean>;

  // Library Books
  getAllLibraryBooks(): Promise<LibraryBook[]>;
  getLibraryBookById(id: number): Promise<LibraryBook | undefined>;
  createLibraryBook(book: InsertLibraryBook): Promise<LibraryBook>;
  updateLibraryBook(id: number, book: Partial<InsertLibraryBook>): Promise<LibraryBook | undefined>;
  deleteLibraryBook(id: number): Promise<boolean>;

  // Book Issues
  getBookIssuesByStudent(studentId: number): Promise<BookIssue[]>;
  getAllBookIssues(): Promise<BookIssue[]>;
  createBookIssue(issue: InsertBookIssue): Promise<BookIssue>;
  updateBookIssue(id: number, issue: Partial<InsertBookIssue>): Promise<BookIssue | undefined>;
  returnBook(id: number, returnDate: string): Promise<BookIssue | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudentByRollNo(rollNo: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.rollNo, rollNo));
    return result[0];
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db.update(students).set(student).where(eq(students.id, id)).returning();
    return result[0];
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  // Admins
  async getAdminByName(name: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.name, name));
    return result[0];
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(admin).returning();
    return result[0];
  }

  // Subjects
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
    const result = await db.select().from(subjects).where(eq(subjects.id, id));
    return result[0];
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(subjects).values(subject).returning();
    return result[0];
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const result = await db.update(subjects).set(subject).where(eq(subjects.id, id)).returning();
    return result[0];
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    return result.length > 0;
  }

  // Attendance
  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId)).orderBy(desc(attendance.date));
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance).orderBy(desc(attendance.date));
  }

  async createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values(attendanceRecord).returning();
    return result[0];
  }

  async updateAttendance(id: number, attendanceRecord: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const result = await db.update(attendance).set(attendanceRecord).where(eq(attendance.id, id)).returning();
    return result[0];
  }

  async deleteAttendance(id: number): Promise<boolean> {
    const result = await db.delete(attendance).where(eq(attendance.id, id)).returning();
    return result.length > 0;
  }

  // Marks
  async getMarksByStudent(studentId: number): Promise<Marks[]> {
    return await db.select().from(marks).where(eq(marks.studentId, studentId));
  }

  async getAllMarks(): Promise<Marks[]> {
    return await db.select().from(marks);
  }

  async createMarks(marksRecord: InsertMarks): Promise<Marks> {
    const result = await db.insert(marks).values(marksRecord).returning();
    return result[0];
  }

  async updateMarks(id: number, marksRecord: Partial<InsertMarks>): Promise<Marks | undefined> {
    const result = await db.update(marks).set(marksRecord).where(eq(marks.id, id)).returning();
    return result[0];
  }

  async deleteMarks(id: number): Promise<boolean> {
    const result = await db.delete(marks).where(eq(marks.id, id)).returning();
    return result.length > 0;
  }

  // Library Books
  async getAllLibraryBooks(): Promise<LibraryBook[]> {
    return await db.select().from(libraryBooks);
  }

  async getLibraryBookById(id: number): Promise<LibraryBook | undefined> {
    const result = await db.select().from(libraryBooks).where(eq(libraryBooks.id, id));
    return result[0];
  }

  async createLibraryBook(book: InsertLibraryBook): Promise<LibraryBook> {
    const result = await db.insert(libraryBooks).values(book).returning();
    return result[0];
  }

  async updateLibraryBook(id: number, book: Partial<InsertLibraryBook>): Promise<LibraryBook | undefined> {
    const result = await db.update(libraryBooks).set(book).where(eq(libraryBooks.id, id)).returning();
    return result[0];
  }

  async deleteLibraryBook(id: number): Promise<boolean> {
    const result = await db.delete(libraryBooks).where(eq(libraryBooks.id, id)).returning();
    return result.length > 0;
  }

  // Book Issues
  async getBookIssuesByStudent(studentId: number): Promise<BookIssue[]> {
    return await db.select().from(bookIssues).where(eq(bookIssues.studentId, studentId));
  }

  async getAllBookIssues(): Promise<BookIssue[]> {
    return await db.select().from(bookIssues);
  }

  async createBookIssue(issue: InsertBookIssue): Promise<BookIssue> {
    const result = await db.insert(bookIssues).values(issue).returning();
    return result[0];
  }

  async updateBookIssue(id: number, issue: Partial<InsertBookIssue>): Promise<BookIssue | undefined> {
    const result = await db.update(bookIssues).set(issue).where(eq(bookIssues.id, id)).returning();
    return result[0];
  }

  async returnBook(id: number, returnDate: string): Promise<BookIssue | undefined> {
    const result = await db.update(bookIssues)
      .set({ returnDate, status: 'returned' })
      .where(eq(bookIssues.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
