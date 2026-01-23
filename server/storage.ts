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
  dailyAttendance, 
  exams, 
  examMarks, 
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
  type InsertBranch, 
  type DailyAttendance, 
  type InsertDailyAttendance, 
  type Exam, 
  type InsertExam, 
  type ExamMarks, 
  type InsertExamMarks
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
  getAllStudents(limit?: number, offset?: number, search?: string, department?: string, branchId?: number, batchId?: number): Promise<{ data: Student[], total: number }>;
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
  getAllAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;

  // Subjects
  getAllSubjects(department?: string, branchId?: number, batchId?: number): Promise<Subject[]>;
  getSubjectById(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Attendance
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAllAttendance(limit?: number, offset?: number, search?: string, department?: string, branchId?: number, batchId?: number): Promise<{ data: (Attendance & { student: Student })[], total: number }>;
  createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance>;
  createAttendanceBatch(attendanceRecords: (InsertAttendance & { percentage: number; status: string })[]): Promise<Attendance[]>;
  updateAttendance(id: number, attendanceRecord: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Marks
  getMarksByStudent(studentId: number): Promise<Marks[]>;
  getAllMarks(limit?: number, offset?: number, search?: string, department?: string, branchId?: number, batchId?: number): Promise<{ data: (Marks & { student: Student })[], total: number }>;
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
  getAllBranches(): Promise<Branch[]>;
  getBranchesByBatch(batchId: number): Promise<Branch[]>;
  getBranchById(id: number): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: number): Promise<boolean>;

  // Daily Attendance (Calendar System)
  getDailyAttendance(date: string, subjectId: number): Promise<DailyAttendance[]>;
  markDailyAttendance(records: InsertDailyAttendance[]): Promise<DailyAttendance[]>;

  // Exams & Marks
  createExam(exam: InsertExam): Promise<Exam>;
  getExamsBySubject(subjectId: number): Promise<Exam[]>;
  deleteExam(id: number): Promise<boolean>;
  getExamById(id: number): Promise<Exam | undefined>;
  saveExamMarks(records: InsertExamMarks[]): Promise<ExamMarks[]>;
  getExamMarks(examId: number): Promise<ExamMarks[]>;
}

export class DatabaseStorage implements IStorage {
  // ... existing methods ...

  // Daily Attendance
  async getDailyAttendance(dateStr: string, subjectId: number): Promise<DailyAttendance[]> {
    console.log(`[Storage] getDailyAttendance date=${dateStr} subjectId=${subjectId}`);
    // Order by ID desc to ensure we get the latest record if duplicates exist
    const records = await db.select().from(dailyAttendance).where(and(
      eq(dailyAttendance.date, dateStr),
      eq(dailyAttendance.subjectId, subjectId)
    )).orderBy(desc(dailyAttendance.id));
    console.log(`[Storage] Found ${records.length} records`);
    return records;
  }

  async markDailyAttendance(records: InsertDailyAttendance[]): Promise<DailyAttendance[]> {
    console.log(`[Storage] markDailyAttendance: Saving ${records.length} records`);
    return await db.transaction(async (tx) => {
      const results: DailyAttendance[] = [];
      for (const record of records) {
        // Ensure date is treated consistently
        // We use the string representation to match DB
        const dateStr = typeof record.date === 'string' ? record.date : new Date(record.date).toISOString().split('T')[0];

        // Robust Upsert: Delete any existing records for this student/subject/date first
        // This handles potential duplicates from previous bugs and ensures a clean state
        await tx.delete(dailyAttendance).where(and(
          eq(dailyAttendance.studentId, record.studentId),
          eq(dailyAttendance.subjectId, record.subjectId),
          eq(dailyAttendance.date, dateStr)
        ));

        // Insert the new record with lowercased status
        const [inserted] = await tx.insert(dailyAttendance).values({
          ...record,
          date: dateStr, // Ensure we save the standardized string
          status: record.status.toLowerCase()
        }).returning();
        results.push(inserted);
      }
      return results;
    });
  }

  // Exams
  async createExam(exam: InsertExam): Promise<Exam> {
    const result = await db.insert(exams).values(exam).returning();
    return result[0];
  }

  async getExamsBySubject(subjectId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.subjectId, subjectId)).orderBy(desc(exams.date));
  }

  async deleteExam(id: number): Promise<boolean> {
    const result = await db.delete(exams).where(eq(exams.id, id)).returning();
    return result.length > 0;
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const result = await db.select().from(exams).where(eq(exams.id, id));
    return result[0];
  }

  // Exam Marks
  async saveExamMarks(records: InsertExamMarks[]): Promise<ExamMarks[]> {
    return await db.transaction(async (tx) => {
      const results: ExamMarks[] = [];
      for (const record of records) {
        const existing = await tx.select().from(examMarks).where(and(
          eq(examMarks.examId, record.examId),
          eq(examMarks.studentId, record.studentId)
        ));

        if (existing.length > 0) {
          const [updated] = await tx.update(examMarks)
            .set({ marksObtained: record.marksObtained })
            .where(eq(examMarks.id, existing[0].id))
            .returning();
          results.push(updated);
        } else {
          const [inserted] = await tx.insert(examMarks).values(record).returning();
          results.push(inserted);
        }
      }
      return results;
    });
  }

  async getExamMarks(examId: number): Promise<ExamMarks[]> {
    return await db.select().from(examMarks).where(eq(examMarks.examId, examId));
  }

  // Students
  async getStudentStats(studentIds?: number[]) {
    // Attendance Stats (Daily)
    // Percentage = (Count of 'present' / Total Count) * 100
    // Grouped by studentId
    const attendanceQuery = db.select({
      studentId: dailyAttendance.studentId,
      total: sql<number>`count(*)`,
      present: sql<number>`count(*) filter (where lower(${dailyAttendance.status}) = 'present')`
    })
    .from(dailyAttendance)
    .groupBy(dailyAttendance.studentId);
    
    if (studentIds && studentIds.length > 0) {
      attendanceQuery.where(inArray(dailyAttendance.studentId, studentIds));
    }
    
    const attendanceStatsRaw = await attendanceQuery;
    const attendanceStats = attendanceStatsRaw.map(stat => ({
      studentId: stat.studentId,
      avgPercentage: stat.total > 0 ? (stat.present / stat.total) * 100 : 0
    }));

    // Marks Stats (Exams)
    // Avg Percentage = Avg( (marksObtained / totalMarks) * 100 )
    // We need to join examMarks with exams to get totalMarks
    const marksQuery = db.select({
      studentId: examMarks.studentId,
      avgPercentage: sql<number>`avg((${examMarks.marksObtained} / ${exams.totalMarks}) * 100)`
    })
    .from(examMarks)
    .innerJoin(exams, eq(examMarks.examId, exams.id))
    .groupBy(examMarks.studentId);
    
    if (studentIds && studentIds.length > 0) {
      marksQuery.where(inArray(examMarks.studentId, studentIds));
    }
    
    const marksStats = await marksQuery;

    // Issue Stats (Library)
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

  async getAllStudents(limit?: number, offset?: number, search?: string, department?: string, branchId?: number, batchId?: number): Promise<{ data: (Student & { avgMarks: number, attendancePercentage: number })[], total: number }> {
    // Sort by length of rollNo first (to group single digits, double digits, etc.), then by value
    // This fixes the issue where '100' comes before '29' in standard string sort
    let query = db.select({
      student: students
    })
    .from(students)
    .leftJoin(branches, eq(students.branchId, branches.id))
    .orderBy(
      sql`length(${students.rollNo}) asc`,
      asc(students.rollNo)
    );
    
    const conditions = [];

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        ilike(students.name, searchLower),
        ilike(students.rollNo, searchLower)
      ));
    }

    if (branchId) {
      conditions.push(eq(students.branchId, branchId));
    } else if (batchId) {
      // If branchId is not provided but batchId is, filter by batch via the joined branches table
      conditions.push(eq(branches.batchId, batchId));
    }
    
    if (department) {
      conditions.push(eq(students.department, department));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    if (limit !== undefined && offset !== undefined) {
      query.limit(limit).offset(offset);
    }
    const results = await query;
    const rawData = results.map(r => r.student);

    // Populate Stats (Avg Marks & Attendance)
    const studentIds = rawData.map(s => s.id);
    let data = rawData.map(s => ({ ...s, avgMarks: 0, attendancePercentage: 0 }));

    if (studentIds.length > 0) {
      const stats = await this.getStudentStats(studentIds);
      
      const attMap = new Map(stats.attendanceStats.map(s => [s.studentId, s.avgPercentage]));
      const marksMap = new Map(stats.marksStats.map(s => [s.studentId, s.avgPercentage]));
      
      data = rawData.map(s => ({
        ...s,
        avgMarks: Number(marksMap.get(s.id) || 0),
        attendancePercentage: Number(attMap.get(s.id) || 0)
      }));
    }

    const totalQuery = db.select({ count: sql<number>`count(*)` })
      .from(students)
      .leftJoin(branches, eq(students.branchId, branches.id));

    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
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

  async getAllAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    
    if (limit !== undefined && offset !== undefined) {
      query.limit(limit).offset(offset);
    }
    
    return await query;
  }

  // Subjects
  async getAllSubjects(department?: string, branchId?: number, batchId?: number): Promise<Subject[]> {
    const query = db.select({
      subject: subjects
    })
    .from(subjects)
    .leftJoin(branches, eq(subjects.branchId, branches.id))
    .orderBy(asc(subjects.id));

    const conditions = [];

    if (branchId) {
      conditions.push(eq(subjects.branchId, branchId));
    } else if (batchId) {
      conditions.push(eq(branches.batchId, batchId));
    }

    if (department) {
      conditions.push(eq(subjects.department, department));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const results = await query;
    return results.map(r => r.subject);
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
    // Aggregate dailyAttendance to match the legacy Attendance format
    const query = db.select({
       subjectId: dailyAttendance.subjectId,
       month: sql<string>`to_char(${dailyAttendance.date}, 'YYYY-MM')`,
       totalDays: sql<number>`count(*)::int`,
       presentDays: sql<number>`count(*) filter (where lower(${dailyAttendance.status}) = 'present')::int`,
    })
    .from(dailyAttendance)
    .where(eq(dailyAttendance.studentId, studentId))
    .groupBy(dailyAttendance.subjectId, sql`to_char(${dailyAttendance.date}, 'YYYY-MM')`)
    .orderBy(desc(sql`to_char(${dailyAttendance.date}, 'YYYY-MM')`));

    const results = await query;

    // Transform to Attendance interface
    return results.map((row, index) => {
        const percentage = row.totalDays > 0 ? (row.presentDays / row.totalDays) * 100 : 0;
        let status = 'Poor';
        if (percentage >= 80) status = 'Good';
        else if (percentage >= 60) status = 'Average';

        return {
            id: index + 1, // Dummy ID
            studentId: studentId,
            subjectId: row.subjectId,
            month: row.month,
            totalDays: row.totalDays,
            presentDays: row.presentDays,
            percentage,
            status,
            createdAt: new Date()
        };
    });
  }

  async getAllAttendance(limit?: number, offset?: number, search?: string, department?: string, branchId?: number, batchId?: number): Promise<{ data: (Attendance & { student: Student })[], total: number }> {
    // Aggregating dailyAttendance to match the legacy Attendance format
    const query = db.select({
       studentId: dailyAttendance.studentId,
       subjectId: dailyAttendance.subjectId,
       month: sql<string>`to_char(${dailyAttendance.date}, 'YYYY-MM')`,
       totalDays: sql<number>`count(*)::int`,
       presentDays: sql<number>`count(*) filter (where lower(${dailyAttendance.status}) = 'present')::int`,
       // Selecting student fields
       student: {
           id: students.id,
           rollNo: students.rollNo,
           name: students.name,
           department: students.department,
           branchId: students.branchId,
           semester: students.semester,
       }
    })
    .from(dailyAttendance)
    .innerJoin(students, eq(dailyAttendance.studentId, students.id))
    .leftJoin(branches, eq(students.branchId, branches.id))
    .groupBy(dailyAttendance.studentId, dailyAttendance.subjectId, sql`to_char(${dailyAttendance.date}, 'YYYY-MM')`, students.id);

    // Filters
    const conditions = [];
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        ilike(students.name, searchLower),
        ilike(students.rollNo, searchLower),
        sql`to_char(${dailyAttendance.date}, 'YYYY-MM') ILIKE ${searchLower}`
      ));
    }
    if (branchId) conditions.push(eq(students.branchId, branchId));
    else if (batchId) conditions.push(eq(branches.batchId, batchId));
    if (department) conditions.push(eq(students.department, department));
    
    if (conditions.length > 0) query.where(and(...conditions));

    // Order, Limit, Offset
    query.orderBy(desc(sql`to_char(${dailyAttendance.date}, 'YYYY-MM')`));
    
    if (limit) query.limit(limit);
    if (offset) query.offset(offset);

    const results = await query;

    // Transform
    const data = await Promise.all(results.map(async row => {
        const percentage = row.totalDays > 0 ? (row.presentDays / row.totalDays) * 100 : 0;
        let status = 'Poor';
        if (percentage >= 80) status = 'Good';
        else if (percentage >= 60) status = 'Average';

        const studentObj = await db.select().from(students).where(eq(students.id, row.studentId)).then(res => res[0]);

        return {
            id: 0, // Dummy ID
            studentId: row.studentId,
            subjectId: row.subjectId,
            month: row.month,
            totalDays: row.totalDays,
            presentDays: row.presentDays,
            percentage,
            status,
            createdAt: new Date(),
            student: studentObj || { id: row.studentId } as any // Fallback
        };
    }));
    
    return { data: data as any, total: data.length };
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
    const query = db.select({
       id: examMarks.id,
       marksObtained: examMarks.marksObtained,
       // Joined fields
       examName: exams.name,
       totalMarks: exams.totalMarks,
       examDate: exams.date,
       subjectId: exams.subjectId,
    })
    .from(examMarks)
    .innerJoin(exams, eq(examMarks.examId, exams.id))
    .where(eq(examMarks.studentId, studentId))
    .orderBy(desc(exams.date));

    const results = await query;
    
    return results.map(row => {
        const percentage = row.totalMarks > 0 ? (row.marksObtained / row.totalMarks) * 100 : 0;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        return {
            id: row.id,
            studentId: studentId,
            subjectId: row.subjectId,
            month: row.examDate ? row.examDate.substring(0, 7) : '2023-01',
            testName: row.examName,
            marksObtained: row.marksObtained,
            totalMarks: row.totalMarks,
            percentage,
            grade,
            createdAt: new Date()
        };
    });
  }

  async getAllMarks(limit?: number, offset?: number, search?: string, department?: string, branchId?: number, batchId?: number): Promise<{ data: (Marks & { student: Student })[], total: number }> {
    const query = db.select({
       id: examMarks.id,
       studentId: examMarks.studentId,
       marksObtained: examMarks.marksObtained,
       // Joined fields
       examName: exams.name,
       totalMarks: exams.totalMarks,
       examDate: exams.date,
       subjectId: exams.subjectId,
       // Student
       student: {
           id: students.id,
           rollNo: students.rollNo,
           name: students.name,
           department: students.department,
           branchId: students.branchId,
           semester: students.semester,
       }
    })
    .from(examMarks)
    .innerJoin(exams, eq(examMarks.examId, exams.id))
    .innerJoin(students, eq(examMarks.studentId, students.id))
    .leftJoin(branches, eq(students.branchId, branches.id));

    const conditions = [];
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        ilike(students.name, searchLower),
        ilike(students.rollNo, searchLower),
        ilike(exams.name, searchLower)
      ));
    }
    if (branchId) conditions.push(eq(students.branchId, branchId));
    else if (batchId) conditions.push(eq(branches.batchId, batchId));
    if (department) conditions.push(eq(students.department, department));

    if (conditions.length > 0) query.where(and(...conditions));
    
    // Order, Limit
    query.orderBy(desc(exams.date));
    
    if (limit) query.limit(limit);
    if (offset) query.offset(offset);

    const results = await query;
    
    // Transform
    const data = await Promise.all(results.map(async row => {
        const percentage = row.totalMarks > 0 ? (row.marksObtained / row.totalMarks) * 100 : 0;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        const studentObj = await db.select().from(students).where(eq(students.id, row.studentId)).then(res => res[0]);

        return {
            id: row.id,
            studentId: row.studentId,
            subjectId: row.subjectId,
            month: row.examDate ? row.examDate.substring(0, 7) : '2023-01',
            testName: row.examName,
            marksObtained: row.marksObtained,
            totalMarks: row.totalMarks,
            percentage,
            grade,
            createdAt: new Date(),
            student: studentObj || { id: row.studentId } as any
        };
    }));

    return { data: data as any, total: data.length };
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
  async getAllLibraryBooks(branchId?: number, batchId?: number): Promise<LibraryBook[]> {
    let query = db.select({
      book: libraryBooks
    })
    .from(libraryBooks)
    .leftJoin(branches, eq(libraryBooks.branchId, branches.id));

    const conditions = [];
    if (branchId) {
      conditions.push(eq(libraryBooks.branchId, branchId));
    } else if (batchId) {
      conditions.push(eq(branches.batchId, batchId));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const results = await query;
    return results.map(r => r.book);
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
  async getAllNotices(branchId?: number, batchId?: number): Promise<any[]> {
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
    
    const conditions = [];
    if (branchId) {
      conditions.push(eq(notices.branchId, branchId));
    } else if (batchId) {
      conditions.push(eq(branches.batchId, batchId));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
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
  async getGlobalStats(branchId?: number, batchId?: number) {
    // 1. Students count
    const studentCountQuery = db.select({ count: sql<number>`count(*)` })
      .from(students)
      .leftJoin(branches, eq(students.branchId, branches.id));
      
    const conditions = [];
    
    if (branchId) {
      conditions.push(eq(students.branchId, branchId));
    } else if (batchId) {
      conditions.push(eq(branches.batchId, batchId));
    }
    
    if (conditions.length > 0) {
      studentCountQuery.where(and(...conditions));
    }
    
    const [studentCount] = await studentCountQuery;
    const totalStudents = Number(studentCount?.count || 0);
    console.log(`[Storage] getGlobalStats: totalStudents=${totalStudents} branchId=${branchId}`);

    // If no students, return 0 for everything to prevent ghost data
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        avgAttendance: 0,
        avgMarks: 0,
        totalBooksIssued: 0
      };
    }

    // 2. Attendance Average
    const attendanceStatsQuery = db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`count(*) filter (where lower(${dailyAttendance.status}) = 'present')`
    }).from(dailyAttendance);
    
    // We need to join students and branches to filter
    attendanceStatsQuery.innerJoin(students, eq(dailyAttendance.studentId, students.id))
      .leftJoin(branches, eq(students.branchId, branches.id));
      
    if (conditions.length > 0) {
      attendanceStatsQuery.where(and(...conditions));
    }
    
    const [attendanceStats] = await attendanceStatsQuery;
    console.log(`[Storage] getGlobalStats: attendanceStats=`, attendanceStats);
    
    const avgAttendance = attendanceStats && attendanceStats.total > 0 
      ? (attendanceStats.present / attendanceStats.total) * 100 
      : 0;

    // 3. Marks Average
    const marksAvgQuery = db.select({ 
      avg: sql<number>`avg((${examMarks.marksObtained} / ${exams.totalMarks}) * 100)` 
    })
    .from(examMarks)
    .innerJoin(exams, eq(examMarks.examId, exams.id))
    .innerJoin(students, eq(examMarks.studentId, students.id))
    .leftJoin(branches, eq(students.branchId, branches.id));

    if (conditions.length > 0) {
      marksAvgQuery.where(and(...conditions));
    }
    
    const [marksAvg] = await marksAvgQuery;

    // 4. Books Issued Count
    const issuedCountQuery = db.select({ count: sql<number>`count(*)` }).from(bookIssues);
    
    issuedCountQuery.innerJoin(students, eq(bookIssues.studentId, students.id))
      .leftJoin(branches, eq(students.branchId, branches.id));

    const issueConditions = [...conditions, eq(bookIssues.status, 'issued')];
    
    issuedCountQuery.where(and(...issueConditions));
    
    const [issuedCount] = await issuedCountQuery;

    return {
      totalStudents,
      avgAttendance: Number(avgAttendance || 0),
      avgMarks: Number(marksAvg?.avg || 0),
      totalBooksIssued: Number(issuedCount?.count || 0)
    };
  }

  async getSubjectStats(branchId?: number, batchId?: number) {
    // Query stats grouped by subjectId
    
    // 1. Attendance by Subject
    const attendanceQuery = db.select({
      subjectId: dailyAttendance.subjectId,
      total: sql<number>`count(*)`,
      present: sql<number>`count(*) filter (where lower(${dailyAttendance.status}) = 'present')`
    })
    .from(dailyAttendance)
    .innerJoin(students, eq(dailyAttendance.studentId, students.id))
    .leftJoin(branches, eq(students.branchId, branches.id))
    .groupBy(dailyAttendance.subjectId);
    
    const attConditions = [];
    if (branchId) attConditions.push(eq(students.branchId, branchId));
    else if (batchId) attConditions.push(eq(branches.batchId, batchId));
    if (attConditions.length > 0) attendanceQuery.where(and(...attConditions));
    
    const attendanceStats = await attendanceQuery;
    const attMap = new Map();
    attendanceStats.forEach(stat => {
      const avg = stat.total > 0 ? (stat.present / stat.total) * 100 : 0;
      attMap.set(stat.subjectId, avg);
    });

    // 2. Marks by Subject
    const marksQuery = db.select({
      subjectId: exams.subjectId,
      avg: sql<number>`avg((${examMarks.marksObtained} / ${exams.totalMarks}) * 100)`
    })
    .from(examMarks)
    .innerJoin(exams, eq(examMarks.examId, exams.id))
    .innerJoin(students, eq(examMarks.studentId, students.id))
    .leftJoin(branches, eq(students.branchId, branches.id))
    .groupBy(exams.subjectId);
    
    const marksConditions = [];
    if (branchId) marksConditions.push(eq(students.branchId, branchId));
    else if (batchId) marksConditions.push(eq(branches.batchId, batchId));
    if (marksConditions.length > 0) marksQuery.where(and(...marksConditions));
    
    const marksStats = await marksQuery;
    const marksMap = new Map();
    marksStats.forEach(stat => {
      marksMap.set(stat.subjectId, Number(stat.avg || 0));
    });

    // 3. Get Subjects Details
    // We need to fetch subjects that match the filter to ensure we show all subjects, even those with no stats
    let subjQuery = db.select().from(subjects).leftJoin(branches, eq(subjects.branchId, branches.id));
    const subjConditions = [];
    if (branchId) subjConditions.push(eq(subjects.branchId, branchId));
    else if (batchId) subjConditions.push(eq(branches.batchId, batchId));
    if (subjConditions.length > 0) subjQuery.where(and(...subjConditions));
    
    const subjectsList = await subjQuery;
    
    return subjectsList.map(row => {
      const s = row.subjects;
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        avgAttendance: attMap.get(s.id) || 0,
        avgMarks: marksMap.get(s.id) || 0
      };
    });
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

    // 2. Delete Attendance (Both Legacy and New)
    if (studentIds.length > 0) {
      await tx.delete(attendance).where(inArray(attendance.studentId, studentIds));
      await tx.delete(dailyAttendance).where(inArray(dailyAttendance.studentId, studentIds));
    }
    if (subjectIds.length > 0) {
      await tx.delete(attendance).where(inArray(attendance.subjectId, subjectIds));
      await tx.delete(dailyAttendance).where(inArray(dailyAttendance.subjectId, subjectIds));
    }

    // 3. Delete Marks (Both Legacy and New)
    if (studentIds.length > 0) {
      await tx.delete(marks).where(inArray(marks.studentId, studentIds));
      await tx.delete(examMarks).where(inArray(examMarks.studentId, studentIds));
    }
    if (subjectIds.length > 0) {
      await tx.delete(marks).where(inArray(marks.subjectId, subjectIds));
      // examMarks doesn't have subjectId directly, it links to exams
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

  async getAllBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(asc(branches.name));
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
