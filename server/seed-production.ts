import { db } from "./db";
import { students, admins, subjects, attendance, marks, libraryBooks, bookIssues } from "@shared/schema";
import { sql } from "drizzle-orm";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (() => {
  throw new Error("ADMIN_PASSWORD environment variable is required for seeding");
})();

const adminData = [
  { name: "Md Kashif", email: "mdkashif@example.com", password: ADMIN_PASSWORD },
  { name: "Md Shad", email: "mdshad@example.com", password: ADMIN_PASSWORD },
  { name: "Rajesh Ranjan", email: "rajesh@example.com", password: ADMIN_PASSWORD },
  { name: "Deepak Kumar", email: "deepak@example.com", password: ADMIN_PASSWORD },
  { name: "Rajan Kumar", email: "rajan@example.com", password: ADMIN_PASSWORD },
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

async function seedProduction() {
  console.log("🌱 Checking if production database needs seeding...");

  try {
    const [studentCount] = await db.select({ count: count() }).from(students);
    
    if (studentCount.count > 0) {
      console.log(`ℹ️  Database already has ${studentCount.count} students. Skipping seed.`);
      return;
    }

    console.log("🌱 Database is empty. Starting seed process...");

    // Seed admins
    const createdAdmins = await db.insert(admins).values(adminData).returning();
    console.log(`✅ Created ${createdAdmins.length} admins`);

    // Seed students with name as password
    const studentsWithPasswords = await Promise.all(studentData.map(async s => ({
      ...s,
      password: await bcrypt.hash(s.name.toLowerCase(), 10)
    })));
    const createdStudents = await db.insert(students).values(studentsWithPasswords).returning();
    console.log(`✅ Created ${createdStudents.length} students`);

    // Seed subjects
    const createdSubjects = await db.insert(subjects).values(subjectData).returning();
    console.log(`✅ Created ${createdSubjects.length} subjects`);

    // Seed library books
    const createdBooks = await db.insert(libraryBooks).values(libraryBooksData).returning();
    console.log(`✅ Created ${createdBooks.length} library books`);

    // Seed sample attendance (month-wise tracking)
    const attendanceRecords = [];
    const months = ['2025-09', '2025-10'];
    
    for (const student of createdStudents) {
      for (const subject of createdSubjects) {
        for (const month of months) {
          const totalDays = 25;
          const presentDays = Math.floor(Math.random() * 10) + 15;
          const percentage = (presentDays / totalDays) * 100;
          const status = percentage >= 80 ? 'Good' : percentage >= 60 ? 'Average' : 'Poor';
          
          attendanceRecords.push({
            studentId: student.id,
            subjectId: subject.id,
            month,
            totalDays,
            presentDays,
            percentage,
            status,
          });
        }
      }
    }
    
    await db.insert(attendance).values(attendanceRecords);
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // Seed sample marks
    const marksRecords = [];
    const testsData = [
      { month: '2025-09', name: 'Test 1' },
      { month: '2025-09', name: 'Mid-term' },
      { month: '2025-10', name: 'Test 2' },
    ];
    
    for (const student of createdStudents) {
      for (const subject of createdSubjects) {
        for (const test of testsData) {
          const marksObtained = Math.floor(Math.random() * 30) + 60;
          const totalMarks = 100;
          const percentage = (marksObtained / totalMarks) * 100;
          const grade = percentage >= 90 ? 'A+' : 
                       percentage >= 80 ? 'A' : 
                       percentage >= 70 ? 'B+' : 
                       percentage >= 60 ? 'B' : 
                       percentage >= 50 ? 'C' : 
                       percentage >= 40 ? 'D' : 'F';
          
          marksRecords.push({
            studentId: student.id,
            subjectId: subject.id,
            month: test.month,
            testName: test.name,
            marksObtained,
            totalMarks,
            percentage,
            grade,
          });
        }
      }
    }
    
    await db.insert(marks).values(marksRecords);
    console.log(`✅ Created ${marksRecords.length} marks records`);

    // Seed sample book issues
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

    console.log("🎉 Production database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding production database:", error);
    throw error;
  }
}

seedProduction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
