import { db } from "./db";
import { students, admins, subjects, attendance, marks, libraryBooks, bookIssues } from "@shared/schema";
import { sql } from "drizzle-orm";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (() => {
  throw new Error("ADMIN_PASSWORD environment variable is required for seeding");
})();

const adminData = [
  { name: "Md Kashif", password: ADMIN_PASSWORD },
  { name: "Md Shad", password: ADMIN_PASSWORD },
  { name: "Rajesh Ranjan", password: ADMIN_PASSWORD },
  { name: "Deepak Kumar", password: ADMIN_PASSWORD },
  { name: "Rajan Kumar", password: ADMIN_PASSWORD },
];

const studentData = [
  { rollNo: "2023-CSE-01", name: "Bhaskar Kumar" },
  { rollNo: "2023-CSE-03", name: "Subhash Kumar" },
  { rollNo: "2023-CSE-04", name: "Prithvi Kumar Singh" },
  { rollNo: "2023-CSE-05", name: "Aniket Kumar" },
  { rollNo: "2023-CSE-06", name: "Sonu Kumar" },
  { rollNo: "2023-CSE-07", name: "Aman Kumar" },
  { rollNo: "2023-CSE-08", name: "Deepak Kumar" },
  { rollNo: "2023-CSE-09", name: "Neha Rani" },
  { rollNo: "2023-CSE-12", name: "Ashutosh Raj" },
  { rollNo: "2023-CSE-14", name: "Ayush Kumar" },
  { rollNo: "2023-CSE-15", name: "Md Shadwash Alam Shad" },
  { rollNo: "2023-CSE-16", name: "Sneh Sikha" },
  { rollNo: "2023-CSE-17", name: "Mukesh Gond" },
  { rollNo: "2023-CSE-18", name: "Ayush Kumar Mishra" },
  { rollNo: "2023-CSE-19", name: "Krishna Kumar" },
  { rollNo: "2023-CSE-20", name: "Sadhna Kumari" },
  { rollNo: "2023-CSE-22", name: "Abhishek Kumar" },
  { rollNo: "2023-CSE-23", name: "Aradhana Suman" },
  { rollNo: "2023-CSE-26", name: "Gaurav Kumar" },
  { rollNo: "2023-CSE-28", name: "Avinash Kumar" },
  { rollNo: "2023-CSE-29", name: "Suraj Kumar" },
  { rollNo: "2023-CSE-30", name: "Jyoti Kumari" },
  { rollNo: "2023-CSE-31", name: "Tannu Kumari" },
  { rollNo: "2023-CSE-33", name: "Sushil Kumar Verma" },
  { rollNo: "2023-CSE-34", name: "Shashikant Kumar" },
  { rollNo: "2023-CSE-35", name: "Nitish Kumar" },
  { rollNo: "2023-CSE-38", name: "Rajan Kumar" },
  { rollNo: "2023-CSE-40", name: "Kaushal Kumar" },
  { rollNo: "2023-CSE-41", name: "Rajan Kumar" },
  { rollNo: "2023-CSE-42", name: "Naveen Kumar" },
  { rollNo: "2023-CSE-43", name: "Piyush Prakash" },
  { rollNo: "2023-CSE-44", name: "Shailya Singh" },
  { rollNo: "2023-CSE-45", name: "Mithilesh Kumar" },
  { rollNo: "2023-CSE-46", name: "Rohini Kumari" },
  { rollNo: "2023-CSE-48", name: "Anjali Kumari" },
  { rollNo: "2023-CSE-51", name: "Md Kashif" },
  { rollNo: "2023-CSE-54", name: "Subodh Kumar" },
  { rollNo: "2023-CSE-55", name: "Saloni Kumari" },
  { rollNo: "2023-CSE-56", name: "Ankit Kumar Ray" },
];

const subjectData = [
  { code: "CSE101", name: "Programming in C", instructor: "Dr. Sharma" },
  { code: "CSE102", name: "Data Structures", instructor: "Prof. Kumar" },
  { code: "CSE103", name: "Database Management Systems", instructor: "Dr. Singh" },
  { code: "CSE104", name: "Web Development", instructor: "Prof. Verma" },
  { code: "CSE105", name: "Operating Systems", instructor: "Dr. Patel" },
];

const libraryBooksData = [
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", copiesAvailable: 3, totalCopies: 5 },
  { title: "Database System Concepts", author: "Abraham Silberschatz", copiesAvailable: 2, totalCopies: 4 },
  { title: "Operating System Concepts", author: "Abraham Silberschatz", copiesAvailable: 2, totalCopies: 3 },
  { title: "Computer Networks", author: "Andrew S. Tanenbaum", copiesAvailable: 4, totalCopies: 5 },
  { title: "Software Engineering", author: "Ian Sommerville", copiesAvailable: 1, totalCopies: 3 },
  { title: "The C Programming Language", author: "Brian W. Kernighan", copiesAvailable: 3, totalCopies: 4 },
  { title: "Clean Code", author: "Robert C. Martin", copiesAvailable: 2, totalCopies: 3 },
  { title: "Design Patterns", author: "Erich Gamma", copiesAvailable: 1, totalCopies: 2 },
];

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    await db.delete(bookIssues);
    await db.delete(marks);
    await db.delete(attendance);
    await db.delete(libraryBooks);
    await db.delete(subjects);
    await db.delete(students);
    await db.delete(admins);

    console.log("✅ Cleared existing data");

    // Seed admins
    const createdAdmins = await db.insert(admins).values(adminData).returning();
    console.log(`✅ Created ${createdAdmins.length} admins`);

    // Seed students with name as password
    const studentsWithPasswords = studentData.map(s => ({
      ...s,
      password: s.name.toLowerCase() // Case-insensitive password
    }));
    const createdStudents = await db.insert(students).values(studentsWithPasswords).returning();
    console.log(`✅ Created ${createdStudents.length} students`);

    // Seed subjects
    const createdSubjects = await db.insert(subjects).values(subjectData).returning();
    console.log(`✅ Created ${createdSubjects.length} subjects`);

    // Seed library books
    const createdBooks = await db.insert(libraryBooks).values(libraryBooksData).returning();
    console.log(`✅ Created ${createdBooks.length} library books`);

    // Seed sample attendance (random data)
    const attendanceRecords = [];
    const dates = ['2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-08', '2025-10-09'];
    
    for (const student of createdStudents) {
      for (const subject of createdSubjects) {
        for (const date of dates) {
          // 85% chance of being present
          const status = Math.random() > 0.15 ? 'Present' : 'Absent';
          attendanceRecords.push({
            studentId: student.id,
            subjectId: subject.id,
            date,
            status,
          });
        }
      }
    }
    
    await db.insert(attendance).values(attendanceRecords);
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // Seed sample marks
    const marksRecords = [];
    const tests = ['Test 1', 'Test 2', 'Mid-term'];
    
    for (const student of createdStudents) {
      for (const subject of createdSubjects) {
        for (const test of tests) {
          const marksObtained = Math.floor(Math.random() * 30) + 60; // 60-90
          marksRecords.push({
            studentId: student.id,
            subjectId: subject.id,
            testName: test,
            marksObtained,
            totalMarks: 100,
          });
        }
      }
    }
    
    await db.insert(marks).values(marksRecords);
    console.log(`✅ Created ${marksRecords.length} marks records`);

    // Seed sample book issues (first 10 students have issued books)
    const bookIssueRecords = [];
    for (let i = 0; i < Math.min(10, createdStudents.length); i++) {
      const student = createdStudents[i];
      const book = createdBooks[i % createdBooks.length];
      
      bookIssueRecords.push({
        studentId: student.id,
        bookId: book.id,
        issueDate: '2025-10-01',
        dueDate: '2025-10-15',
        returnDate: null,
        status: 'issued',
      });
    }
    
    if (bookIssueRecords.length > 0) {
      await db.insert(bookIssues).values(bookIssueRecords);
      console.log(`✅ Created ${bookIssueRecords.length} book issues`);
    }

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
