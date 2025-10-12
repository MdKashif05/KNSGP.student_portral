import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireStudent } from "./auth";
import { 
  insertStudentSchema,
  insertAdminSchema,
  insertSubjectSchema,
  insertAttendanceSchema,
  insertMarksSchema,
  insertLibraryBookSchema,
  insertBookIssueSchema,
  insertNoticeSchema
} from "@shared/schema";

// Helper function to calculate attendance status
function calculateAttendanceStatus(percentage: number): string {
  if (percentage >= 80) return 'Good';
  if (percentage >= 60) return 'Average';
  return 'Poor';
}

// Helper function to calculate grade
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== AUTH ROUTES ==========
  
  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ 
          message: "Username, password, and role are required" 
        });
      }

      // Trim inputs to remove whitespace
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (role === 'admin') {
        // Admin login
        const admin = await storage.getAdminByName(trimmedUsername);
        
        if (!admin) {
          return res.status(401).json({ 
            message: "Invalid admin username" 
          });
        }

        if (admin.password !== trimmedPassword) {
          return res.status(401).json({ 
            message: "Invalid password" 
          });
        }

        req.session.userId = admin.id;
        req.session.userRole = 'admin';
        req.session.username = admin.name;

        return res.json({ 
          success: true,
          user: {
            id: admin.id,
            name: admin.name,
            role: 'admin'
          }
        });

      } else if (role === 'student') {
        // Student login (case-insensitive password)
        const student = await storage.getStudentByRollNo(trimmedUsername);
        
        if (!student) {
          return res.status(401).json({ 
            message: "Invalid roll number" 
          });
        }

        // Case-insensitive password check (trim both sides)
        if (student.password.toLowerCase().trim() !== trimmedPassword.toLowerCase()) {
          return res.status(401).json({ 
            message: "Invalid password" 
          });
        }

        req.session.userId = student.id;
        req.session.userRole = 'student';
        req.session.username = student.rollNo;

        return res.json({ 
          success: true,
          user: {
            id: student.id,
            rollNo: student.rollNo,
            name: student.name,
            role: 'student'
          }
        });
      } else {
        return res.status(400).json({ 
          message: "Invalid role" 
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        message: "Login failed", 
        error: error.message 
      });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole === 'admin') {
        const admin = await storage.getAdminByName(req.session.username!);
        if (!admin) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.json({
          id: admin.id,
          name: admin.name,
          role: 'admin'
        });
      } else {
        const student = await storage.getStudentByRollNo(req.session.username!);
        if (!student) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.json({
          id: student.id,
          rollNo: student.rollNo,
          name: student.name,
          role: 'student'
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: "Error fetching user", error: error.message });
    }
  });

  // ========== STUDENT ROUTES (Admin only for write operations) ==========
  
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      
      // Get attendance and marks stats for each student
      const studentsWithStats = await Promise.all(students.map(async (student) => {
        const attendanceRecords = await storage.getAttendanceByStudent(student.id);
        const marksRecords = await storage.getMarksByStudent(student.id);
        const bookIssues = await storage.getBookIssuesByStudent(student.id);
        
        // Calculate average attendance percentage from monthly records
        const attendancePercentage = attendanceRecords.length > 0 
          ? (attendanceRecords.reduce((sum, a) => sum + a.percentage, 0) / attendanceRecords.length).toFixed(1) 
          : '0.0';
        
        // Calculate average marks percentage
        const avgMarksPercentage = marksRecords.length > 0 
          ? (marksRecords.reduce((sum, m) => sum + m.percentage, 0) / marksRecords.length).toFixed(1) 
          : '0.0';
        
        // Count issued books (not returned)
        const booksIssued = bookIssues.filter(b => b.status === 'issued').length;
        
        return {
          ...student,
          attendancePercentage,
          avgMarks: avgMarksPercentage,
          booksIssued
        };
      }));
      
      res.json(studentsWithStats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching students", error: error.message });
    }
  });

  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating student", error: error.message });
    }
  });

  app.put("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.updateStudent(id, req.body);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating student", error: error.message });
    }
  });

  app.delete("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStudent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ success: true, message: "Student deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting student", error: error.message });
    }
  });

  // ========== SUBJECT ROUTES ==========
  
  app.get("/api/subjects", requireAuth, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subjects", error: error.message });
    }
  });

  app.post("/api/subjects", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating subject", error: error.message });
    }
  });

  app.put("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.updateSubject(id, req.body);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating subject", error: error.message });
    }
  });

  app.delete("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSubject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json({ success: true, message: "Subject deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting subject", error: error.message });
    }
  });

  // ========== ATTENDANCE ROUTES ==========
  
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      let attendanceRecords;
      if (req.session.userRole === 'student') {
        // Students can only see their own attendance
        attendanceRecords = await storage.getAttendanceByStudent(req.session.userId!);
      } else {
        // Admins can see all attendance
        attendanceRecords = await storage.getAllAttendance();
      }
      res.json(attendanceRecords);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching attendance", error: error.message });
    }
  });

  app.post("/api/attendance", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      
      // Auto-calculate percentage and status
      const percentage = (validatedData.presentDays / validatedData.totalDays) * 100;
      const status = calculateAttendanceStatus(percentage);
      
      const attendanceData = {
        ...validatedData,
        percentage,
        status
      };
      
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating attendance", error: error.message });
    }
  });

  app.put("/api/attendance/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Auto-calculate percentage and status if totalDays and presentDays are provided
      let updateData = req.body;
      if (req.body.totalDays && req.body.presentDays) {
        const percentage = (req.body.presentDays / req.body.totalDays) * 100;
        const status = calculateAttendanceStatus(percentage);
        updateData = {
          ...req.body,
          percentage,
          status
        };
      }
      
      const attendance = await storage.updateAttendance(id, updateData);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating attendance", error: error.message });
    }
  });

  app.delete("/api/attendance/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAttendance(id);
      if (!deleted) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json({ success: true, message: "Attendance record deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting attendance", error: error.message });
    }
  });

  // ========== MARKS ROUTES ==========
  
  app.get("/api/marks", requireAuth, async (req, res) => {
    try {
      let marksRecords;
      if (req.session.userRole === 'student') {
        // Students can only see their own marks
        marksRecords = await storage.getMarksByStudent(req.session.userId!);
      } else {
        // Admins can see all marks
        marksRecords = await storage.getAllMarks();
      }
      res.json(marksRecords);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching marks", error: error.message });
    }
  });

  app.post("/api/marks", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertMarksSchema.parse(req.body);
      
      // Auto-calculate percentage and grade
      const percentage = (validatedData.marksObtained / validatedData.totalMarks) * 100;
      const grade = calculateGrade(percentage);
      
      const marksData = {
        ...validatedData,
        percentage,
        grade
      };
      
      const marks = await storage.createMarks(marksData);
      res.status(201).json(marks);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating marks", error: error.message });
    }
  });

  app.put("/api/marks/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Auto-calculate percentage and grade if marksObtained and totalMarks are provided
      let updateData = req.body;
      if (req.body.marksObtained !== undefined && req.body.totalMarks !== undefined) {
        const percentage = (req.body.marksObtained / req.body.totalMarks) * 100;
        const grade = calculateGrade(percentage);
        updateData = {
          ...req.body,
          percentage,
          grade
        };
      }
      
      const marks = await storage.updateMarks(id, updateData);
      if (!marks) {
        return res.status(404).json({ message: "Marks record not found" });
      }
      res.json(marks);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating marks", error: error.message });
    }
  });

  app.delete("/api/marks/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMarks(id);
      if (!deleted) {
        return res.status(404).json({ message: "Marks record not found" });
      }
      res.json({ success: true, message: "Marks record deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting marks", error: error.message });
    }
  });

  // ========== LIBRARY ROUTES ==========
  
  app.get("/api/library/books", requireAuth, async (req, res) => {
    try {
      const books = await storage.getAllLibraryBooks();
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching library books", error: error.message });
    }
  });

  app.post("/api/library/books", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertLibraryBookSchema.parse(req.body);
      const book = await storage.createLibraryBook(validatedData);
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating library book", error: error.message });
    }
  });

  app.put("/api/library/books/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.updateLibraryBook(id, req.body);
      if (!book) {
        return res.status(404).json({ message: "Library book not found" });
      }
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating library book", error: error.message });
    }
  });

  app.delete("/api/library/books/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLibraryBook(id);
      if (!deleted) {
        return res.status(404).json({ message: "Library book not found" });
      }
      res.json({ success: true, message: "Library book deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting library book", error: error.message });
    }
  });

  // Book issues
  app.get("/api/library/issues", requireAuth, async (req, res) => {
    try {
      let bookIssues;
      if (req.session.userRole === 'student') {
        bookIssues = await storage.getBookIssuesByStudent(req.session.userId!);
      } else {
        bookIssues = await storage.getAllBookIssues();
      }
      res.json(bookIssues);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching book issues", error: error.message });
    }
  });

  app.post("/api/library/issues", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBookIssueSchema.parse(req.body);
      const bookIssue = await storage.createBookIssue(validatedData);
      res.status(201).json(bookIssue);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating book issue", error: error.message });
    }
  });

  app.put("/api/library/issues/:id/return", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { returnDate } = req.body;
      const bookIssue = await storage.returnBook(id, returnDate);
      if (!bookIssue) {
        return res.status(404).json({ message: "Book issue not found" });
      }
      res.json(bookIssue);
    } catch (error: any) {
      res.status(400).json({ message: "Error returning book", error: error.message });
    }
  });

  // ========== NOTICE ROUTES ==========
  
  app.get("/api/notices", requireAuth, async (req, res) => {
    try {
      const notices = await storage.getAllNotices();
      res.json(notices);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching notices", error: error.message });
    }
  });

  app.get("/api/notices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notice = await storage.getNoticeById(id);
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }
      res.json(notice);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching notice", error: error.message });
    }
  });

  app.post("/api/notices", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.status(201).json(notice);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating notice", error: error.message });
    }
  });

  app.put("/api/notices/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNoticeSchema.partial().parse(req.body);
      const notice = await storage.updateNotice(id, validatedData);
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }
      res.json(notice);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating notice", error: error.message });
    }
  });

  app.delete("/api/notices/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNotice(id);
      if (!deleted) {
        return res.status(404).json({ message: "Notice not found" });
      }
      res.json({ success: true, message: "Notice deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting notice", error: error.message });
    }
  });

  // ========== CHATBOT ROUTES ==========
  
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Import OpenAI client
      const openai = (await import("./lib/openai")).default;

      // SBTE Bihar information context
      const sbteContext = `
You are an AI assistant for the CSE Student Portal at Kameshwar Narayan Singh Govt Polytechnic College, affiliated with SBTE Bihar (State Board of Technical Education, Bihar).

Current SBTE Bihar Information (October 2025):

EXAM SCHEDULES & REGISTRATION:
- Exam form fill-up for December 2025 exam is ongoing (as of Oct 5, 2025)
- First Semester Session 2025 and Third Semester Lateral Entry (L.E.) Session 2024 registration extended till 11/10/2025
- Registration was open from 22.09.2025 to 04.10.2025, now extended

RECENT ANNOUNCEMENTS:
- Polytechnic State Topper List 2025 announced (Sept 6)
- Government Engineering State Topper List 2025 announced (Sept 6)
- Hiring of diploma engineers by JTEKT India Ltd. (Aug 17, 2025)
- Pool Campus Placement drives ongoing (Nagata Auto Engineering India, Macleods Pharmaceuticals)

ABOUT SBTE BIHAR:
- Responsible for evaluation and certification of six-semester Diploma Courses
- Affiliated polytechnic institutions across Bihar
- Constituted on May 31, 1955
- Under Science, Technology and Technical Education Department, Government of Bihar
- Contact: Toll Free 18002020305, Email: sbtebihar@bihar.gov.in
- Address: 4th Floor, Technology Bhawan, Vishweshariya Bhawan Campus, Bailey Road Patna, Bihar PIN - 800015

AVAILABLE PORTALS:
- EMS Portal (sbteonline.bihar.gov.in/login)
- LMS Portal - Moodle (sbtelms.bihar.gov.in)
- Affiliation Portal
- Document Verification Status portal

COURSES & PROGRAMS:
- Six-semester Diploma Courses in various engineering fields
- Certificate programs in technology
- Focus areas: Computer Science Engineering, Mechanical, Civil, Electrical, Electronics, etc.

Provide helpful, accurate responses about SBTE Bihar, exam schedules, registration, courses, and general polytechnic education information. If asked about specific student data or portal access, guide them to the appropriate official portals or admin.
`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: sbteContext
          },
          {
            role: "user",
            content: message
          }
        ],
        max_completion_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({ 
        message: "Error processing chat message", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
