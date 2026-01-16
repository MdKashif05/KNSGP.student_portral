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
  auditLogs,
  batches,
  branches,
  type Student,
  type Admin,
  type Subject,
  type Attendance,
  type Marks,
  type LibraryBook,
  type BookIssue,
  type Notice,
  type AuditLog,
  type InsertStudent,
  type InsertAdmin,
  type InsertSubject,
  type InsertAttendance,
  type InsertMarks,
  type InsertLibraryBook,
  type InsertBookIssue,
  type InsertNotice,
  type InsertAuditLog,
  type Batch,
  type InsertBatch,
  type Branch,
  type InsertBranch
} from "@shared/schema";
import { eq, and, desc, asc, sql, inArray, ilike, or, isNull } from "drizzle-orm";

export interface IStorage {
  getStudentStats(studentIds?: number[]): Promise<{
    attendanceStats: { studentId: number; avgPercentage: number }[];
    marksStats: { studentId: number; avgPercentage: number }[];
    issueStats: { studentId: number; count: number }[];
  }>;
  // Students
  getStudentByRollNo(rollNo: string): Promise<Student | undefined>;
  getAllStudents(limit?: number, offset?: number, department?: string): Promise<{ data: Student[], total: number }>;
  getStudentsByIds(ids: number[]): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Admins
  getAdminByName(name: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined>;
  deleteAdmin(id: number): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAllAuditLogs(): Promise<AuditLog[]>;

  // Subjects
  getAllSubjects(department?: string): Promise<Subject[]>;
  getSubjectById(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Attendance
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAllAttendance(limit?: number, offset?: number, search?: string, department?: string): Promise<{ data: (Attendance & { student: Student })[], total: number }>;
  createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance>;
  createAttendanceBatch(attendanceRecords: (InsertAttendance & { percentage: number; status: string })[]): Promise<Attendance[]>;
  updateAttendance(id: number, attendanceRecord: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Marks
  getMarksByStudent(studentId: number): Promise<Marks[]>;
  getAllMarks(limit?: number, offset?: number, search?: string, department?: string): Promise<{ data: (Marks & { student: Student })[], total: number }>;
  createMarks(marksRecord: InsertMarks): Promise<Marks>;
  createMarksBatch(marksRecords: (InsertMarks & { percentage: number; grade: string })[]): Promise<Marks[]>;
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

  // Analytics
  getGlobalStats(branchId?: number): Promise<{
    totalStudents: number;
    avgAttendance: number;
    avgMarks: number;
    totalBooksIssued: number;
  }>;

  // Batches
  getAllBatches(): Promise<Batch[]>;
  getBatchById(id: number): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, batch: Partial<InsertBatch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<boolean>;

  // Branches
  getBranchesByBatch(batchId: number): Promise<Branch[]>;
  getBranchById(id: number): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudentStats(studentIds?: number[]) {
    const attendanceQuery = db.select({
      studentId: attendance.studentId,
      avgPercentage: sql<number>`avg(${attendance.percentage})`
    })
    .from(attendance)
    .groupBy(attendance.studentId);
    
    if (studentIds && studentIds.length > 0) {
      attendanceQuery.where(inArray(attendance.studentId, studentIds));
    }
    
    const attendanceStats = await attendanceQuery;

    const marksQuery = db.select({
      studentId: marks.studentId,
      avgPercentage: sql<number>`avg(${marks.percentage})`
    })
    .from(marks)
    .groupBy(marks.studentId);
    
    if (studentIds && studentIds.length > 0) {
      marksQuery.where(inArray(marks.studentId, studentIds));
    }
    
    const marksStats = await marksQuery;

    const issueQuery = db.select({
      studentId: bookIssues.studentId,
      count: sql<number>`count(*)`
    })
    .from(bookIssues)
    .groupBy(bookIssues.studentId);
    
    if (studentIds && studentIds.length > 0) {
      issueQuery.where(and(eq(bookIssues.status, 'issued'), inArray(bookIssues.studentId, studentIds)));
    } else {
      issueQuery.where(eq(bookIssues.status, 'issued'));
    }

    const issueStats = await issueQuery;

    return { attendanceStats, marksStats, issueStats };
  }

  async getStudentByRollNo(rollNo: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.rollNo, rollNo));
    return result[0];
  }

  async getAllStudents(limit?: number, offset?: number, department?: string, branchId?: number): Promise<{ data: Student[], total: number }> {
    const query = db.select().from(students).orderBy(asc(students.rollNo));
    if (branchId) {
      query.where(eq(students.branchId, branchId));
    } else if (department) {
      // Fallback for backward compatibility if needed, or remove if strictly branchId
      query.where(eq(students.department, department));
    }
    
    if (limit !== undefined && offset !== undefined) {
      query.limit(limit).offset(offset);
    }
    const data = await query;
    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(students);
    if (branchId) {
      totalQuery.where(eq(students.branchId, branchId));
    } else if (department) {
      totalQuery.where(eq(students.department, department));
    }
    const totalResult = await totalQuery;
    return { data, total: Number(totalResult[0].count) };
  }

  async getStudentsByIds(ids: number[]): Promise<Student[]> {
    if (ids.length === 0) return [];
    return await db.select().from(students).where(inArray(students.id, ids));
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
    return await db.transaction(async (tx) => {
      // 1. Log the deletion
      const [student] = await tx.select().from(students).where(eq(students.id, id));
      await tx.insert(auditLogs).values({
        action: "DELETE_STUDENT",
        details: `Deleted student: ${student?.name} (ID: ${id}, RollNo: ${student?.rollNo})`,
        ipAddress: "SYSTEM"
      });

      // 2. Delete the student (Cascading will handle related records automatically)
      const result = await tx.delete(students).where(eq(students.id, id)).returning();
      return result.length > 0;
    });
  }

  // Admins
  async getAdminByName(name: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.name, name));
    return result[0];
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.id, id));
    return result[0];
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.email, email));
    return result[0];
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins).orderBy(asc(admins.id));
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(admin).returning();
    return result[0];
  }

  async updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined> {
    const result = await db.update(admins).set(admin).where(eq(admins.id, id)).returning();
    return result[0];
  }

  async deleteAdmin(id: number): Promise<boolean> {
    // First remove the reference in audit logs to allow deletion
    await db.update(auditLogs).set({ adminId: null }).where(eq(auditLogs.adminId, id));
    
    const result = await db.delete(admins).where(eq(admins.id, id)).returning();
    return result.length > 0;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAllAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  // Subjects
  async getAllSubjects(department?: string, branchId?: number): Promise<Subject[]> {
    const query = db.select().from(subjects).orderBy(asc(subjects.id));
    if (branchId) {
      query.where(eq(subjects.branchId, branchId));
    } else if (department) {
      query.where(eq(subjects.department, department));
    }
    return await query;
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

  async getAllAttendance(limit?: number, offset?: number, search?: string, department?: string, branchId?: number): Promise<{ data: (Attendance & { student: Student })[], total: number }> {
    let query = db.select()
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .orderBy(asc(students.rollNo), desc(attendance.month));

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query.where(
        or(
          ilike(students.name, searchLower),
          ilike(students.rollNo, searchLower),
          ilike(attendance.month, searchLower)
        )
      );
    }
    if (branchId) {
      query.where(eq(students.branchId, branchId));
    } else if (department) {
      query.where(eq(students.department, department));
    }

    if (limit !== undefined && offset !== undefined) {
      query.limit(limit).offset(offset);
    }
    
    // Execute query and map result to expected format
    const results = await query;
    const data = results.map(row => ({
      ...row.attendance,
      student: row.students
    }));
    
    // Count query for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id));

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      countQuery.where(
        or(
          ilike(students.name, searchLower),
          ilike(students.rollNo, searchLower),
          ilike(attendance.month, searchLower)
        )
      );
    }
    if (branchId) {
      countQuery.where(eq(students.branchId, branchId));
    } else if (department) {
      countQuery.where(eq(students.department, department));
    }
    
    const totalResult = await countQuery;
    
    return { data: data as any, total: Number(totalResult[0].count) };
  }

  async createAttendance(attendanceRecord: any): Promise<Attendance> {
    const result = await db.insert(attendance).values(attendanceRecord).returning();
    return result[0];
  }

  async createAttendanceBatch(attendanceRecords: (InsertAttendance & { percentage: number; status: string })[]): Promise<Attendance[]> {
    return await db.transaction(async (tx) => {
      const results: Attendance[] = [];
      for (const record of attendanceRecords) {
        const [result] = await tx.insert(attendance).values(record).returning();
        results.push(result);
      }
      return results;
    });
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

  async getAllMarks(limit?: number, offset?: number, search?: string, department?: string, branchId?: number): Promise<{ data: (Marks & { student: Student })[], total: number }> {
    let query = db.select()
    .from(marks)
    .innerJoin(students, eq(marks.studentId, students.id))
    .orderBy(asc(students.rollNo), desc(marks.month));

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query.where(
        or(
          ilike(students.name, searchLower),
          ilike(students.rollNo, searchLower),
          ilike(marks.testName, searchLower)
        )
      );
    }
    if (branchId) {
      query.where(eq(students.branchId, branchId));
    } else if (department) {
      query.where(eq(students.department, department));
    }

    if (limit !== undefined && offset !== undefined) {
      query.limit(limit).offset(offset);
    }
    
    // Execute query and map result to expected format
    const results = await query;
    const data = results.map(row => ({
      ...row.marks,
      student: row.students
    }));
    
    // Count query for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(marks)
      .innerJoin(students, eq(marks.studentId, students.id));
      
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      countQuery.where(
        or(
          ilike(students.name, searchLower),
          ilike(students.rollNo, searchLower),
          ilike(marks.testName, searchLower)
        )
      );
    }
    if (branchId) {
      countQuery.where(eq(students.branchId, branchId));
    } else if (department) {
      countQuery.where(eq(students.department, department));
    }
    
    const totalResult = await countQuery;
    return { data: data as any, total: Number(totalResult[0].count) };
  }

  async createMarks(marksRecord: any): Promise<Marks> {
    const result = await db.insert(marks).values(marksRecord).returning();
    return result[0];
  }

  async createMarksBatch(marksRecords: (InsertMarks & { percentage: number; grade: string })[]): Promise<Marks[]> {
    return await db.transaction(async (tx) => {
      const results: Marks[] = [];
      for (const record of marksRecords) {
        const [result] = await tx.insert(marks).values(record).returning();
        results.push(result);
      }
      return results;
    });
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
  async getAllLibraryBooks(branchId?: number): Promise<LibraryBook[]> {
    const query = db.select().from(libraryBooks).orderBy(asc(libraryBooks.id));
    if (branchId) {
      // Show books specific to the branch ONLY (User requested strict separation)
      query.where(eq(libraryBooks.branchId, branchId));
    }
    return await query;
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
    return await db.select().from(bookIssues).orderBy(desc(bookIssues.issueDate), desc(bookIssues.id));
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
  async getAllNotices(branchId?: number): Promise<any[]> {
    const query = db.select({
      id: notices.id,
      title: notices.title,
      message: notices.message,
      priority: notices.priority,
      branchId: notices.branchId,
      createdAt: notices.createdAt,
      branchName: branches.name
    })
    .from(notices)
    .leftJoin(branches, eq(notices.branchId, branches.id))
    .orderBy(desc(notices.createdAt));
    
    if (branchId) {
      // If a branchId is provided, ONLY return notices for that branch.
      // Do NOT include global notices (where branchId is null).
      query.where(eq(notices.branchId, branchId));
    }
    return await query;
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

  // Analytics
  async getGlobalStats(branchId?: number) {
    // 1. Students count
    const studentCountQuery = db.select({ count: sql<number>`count(*)` }).from(students);
    if (branchId) {
      studentCountQuery.where(eq(students.branchId, branchId));
    }
    const [studentCount] = await studentCountQuery;

    // 2. Attendance Average
    const attendanceAvgQuery = db.select({ avg: sql<number>`avg(${attendance.percentage})` }).from(attendance);
    if (branchId) {
      attendanceAvgQuery.innerJoin(students, eq(attendance.studentId, students.id))
        .where(eq(students.branchId, branchId));
    }
    const [attendanceAvg] = await attendanceAvgQuery;

    // 3. Marks Average
    const marksAvgQuery = db.select({ avg: sql<number>`avg(${marks.percentage})` }).from(marks);
    if (branchId) {
      marksAvgQuery.innerJoin(students, eq(marks.studentId, students.id))
        .where(eq(students.branchId, branchId));
    }
    const [marksAvg] = await marksAvgQuery;

    // 4. Books Issued Count
    const issuedCountQuery = db.select({ count: sql<number>`count(*)` }).from(bookIssues);
    if (branchId) {
      issuedCountQuery.innerJoin(students, eq(bookIssues.studentId, students.id))
        .where(and(eq(bookIssues.status, 'issued'), eq(students.branchId, branchId)));
    } else {
      issuedCountQuery.where(eq(bookIssues.status, 'issued'));
    }
    const [issuedCount] = await issuedCountQuery;

    return {
      totalStudents: Number(studentCount?.count || 0),
      avgAttendance: Number(attendanceAvg?.avg || 0),
      avgMarks: Number(marksAvg?.avg || 0),
      totalBooksIssued: Number(issuedCount?.count || 0)
    };
  }

  async getAllBatches(): Promise<Batch[]> {
    return await db.select().from(batches).orderBy(asc(batches.startYear));
  }

  async getBatchById(id: number): Promise<Batch | undefined> {
    const result = await db.select().from(batches).where(eq(batches.id, id));
    return result[0];
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const result = await db.insert(batches).values(batch).returning();
    return result[0];
  }

  async updateBatch(id: number, batch: Partial<InsertBatch>): Promise<Batch | undefined> {
    const result = await db.update(batches).set(batch).where(eq(batches.id, id)).returning();
    return result[0];
  }

  async deleteBatch(id: number): Promise<boolean> {
    console.log(`[Storage] Deleting batch ${id}...`);
    return await db.transaction(async (tx) => {
      // 1. Get all branches in this batch
      const batchBranches = await tx.select().from(branches).where(eq(branches.batchId, id));
      console.log(`[Storage] Found ${batchBranches.length} branches in batch ${id}`);
      
      for (const branch of batchBranches) {
        await this.deleteBranchData(tx, branch.id);
      }

      // 2. Delete the branches (now safe to delete)
      await tx.delete(branches).where(eq(branches.batchId, id));
      console.log(`[Storage] Deleted branches for batch ${id}`);

      // 3. Delete the batch itself
      const result = await tx.delete(batches).where(eq(batches.id, id)).returning();
      console.log(`[Storage] Deleted batch ${id}, result:`, result.length);
      return result.length > 0;
    });
  }

  // Helper to delete all data associated with a branch (Manual Cascade)
  private async deleteBranchData(tx: any, branchId: number) {
    console.log(`[Storage] Cleaning up data for branch ${branchId}...`);
    
    // Get IDs for cleanup
    const branchStudents = await tx.select({ id: students.id }).from(students).where(eq(students.branchId, branchId));
    const studentIds = branchStudents.map((s: any) => s.id);

    const branchSubjects = await tx.select({ id: subjects.id }).from(subjects).where(eq(subjects.branchId, branchId));
    const subjectIds = branchSubjects.map((s: any) => s.id);

    const branchBooks = await tx.select({ id: libraryBooks.id }).from(libraryBooks).where(eq(libraryBooks.branchId, branchId));
    const bookIds = branchBooks.map((b: any) => b.id);

    console.log(`[Storage] Found ${studentIds.length} students, ${subjectIds.length} subjects, ${bookIds.length} books for branch ${branchId}`);

    // 1. Delete Book Issues
    if (studentIds.length > 0) {
      await tx.delete(bookIssues).where(inArray(bookIssues.studentId, studentIds));
    }
    if (bookIds.length > 0) {
      await tx.delete(bookIssues).where(inArray(bookIssues.bookId, bookIds));
    }

    // 2. Delete Attendance
    if (studentIds.length > 0) {
      await tx.delete(attendance).where(inArray(attendance.studentId, studentIds));
    }
    if (subjectIds.length > 0) {
      await tx.delete(attendance).where(inArray(attendance.subjectId, subjectIds));
    }

    // 3. Delete Marks
    if (studentIds.length > 0) {
      await tx.delete(marks).where(inArray(marks.studentId, studentIds));
    }
    if (subjectIds.length > 0) {
      await tx.delete(marks).where(inArray(marks.subjectId, subjectIds));
    }

    // 4. Delete dependent Notices
    await tx.delete(notices).where(eq(notices.branchId, branchId));

    // 5. Delete dependent Students
    await tx.delete(students).where(eq(students.branchId, branchId));

    // 6. Delete dependent Subjects
    await tx.delete(subjects).where(eq(subjects.branchId, branchId));

    // 7. Delete dependent Library Books
    await tx.delete(libraryBooks).where(eq(libraryBooks.branchId, branchId));
    
    console.log(`[Storage] Cleanup complete for branch ${branchId}`);
  }

  async getBranchesByBatch(batchId: number): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.batchId, batchId)).orderBy(asc(branches.name));
  }

  async getBranchById(id: number): Promise<Branch | undefined> {
    const result = await db.select().from(branches).where(eq(branches.id, id));
    return result[0];
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const result = await db.insert(branches).values(branch).returning();
    return result[0];
  }

  async updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    const result = await db.update(branches).set(branch).where(eq(branches.id, id)).returning();
    return result[0];
  }

  async deleteBranch(id: number): Promise<boolean> {
    console.log(`[Storage] Deleting branch ${id}...`);
    return await db.transaction(async (tx) => {
      await this.deleteBranchData(tx, id);
      const result = await tx.delete(branches).where(eq(branches.id, id)).returning();
      console.log(`[Storage] Deleted branch ${id}, result:`, result.length);
      return result.length > 0;
    });
  }
}

export const storage = new DatabaseStorage();
