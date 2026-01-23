
import { db } from "../server/db";
import { 
  batches, branches, students, subjects, exams, examMarks, dailyAttendance, bookIssues, libraryBooks, notices,
  type InsertBatch, type InsertBranch, type InsertStudent, type InsertSubject, type InsertExam, type InsertExamMarks, type InsertDailyAttendance
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("🌱 Starting comprehensive seed...");

  // 0. Clean up existing data
  console.log("🧹 Clearing existing data...");
  await db.delete(dailyAttendance);
  await db.delete(examMarks);
  await db.delete(exams);
  await db.delete(bookIssues);
  await db.delete(libraryBooks);
  await db.delete(notices);
  await db.delete(students);
  await db.delete(subjects);
  await db.delete(branches);
  await db.delete(batches);
  console.log("✅ Data cleared");

  // 1. Create Batches
  const batchData: InsertBatch[] = [
    { name: "2023-2027", startYear: 2023, endYear: 2027 },
    { name: "2024-2028", startYear: 2024, endYear: 2028 },
    { name: "2025-2029", startYear: 2025, endYear: 2029 },
  ];

  const createdBatches = [];
  for (const b of batchData) {
    const existing = await db.select().from(batches).where(eq(batches.name, b.name)).limit(1);
    if (existing.length > 0) {
      createdBatches.push(existing[0]);
    } else {
      const [newBatch] = await db.insert(batches).values(b).returning();
      createdBatches.push(newBatch);
    }
  }
  console.log(`✅ Batches ensured: ${createdBatches.length}`);

  // 2. Create Branches for each Batch
  const branchNames = ["Civil Engineering", "Computer Science", "Electronics", "Mechanical", "Electrical"];
  const branchMap: Record<string, number> = {}; // "BatchID-BranchName" -> BranchID

  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const [branch] = await db.insert(branches).values({
        name: bName,
        batchId: batch.id,
      }).returning();
      branchMap[`${batch.id}-${bName}`] = branch.id;
    }
  }
  console.log("✅ Branches created for all batches");

  // 3. Create Students
  // Target: Civil = 130, Others = 80
  const passwordHash = await hashPassword("student123");

  let totalStudents = 0;

  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      const targetCount = bName === "Civil Engineering" ? 130 : 80;
      const deptCode = bName === "Civil Engineering" ? "CE" : 
                       bName === "Computer Science" ? "CSE" :
                       bName === "Electronics" ? "ECE" :
                       bName === "Mechanical" ? "ME" : "EE";

      console.log(`Creating ${targetCount} students for ${bName} (Batch: ${batch.name})...`);
      
      const studentsToInsert: InsertStudent[] = [];
      for (let i = 1; i <= targetCount; i++) {
        const rollNo = `${batch.startYear}-${deptCode}-${i.toString().padStart(3, '0')}`;
        studentsToInsert.push({
          rollNo: rollNo,
          name: `${bName} Student ${i}`,
          password: passwordHash,
          department: deptCode,
          branchId: branchId,
          semester: 1,
        });
      }

      // Insert in chunks to avoid query size limits
      const chunkSize = 50;
      for (let i = 0; i < studentsToInsert.length; i += chunkSize) {
        const chunk = studentsToInsert.slice(i, i + chunkSize);
        await db.insert(students).values(chunk).onConflictDoNothing();
      }
      totalStudents += targetCount;
    }
  }
  console.log(`✅ Created ${totalStudents} students`);

  // 4. Create Subjects
  // Create 5 subjects for each branch in each batch
  const subjectMap: Record<number, number[]> = {}; // BranchID -> SubjectIDs[]

  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      const deptCode = bName === "Civil Engineering" ? "CE" : 
                       bName === "Computer Science" ? "CSE" :
                       bName === "Electronics" ? "ECE" :
                       bName === "Mechanical" ? "ME" : "EE";

      const subjectsToInsert: InsertSubject[] = [
        { code: `${batch.startYear}-${deptCode}101`, name: "Applied Mathematics", department: deptCode, branchId, semester: 1 },
        { code: `${batch.startYear}-${deptCode}102`, name: "Engineering Physics", department: deptCode, branchId, semester: 1 },
        { code: `${batch.startYear}-${deptCode}103`, name: "Core Engineering", department: deptCode, branchId, semester: 1 },
        { code: `${batch.startYear}-${deptCode}104`, name: "Professional Communication", department: deptCode, branchId, semester: 1 },
        { code: `${batch.startYear}-${deptCode}105`, name: "Lab Work", department: deptCode, branchId, semester: 1 },
      ];

      const insertedSubjects = [];
      for (const sub of subjectsToInsert) {
        const [s] = await db.insert(subjects).values(sub).onConflictDoNothing().returning();
        if (s) insertedSubjects.push(s);
      }
      subjectMap[branchId] = insertedSubjects.map(s => s.id);
    }
  }
  console.log("✅ Subjects created");

  // 5. Create Exams & Marks (Randomized)
  console.log("Generating Exams and Marks...");
  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      const subjectIds = subjectMap[branchId];
      if (!subjectIds || subjectIds.length === 0) continue;

      // Get students for this branch
      const branchStudents = await db.select().from(students).where(eq(students.branchId, branchId));

      for (const subjectId of subjectIds) {
        // Create an exam
        const [exam] = await db.insert(exams).values({
          name: "Mid Term 1",
          subjectId: subjectId,
          totalMarks: 50,
          date: new Date().toISOString().split('T')[0],
        }).returning();

        // Assign marks to 80% of students
        const marksToInsert: InsertExamMarks[] = [];
        for (const student of branchStudents) {
          if (Math.random() > 0.2) { // 80% chance
            marksToInsert.push({
              examId: exam.id,
              studentId: student.id,
              marksObtained: Math.floor(Math.random() * 40) + 10, // 10-50 marks
            });
          }
        }
        
        const chunkSize = 50;
        for (let i = 0; i < marksToInsert.length; i += chunkSize) {
          const chunk = marksToInsert.slice(i, i + chunkSize);
          await db.insert(examMarks).values(chunk);
        }
      }
    }
  }
  console.log("✅ Exams and Marks generated");

  // 6. Create Daily Attendance (Randomized)
  console.log("Generating Daily Attendance...");
  const dates = ["2026-01-20", "2026-01-21", "2026-01-22", "2026-01-23"]; // Last 4 days

  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      const subjectIds = subjectMap[branchId];
      if (!subjectIds || subjectIds.length === 0) continue;

      const branchStudents = await db.select().from(students).where(eq(students.branchId, branchId));

      // For each date, pick a subject and mark attendance
      for (const date of dates) {
        // Pick random subject for the day
        const subjectId = subjectIds[Math.floor(Math.random() * subjectIds.length)];
        
        const attendanceToInsert: InsertDailyAttendance[] = [];
        for (const student of branchStudents) {
          // 90% Present, 10% Absent
          const status = Math.random() > 0.1 ? 'present' : 'absent';
          attendanceToInsert.push({
            studentId: student.id,
            subjectId: subjectId,
            date: date,
            status: status,
          });
        }

        const chunkSize = 50;
        for (let i = 0; i < attendanceToInsert.length; i += chunkSize) {
          const chunk = attendanceToInsert.slice(i, i + chunkSize);
          await db.insert(dailyAttendance).values(chunk).onConflictDoNothing();
        }
      }
    }
  }
  console.log("✅ Attendance generated");

  // 7. Create Library Books
  console.log("Creating Library Books...");
  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      
      let booksToInsert = [];

      if (bName === "Computer Science") {
        booksToInsert = [
          { title: "Introduction to Algorithms", author: "Cormen", copiesAvailable: 10, totalCopies: 10, branchId },
          { title: "Clean Code", author: "Robert C. Martin", copiesAvailable: 5, totalCopies: 5, branchId },
          { title: "Design Patterns", author: "Gamma", copiesAvailable: 8, totalCopies: 8, branchId },
          { title: "The Pragmatic Programmer", author: "Andy Hunt", copiesAvailable: 6, totalCopies: 6, branchId },
          { title: "Head First Java", author: "Kathy Sierra", copiesAvailable: 12, totalCopies: 12, branchId },
        ];
      } else if (bName === "Civil Engineering") {
        booksToInsert = [
          { title: "Surveying and Levelling", author: "N.N. Basak", copiesAvailable: 15, totalCopies: 15, branchId },
          { title: "Building Construction", author: "B.C. Punmia", copiesAvailable: 10, totalCopies: 10, branchId },
          { title: "Strength of Materials", author: "R.K. Bansal", copiesAvailable: 12, totalCopies: 12, branchId },
          { title: "Fluid Mechanics", author: "Modi & Seth", copiesAvailable: 8, totalCopies: 8, branchId },
          { title: "Concrete Technology", author: "M.S. Shetty", copiesAvailable: 10, totalCopies: 10, branchId },
        ];
      } else if (bName === "Electronics") {
        booksToInsert = [
          { title: "Electronic Devices", author: "Boylestad", copiesAvailable: 10, totalCopies: 10, branchId },
          { title: "Digital Design", author: "Morris Mano", copiesAvailable: 12, totalCopies: 12, branchId },
          { title: "Microelectronic Circuits", author: "Sedra & Smith", copiesAvailable: 8, totalCopies: 8, branchId },
          { title: "Signals and Systems", author: "Oppenheim", copiesAvailable: 6, totalCopies: 6, branchId },
          { title: "Communication Systems", author: "Simon Haykin", copiesAvailable: 5, totalCopies: 5, branchId },
        ];
      } else if (bName === "Mechanical") {
        booksToInsert = [
          { title: "Engineering Thermodynamics", author: "P.K. Nag", copiesAvailable: 15, totalCopies: 15, branchId },
          { title: "Theory of Machines", author: "S.S. Rattan", copiesAvailable: 10, totalCopies: 10, branchId },
          { title: "Fluid Mechanics", author: "R.K. Bansal", copiesAvailable: 12, totalCopies: 12, branchId },
          { title: "Machine Design", author: "V.B. Bhandari", copiesAvailable: 8, totalCopies: 8, branchId },
          { title: "Manufacturing Technology", author: "P.N. Rao", copiesAvailable: 10, totalCopies: 10, branchId },
        ];
      } else if (bName === "Electrical") {
        booksToInsert = [
          { title: "Electrical Technology", author: "B.L. Theraja", copiesAvailable: 20, totalCopies: 20, branchId },
          { title: "Power Systems", author: "V.K. Mehta", copiesAvailable: 15, totalCopies: 15, branchId },
          { title: "Control Systems", author: "I.J. Nagrath", copiesAvailable: 10, totalCopies: 10, branchId },
          { title: "Electric Machinery", author: "P.S. Bimbhra", copiesAvailable: 8, totalCopies: 8, branchId },
          { title: "Circuit Theory", author: "A.Chakrabarti", copiesAvailable: 12, totalCopies: 12, branchId },
        ];
      } else {
        // Fallback
        booksToInsert = [
          { title: "General Engineering", author: "Author X", copiesAvailable: 5, totalCopies: 5, branchId },
        ];
      }

      for (const book of booksToInsert) {
        await db.insert(libraryBooks).values(book);
      }
    }
  }
  console.log("✅ Library Books created");

  // 8. Issue Books
  console.log("Issuing Books...");
  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      
      // Get books for this branch
      const books = await db.select().from(libraryBooks).where(eq(libraryBooks.branchId, branchId));
      if (books.length === 0) continue;

      // Get students for this branch
      const branchStudents = await db.select().from(students).where(eq(students.branchId, branchId));
      
      // Issue books to 10% of students
      for (const student of branchStudents) {
        if (Math.random() < 0.1) {
           const book = books[Math.floor(Math.random() * books.length)];
           if (book.copiesAvailable > 0) {
             await db.insert(bookIssues).values({
               studentId: student.id,
               bookId: book.id,
               issueDate: new Date().toISOString().split('T')[0],
               dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
               status: 'issued'
             });
             // Update copies
             await db.update(libraryBooks)
               .set({ copiesAvailable: book.copiesAvailable - 1 })
               .where(eq(libraryBooks.id, book.id));
             book.copiesAvailable--; // Update local copy
           }
        }
      }
    }
  }
  console.log("✅ Books issued");

  // 9. Create Notices
  console.log("Creating Notices...");
  for (const batch of createdBatches) {
    for (const bName of branchNames) {
      const branchId = branchMap[`${batch.id}-${bName}`];
      
      await db.insert(notices).values({
        title: `Welcome to ${bName}`,
        message: `Welcome to the new semester! Good luck with your studies.`,
        priority: 'normal',
        branchId: branchId
      });

      await db.insert(notices).values({
        title: "Mid Term Exams",
        message: "Mid Term exams will start from next week.",
        priority: 'high',
        branchId: branchId
      });
    }
  }
  console.log("✅ Notices created");

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
