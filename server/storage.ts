import { db } from "./db";
import { 
  students, 
  admins, 
  subjects, 
  attendance, 
  marks, 
  libraryBooks, 
  bookIssues,
  notices,
  type Student,
  type Admin,
  type Subject,
  type Attendance,
  type Marks,
  type LibraryBook,
  type BookIssue,
  type Notice,
  type InsertStudent,
  type InsertAdmin,
  type InsertSubject,
  type InsertAttendance,
  type InsertMarks,
  type InsertLibraryBook,
  type InsertBookIssue,
  type InsertNotice
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

  // Notices
  getAllNotices(): Promise<Notice[]>;
  getNoticeById(id: number): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, notice: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<boolean>;
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
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId)).orderBy(desc(attendance.month));
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance).orderBy(desc(attendance.month));
  }

  async createAttendance(attendanceRecord: any): Promise<Attendance> {
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

  async createMarks(marksRecord: any): Promise<Marks> {
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

  async getBookIssueById(id: number): Promise<BookIssue | undefined> {
    const result = await db.select().from(bookIssues).where(eq(bookIssues.id, id));
    return result[0];
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

  async deleteBookIssue(id: number): Promise<boolean> {
    const result = await db.delete(bookIssues).where(eq(bookIssues.id, id)).returning();
    return result.length > 0;
  }

  // Transactional book issue operation with row locking
  async issueBookWithTransaction(issue: InsertBookIssue, bookId: number): Promise<BookIssue> {
    return await db.transaction(async (tx) => {
      // Lock the book row for update to prevent race conditions
      const [book] = await tx.select().from(libraryBooks).where(eq(libraryBooks.id, bookId)).for('update');
      
      if (!book) {
        throw new Error("Book not found");
      }
      
      if (book.copiesAvailable <= 0) {
        throw new Error("Book is not available");
      }
      
      // Create the issue record
      const [bookIssue] = await tx.insert(bookIssues).values(issue).returning();
      
      // Decrement book availability using locked row value
      await tx.update(libraryBooks)
        .set({ copiesAvailable: book.copiesAvailable - 1 })
        .where(eq(libraryBooks.id, bookId));
      
      return bookIssue;
    });
  }

  // Transactional book return operation with row locking
  async returnBookWithTransaction(issueId: number, returnDate: string, bookId: number): Promise<BookIssue> {
    return await db.transaction(async (tx) => {
      // Lock both rows for update to prevent race conditions
      const [book] = await tx.select().from(libraryBooks).where(eq(libraryBooks.id, bookId)).for('update');
      
      if (!book) {
        throw new Error("Book not found");
      }
      
      // Lock and validate issue status within transaction
      const [issue] = await tx.select().from(bookIssues).where(eq(bookIssues.id, issueId)).for('update');
      
      if (!issue) {
        throw new Error("Issue record not found");
      }
      
      if (issue.status === 'returned') {
        throw new Error("Book has already been returned");
      }
      
      // Update the issue record
      const [bookIssue] = await tx.update(bookIssues)
        .set({ returnDate, status: 'returned' })
        .where(eq(bookIssues.id, issueId))
        .returning();
      
      // Increment book availability using locked row value
      await tx.update(libraryBooks)
        .set({ copiesAvailable: book.copiesAvailable + 1 })
        .where(eq(libraryBooks.id, bookId));
      
      return bookIssue;
    });
  }

  // Notices
  async getAllNotices(): Promise<Notice[]> {
    return await db.select().from(notices).orderBy(desc(notices.createdAt));
  }

  async getNoticeById(id: number): Promise<Notice | undefined> {
    const result = await db.select().from(notices).where(eq(notices.id, id));
    return result[0];
  }

  async createNotice(notice: InsertNotice): Promise<Notice> {
    const result = await db.insert(notices).values(notice).returning();
    return result[0];
  }

  async updateNotice(id: number, notice: Partial<InsertNotice>): Promise<Notice | undefined> {
    const result = await db.update(notices).set(notice).where(eq(notices.id, id)).returning();
    return result[0];
  }

  async deleteNotice(id: number): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
