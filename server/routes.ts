import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireSuperAdmin, requireStudent } from "./auth";
import bcrypt from "bcryptjs";
import { 
  insertStudentSchema,
  insertAdminSchema,
  insertSubjectSchema,
  insertAttendanceSchema,
  insertMarksSchema,
  insertLibraryBookSchema,
  insertBookIssueSchema,
  insertNoticeSchema,
  insertBatchSchema,
  insertBranchSchema,
  insertDailyAttendanceSchema,
  insertExamSchema,
  insertExamMarksSchema
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

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== CHATBOT ROUTE ==========
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "Gemini API key is not configured" });
      }

      // Fallback to the most stable model name "gemini-pro" or "gemini-1.5-flash-latest"
      // Based on error "gemini-1.5-flash is not found", it might be region restricted or the library version is old.
      // Let's try "gemini-1.5-flash" again, but fallback to "gemini-pro" if needed.
      // Actually, for google-generative-ai library, "gemini-pro" is the standard alias.
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chat = model.startChat({
        history: history || [],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Add a system instruction prompt to guide the AI
      const systemInstruction = `You are Edumanage AI, a helpful and knowledgeable assistant for the College Student Management System.
      Your goal is to assist students and admins with any questions they have, whether about the system, education, or general knowledge.
      Be polite, professional, and encouraging.
      If asked about specific college data (like "what are my marks"), explain that you can't access their private records directly yet for security reasons, but guide them on how to check it in the dashboard.
      Always answer in a clear and concise manner.`;

      // Combine system instruction with user message for context
      const fullMessage = `${systemInstruction}\n\nUser Question: ${message}`;

      const result = await chat.sendMessage(fullMessage);
      const response = await result.response;
      const text = response.text();

      res.json({ response: text });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({ message: "Failed to generate response", error: error.message });
    }
  });

  // ========== SETUP ROUTE (For First-Time Deployment) ==========
  app.get("/api/seed", async (req, res) => {
    try {
      // Check if any admin exists
      const admins = await storage.getAllAdmins();
      if (admins.length > 0) {
        return res.json({ message: "Database already initialized. Admin exists." });
      }

      // Create default admin
      const hashedPassword = await bcrypt.hash("Knsgp2023", 10);
      await storage.createAdmin({
        name: "Md Kashif",
        password: hashedPassword,
        role: "super_admin",
        email: "admin@knsgp.ac.in",
        status: "active"
      });

      return res.json({ 
        success: true, 
        message: "Database initialized! Default admin created.",
        credentials: {
          username: "Md Kashif",
          password: "Knsgp2023 (Change this immediately!)"
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Setup failed", error: error.message });
    }
  });

  // ========== DATA SEEDING ROUTE (For Demo/Testing) ==========
  app.get("/api/seed-data", requireSuperAdmin, async (req, res) => {
    try {
      console.log("[Seed] Starting comprehensive data seeding/fixing...");
      
      // 1. Ensure Batch exists
      let batch = (await storage.getAllBatches())[0];
      if (!batch) {
        batch = await storage.createBatch({
          name: "2023-2026",
          startYear: 2023,
          endYear: 2026
        });
        console.log("[Seed] Created default batch");
      }

      // 2. Ensure Branches exist
      const branchesData = [
        { name: "Civil Engineering" },
        { name: "Computer Science & Engineering" },
        { name: "Electrical Engineering" },
        { name: "Electronics Engineering" },
        { name: "Mechanical Engineering" }
      ];

      const branchesMap = new Map();
      const existingBranches = await storage.getBranchesByBatch(batch.id);
      
      // Map existing
      for (const b of existingBranches) {
        branchesMap.set(b.name, b.id);
      }

      // Create missing
      for (const b of branchesData) {
        if (!branchesMap.has(b.name)) {
          const branch = await storage.createBranch({ ...b, batchId: batch.id });
          branchesMap.set(b.name, branch.id);
          console.log(`[Seed] Created branch: ${b.name}`);
        }
      }

      // 3. Ensure Subjects exist
      const subjectsData = [
        // CSE
        { code: "CSE301", name: "Data Structures", department: "CSE", branchId: branchesMap.get("Computer Science & Engineering"), semester: 3, totalMarks: 100 },
        { code: "CSE302", name: "Digital Electronics", department: "CSE", branchId: branchesMap.get("Computer Science & Engineering"), semester: 3, totalMarks: 100 },
        { code: "CSE303", name: "Object Oriented Programming", department: "CSE", branchId: branchesMap.get("Computer Science & Engineering"), semester: 3, totalMarks: 100 },
        // Civil
        { code: "CE301", name: "Fluid Mechanics", department: "CE", branchId: branchesMap.get("Civil Engineering"), semester: 3, totalMarks: 100 },
        { code: "CE302", name: "Surveying", department: "CE", branchId: branchesMap.get("Civil Engineering"), semester: 3, totalMarks: 100 },
      ];

      const subjectsMap = new Map();
      const existingSubjects = await storage.getAllSubjects();
      for (const s of existingSubjects) {
        subjectsMap.set(s.code, s.id);
      }

      for (const s of subjectsData) {
        if (!subjectsMap.has(s.code) && s.branchId) { // Only create if branch exists
          const subject = await storage.createSubject(s);
          subjectsMap.set(s.code, subject.id);
          console.log(`[Seed] Created subject: ${s.code}`);
        }
      }

      // 4. Fix Students (Generate Stats for ALL students)
      const allStudents = (await storage.getAllStudents(1000, 0)).data;
      console.log(`[Seed] Found ${allStudents.length} students. Generating stats...`);

      const hashedPassword = await bcrypt.hash("password123", 10);

      // Create dummy students if none exist
      if (allStudents.length === 0) {
          const departments = ["CSE", "CE", "EE", "ECE", "ME"];
          const getBranchId = (dept: string) => {
            if (dept === "CSE") return branchesMap.get("Computer Science & Engineering");
            if (dept === "CE") return branchesMap.get("Civil Engineering");
            if (dept === "EE") return branchesMap.get("Electrical Engineering");
            if (dept === "ECE") return branchesMap.get("Electronics Engineering");
            if (dept === "ME") return branchesMap.get("Mechanical Engineering");
            return undefined;
          };

          for (let i = 1; i <= 50; i++) {
            const dept = i <= 20 ? "CSE" : (i <= 30 ? "CE" : "EE");
            const branchId = getBranchId(dept);
            const student = await storage.createStudent({
              rollNo: `2023-${dept}-${i.toString().padStart(3, '0')}`,
              name: `Student ${i}`,
              password: hashedPassword,
              department: dept,
              branchId: branchId,
              semester: 3
            });
            allStudents.push(student);
          }
          console.log("[Seed] Created 50 dummy students");
      }

      // Generate Stats for everyone
      let statsCount = 0;
      for (const student of allStudents) {
        // Check if stats already exist
        const existingAttendance = await storage.getAttendanceByStudent(student.id);
        if (existingAttendance.length > 0) continue; // Skip if already has data

        // Generate Attendance
        const rand = Math.random();
        let percentage = 0;
        if (rand > 0.2) percentage = 80 + Math.random() * 20; 
        else if (rand > 0.1) percentage = 60 + Math.random() * 20; 
        else percentage = 30 + Math.random() * 30; 

        const totalDays = 24; 
        const presentDays = Math.round((percentage / 100) * totalDays);
        
        // Find relevant subjects based on department or branch
        // If student has branchId, use subjects for that branch
        // If student has department, use subjects for that department
        let relevantSubjects: any[] = [];
        
        // Match by Branch ID first
        if (student.branchId) {
             relevantSubjects = subjectsData.filter(sub => sub.branchId === student.branchId);
             // If local subjectsData doesn't have IDs yet (because we just mapped codes), we need to look up IDs
        } 
        
        // Fallback: Match by Department string
        if (relevantSubjects.length === 0 && student.department) {
             relevantSubjects = subjectsData.filter(sub => sub.department === student.department);
        }

        // Use the map to get actual DB IDs
        for (const subj of relevantSubjects) {
           const subjectId = subjectsMap.get(subj.code);
           if (subjectId) {
             await storage.createAttendance({
               studentId: student.id,
               subjectId: subjectId,
               month: "2023-10",
               totalDays,
               presentDays,
               percentage: (presentDays / totalDays) * 100,
               status: calculateAttendanceStatus((presentDays / totalDays) * 100)
             });

             const marksObtained = Math.floor(Math.random() * 100); 
             await storage.createMarks({
               studentId: student.id,
               subjectId: subjectId,
               month: "2023-10",
               testName: "Mid Semester",
               totalMarks: 100,
               marksObtained,
               percentage: marksObtained,
               grade: calculateGrade(marksObtained)
             });
             statsCount++;
           }
        }
      }
      console.log(`[Seed] Generated stats for ${statsCount} records`);

      // 5. Create Library Books (if empty)
      const books = await storage.getAllLibraryBooks();
      if (books.length === 0) {
        await storage.createLibraryBook({ title: "Introduction to Algorithms", author: "Cormen", copiesAvailable: 5, totalCopies: 10, branchId: branchesMap.get("Computer Science & Engineering") });
        await storage.createLibraryBook({ title: "Clean Code", author: "Robert C. Martin", copiesAvailable: 3, totalCopies: 5, branchId: branchesMap.get("Computer Science & Engineering") });
        await storage.createLibraryBook({ title: "Fluid Mechanics", author: "R.K. Bansal", copiesAvailable: 8, totalCopies: 10, branchId: branchesMap.get("Civil Engineering") });
      }

      // 6. Create Notices (if empty)
      const notices = await storage.getAllNotices();
      if (notices.length === 0) {
        await storage.createNotice({ title: "Mid-Sem Exams", message: "Mid-semester exams will start from 25th Oct.", priority: "high", branchId: undefined });
        await storage.createNotice({ title: "CSE Workshop", message: "AI Workshop on Saturday.", priority: "normal", branchId: branchesMap.get("Computer Science & Engineering") });
      }

      res.json({ success: true, message: "Data fixed/seeded successfully!" });
    } catch (error: any) {
      console.error("Seeding error:", error);
      res.status(500).json({ message: "Seeding failed", error: error.message });
    }
  });

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

      // Check for maintenance mode
      if (process.env.MAINTENANCE_MODE === 'true') {
        return res.status(503).json({
          message: "System is currently under maintenance. Please try again later."
        });
      }

      if (role === 'admin') {
        // Admin login
        const admin = await storage.getAdminByName(trimmedUsername);
        
        if (!admin) {
          return res.status(401).json({ 
            message: "Invalid admin username" 
          });
        }

        const isValid = await bcrypt.compare(trimmedPassword, admin.password);
        if (!isValid) {
          return res.status(401).json({ 
            message: "Invalid password" 
          });
        }
        
        if (admin.status !== 'active') {
          return res.status(403).json({
            message: "Account is inactive"
          });
        }
        
        // Update last login
        await storage.updateAdmin(admin.id, { lastLogin: new Date() });

        req.session.userId = admin.id;
        req.session.userRole = 'admin';
        req.session.adminRole = admin.role as 'admin' | 'super_admin';
        req.session.username = admin.name;

        // Log login action
        await storage.createAuditLog({
          adminId: admin.id,
          action: "LOGIN",
          details: "Admin logged in",
          ipAddress: req.ip
        });

        // Force save session to ensure cookie is set before response
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        return res.json({ 
          success: true,
          user: {
            id: admin.id,
            name: admin.name,
            role: 'admin',
            adminRole: admin.role
          }
        });

      } else if (role === 'student') {
        // Student login
        // Check for invalid roll number format (allow alphanumeric, hyphens, slashes, dots)
        if (!/^[A-Z0-9-./]+$/i.test(trimmedUsername)) {
          return res.status(400).json({ 
            message: "Invalid student ID format" 
          });
        }

        const student = await storage.getStudentByRollNo(trimmedUsername);
        
        if (!student) {
          return res.status(401).json({ 
            message: "Invalid roll number" 
          });
        }

        // Check for account lockout
        if (student.lockoutUntil && new Date(student.lockoutUntil) > new Date()) {
          const remainingTime = Math.ceil((new Date(student.lockoutUntil).getTime() - Date.now()) / 60000);
          return res.status(403).json({
            message: `Account locked. Please try again in ${remainingTime} minutes.`
          });
        }

        // Verify password
        // First check if the password matches the stored hash
        let isValid = await bcrypt.compare(trimmedPassword, student.password);
        
        // Fallback: check if password matches directly (for legacy/seeded data)
        if (!isValid) {
           // Only allow plaintext match if the stored password exactly matches the input
           // This prevents the security issue where the name works as a password even after changing it
           isValid = trimmedPassword === student.password;
        }

        if (!isValid) {
          const attempts = (student.failedLoginAttempts ?? 0) + 1;
          let updateData: any = { failedLoginAttempts: attempts };
          let message = "Invalid password";

          if (attempts >= 10) {
            const lockoutTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
            updateData.lockoutUntil = lockoutTime;
            message = "Account locked due to multiple failed attempts. Please try again in 2 minutes.";
            await storage.updateStudent(student.id, updateData);
            return res.status(403).json({ message });
          } else {
            await storage.updateStudent(student.id, updateData);
            return res.status(401).json({ 
              message: `${message}. ${10 - attempts} attempts remaining.` 
            });
          }
        }

        // Successful login - reset failed attempts
        if ((student.failedLoginAttempts ?? 0) > 0 || student.lockoutUntil) {
          await storage.updateStudent(student.id, { 
            failedLoginAttempts: 0, 
            lockoutUntil: null 
          });
        }

        req.session.userId = student.id;
        req.session.userRole = 'student';
        req.session.username = student.rollNo;

        // Force save session to ensure cookie is set before response
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        return res.json({ 
          success: true,
          user: {
            id: student.id,
            rollNo: student.rollNo,
            name: student.name,
            role: 'student',
            branchId: student.branchId
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
          role: 'admin',
          adminRole: admin.role
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
          role: 'student',
          branchId: student.branchId,
          hasSecurityQuestion: !!student.securityQuestion
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: "Error fetching user", error: error.message });
    }
  });

  // Change student password
  app.post("/api/students/change-password", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole !== 'student') {
        return res.status(403).json({ message: "Only students can change their password here" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const student = await storage.getStudentByRollNo(req.session.username!);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify current password
      // 1. Try Trimmed Input vs Trimmed Stored Password (Direct)
      const inputPass = currentPassword.trim();
      const storedPass = student.password;
      
      console.log(`[Password Change] Roll: ${student.rollNo}`);
      console.log(`[Password Change] Input: '${inputPass}'`);
      console.log(`[Password Change] Stored: '${storedPass}'`);

      // 2. Try bcrypt
      let isValid = await bcrypt.compare(inputPass, storedPass);
      
      // 3. Fallback: plaintext check
      if (!isValid) {
        isValid = inputPass === storedPass;
      }

      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateStudent(student.id, { password: hashedPassword });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error changing password", error: error.message });
    }
  });

  // Change admin password
  app.post("/api/admin/change-password", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Only admins can change their password here" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const admin = await storage.getAdminByName(req.session.username!);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateAdmin(admin.id, { password: hashedPassword });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error changing password", error: error.message });
    }
  });

  // Set Security Question
  app.post("/api/students/security-question", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole !== 'student') {
        return res.status(403).json({ message: "Only students can set security questions" });
      }

      const { question, answer, password } = req.body;
      if (!question || !answer || !password) {
        return res.status(400).json({ message: "Question, answer and current password are required" });
      }

      const student = await storage.getStudentByRollNo(req.session.username!);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, student.password) || password === student.password;
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Hash answer
      const hashedAnswer = await bcrypt.hash(answer.toLowerCase().trim(), 10);

      await storage.updateStudent(student.id, {
        securityQuestion: question,
        securityAnswer: hashedAnswer
      });

      res.json({ success: true, message: "Security question set successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error setting security question", error: error.message });
    }
  });

  // Reset Password (using Security Question)
  app.post("/api/students/reset-password", async (req, res) => {
    try {
      const { rollNo, answer, newPassword } = req.body;
      if (!rollNo || !answer || !newPassword) {
        return res.status(400).json({ message: "Roll number, answer and new password are required" });
      }

      const student = await storage.getStudentByRollNo(rollNo);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!student.securityQuestion || !student.securityAnswer) {
        return res.status(400).json({ message: "Security question not set for this account" });
      }

      // Verify answer
      const isValid = await bcrypt.compare(answer.toLowerCase().trim(), student.securityAnswer);
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect security answer" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateStudent(student.id, { 
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockoutUntil: null
      });

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error resetting password", error: error.message });
    }
  });

  // Get Security Question
  app.get("/api/students/security-question/:rollNo", async (req, res) => {
    try {
      const student = await storage.getStudentByRollNo(req.params.rollNo);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!student.securityQuestion) {
        return res.status(404).json({ message: "Security question not set" });
      }

      res.json({ question: student.securityQuestion });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching security question", error: error.message });
    }
  });

  // Admin Management Routes
  app.get("/api/admins", requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      // Filter out sensitive data
      const safeAdmins = admins.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }));
      res.json(safeAdmins);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching admins", error: error.message });
    }
  });

  app.post("/api/admins", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      
      const existing = await storage.getAdminByName(validatedData.name);
      if (existing) {
        return res.status(409).json({ message: "Admin with this name already exists" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const admin = await storage.createAdmin({
        ...validatedData,
        password: hashedPassword
      });

      res.status(201).json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      });
    } catch (error: any) {
      res.status(400).json({ message: "Error creating admin", error: error.message });
    }
  });

  app.put("/api/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData = req.body;

      // Don't allow changing own role if you are the only super admin (simplified check)
      if (id === req.session.userId && updateData.role && updateData.role !== 'super_admin') {
         return res.status(403).json({ message: "Cannot demote yourself" });
      }

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const admin = await storage.updateAdmin(id, updateData);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      });
    } catch (error: any) {
      res.status(400).json({ message: "Error updating admin", error: error.message });
    }
  });

  app.delete("/api/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (id === req.session.userId) {
        return res.status(403).json({ message: "Cannot delete yourself" });
      }

      const deleted = await storage.deleteAdmin(id);
      if (!deleted) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({ success: true, message: "Admin deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting admin", error: error.message });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", requireSuperAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAllAuditLogs(limit, offset);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching audit logs", error: error.message });
    }
  });

  // ========== STUDENT ROUTES ==========
  
  app.get("/api/students", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const department = (req.query.department as string) || undefined;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;

      const { data, total } = await storage.getAllStudents(limit, offset, search, department, branchId, batchId);
      
      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error("[API] FULL STUDENT ERROR:", error);
      res.status(500).json({ message: "Error fetching students", error: error.message });
    }
  });

  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      
      const existing = await storage.getStudentByRollNo(validatedData.rollNo);
      if (existing) {
        return res.status(409).json({ message: "A student with this roll number already exists" });
      }
      
      // Hash password before creating
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const studentData = { ...validatedData, password: hashedPassword };
      
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating student", error: error.message });
    }
  });

  app.put("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      let updateData = req.body;

      if (updateData.rollNo) {
        const existing = await storage.getStudentByRollNo(updateData.rollNo);
        if (existing && existing.id !== id) {
          return res.status(409).json({ message: "Another student already has this roll number" });
        }
      }
      
      // If password is being updated, hash it
      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        updateData = { ...updateData, password: hashedPassword };
      }
      
      const student = await storage.updateStudent(id, updateData);
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

  // ========== BATCH & BRANCH ROUTES ==========

  // Batches
  app.get("/api/batches", requireAuth, async (req, res) => {
    try {
      console.log("GET /api/batches request received");
      const batches = await storage.getAllBatches();
      console.log("Fetched batches:", batches);
      res.json(batches);
    } catch (error: any) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ message: "Error fetching batches", error: error.message });
    }
  });

  app.post("/api/batches", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(validatedData);
      res.status(201).json(batch);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating batch", error: error.message });
    }
  });

  app.put("/api/batches/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const batch = await storage.updateBatch(id, req.body);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      res.json(batch);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating batch", error: error.message });
    }
  });

  app.delete("/api/batches/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBatch(id);
      if (!deleted) {
        return res.status(404).json({ message: "Batch not found" });
      }
      res.json({ success: true, message: "Batch deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting batch", error: error.message });
    }
  });

  // Branches
  app.get("/api/branches", requireAuth, async (req, res) => {
    try {
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      
      let branches;
      if (batchId) {
        branches = await storage.getBranchesByBatch(batchId);
      } else {
        branches = await storage.getAllBranches();
      }
      
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching branches", error: error.message });
    }
  });

  app.post("/api/branches", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(validatedData);
      res.status(201).json(branch);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating branch", error: error.message });
    }
  });

  app.put("/api/branches/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const branch = await storage.updateBranch(id, req.body);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating branch", error: error.message });
    }
  });

  app.delete("/api/branches/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBranch(id);
      if (!deleted) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json({ success: true, message: "Branch deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting branch", error: error.message });
    }
  });

  // ========== SUBJECT ROUTES ==========
  
  app.get("/api/subjects", requireAuth, async (req, res) => {
    try {
      const department = (req.query.department as string) || undefined;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      const subjects = await storage.getAllSubjects(department, branchId, batchId);
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
      if (req.session.userRole === 'student') {
        // Students can only see their own attendance
        const attendanceRecords = await storage.getAttendanceByStudent(req.session.userId!);
        return res.json(attendanceRecords);
      } else {
        // Admins can see all attendance (paginated)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 1000;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string) || "";
        const department = (req.query.department as string) || undefined;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;

        const { data, total } = await storage.getAllAttendance(limit, offset, search, department, branchId, batchId);
         
         return res.json({
           data: data,
           pagination: {
             page,
             limit,
             total,
             totalPages: Math.ceil(total / limit)
           }
         });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching attendance", error: error.message });
    }
  });

  // ========== DAILY ATTENDANCE ROUTES (Calendar System) ==========
  
  app.get("/api/attendance/daily", requireAuth, async (req, res) => {
    try {
      const date = req.query.date as string;
      const subjectId = parseInt(req.query.subjectId as string);

      if (!date || isNaN(subjectId)) {
        return res.status(400).json({ message: "Date and Subject ID are required" });
      }

      console.log(`[API] Fetching daily attendance: date=${date}, subjectId=${subjectId}`);

      const attendance = await storage.getDailyAttendance(date, subjectId);
      console.log(`[API] Found ${attendance.length} attendance records`);
      res.json(attendance);
    } catch (error: any) {
      console.error("[API] Error fetching daily attendance:", error);
      res.status(500).json({ message: "Error fetching daily attendance", error: error.message });
    }
  });

  app.post("/api/attendance/daily", requireAdmin, async (req, res) => {
    try {
      const records = req.body.records;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Records must be an array" });
      }

      console.log(`[API] Saving daily attendance: ${records.length} records`);

      // Validate records
      const validatedRecords = records.map(r => insertDailyAttendanceSchema.parse(r));
      
      const results = await storage.markDailyAttendance(validatedRecords);
      console.log(`[API] Successfully saved ${results.length} records`);
      res.status(201).json(results);
    } catch (error: any) {
      console.error("[API] Error saving daily attendance:", error);
      res.status(400).json({ message: "Error marking daily attendance", error: error.message });
    }
  });

  app.get("/api/attendance/:studentId", requireAuth, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const attendanceRecords = await storage.getAttendanceByStudent(studentId);
      res.json(attendanceRecords);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching attendance", error: error.message });
    }
  });

  app.post("/api/attendance/batch", requireAdmin, async (req, res) => {
    try {
      const records = req.body.records;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Records must be an array" });
      }

      const processedRecords = records.map(record => {
        const validatedData = insertAttendanceSchema.parse(record);
        const percentage = (validatedData.presentDays / validatedData.totalDays) * 100;
        const status = calculateAttendanceStatus(percentage);
        return {
          ...validatedData,
          percentage,
          status
        };
      });

      const results = await storage.createAttendanceBatch(processedRecords);

      // Log action
      await storage.createAuditLog({
        adminId: req.session.userId,
        action: "BATCH_CREATE_ATTENDANCE",
        details: `Created ${results.length} attendance records`,
        ipAddress: req.ip
      });

      res.status(201).json(results);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating attendance batch", error: error.message });
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
      if (req.session.userRole === 'student') {
        // Students can only see their own marks
        const marksRecords = await storage.getMarksByStudent(req.session.userId!);
        return res.json(marksRecords);
      } else {
        // Admins can see all marks (paginated)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 1000;
        const search = req.query.search as string || "";
        const department = (req.query.department as string) || undefined;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
        const offset = (page - 1) * limit;

        const { data, total } = await storage.getAllMarks(limit, offset, search, department, branchId, batchId);

         return res.json({
           data: data,
           pagination: {
             page,
             limit,
             total,
             totalPages: Math.ceil(total / limit)
           }
         });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching marks", error: error.message });
    }
  });

  app.get("/api/marks/:studentId", requireAuth, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const marksRecords = await storage.getMarksByStudent(studentId);
      res.json(marksRecords);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching marks", error: error.message });
    }
  });

  app.post("/api/marks/batch", requireAdmin, async (req, res) => {
    try {
      const records = req.body.records;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Records must be an array" });
      }

      const processedRecords = records.map(record => {
        const validatedData = insertMarksSchema.parse(record);
        const percentage = (validatedData.marksObtained / validatedData.totalMarks) * 100;
        const grade = calculateGrade(percentage);
        return {
          ...validatedData,
          percentage,
          grade
        };
      });

      const results = await storage.createMarksBatch(processedRecords);

      // Log action
      await storage.createAuditLog({
        adminId: req.session.userId,
        action: "BATCH_CREATE_MARKS",
        details: `Created ${results.length} marks records`,
        ipAddress: req.ip
      });

      res.status(201).json(results);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating marks batch", error: error.message });
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
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      const books = await storage.getAllLibraryBooks(branchId, batchId);
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

  app.get("/api/library/issues/:studentId", requireAuth, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const bookIssues = await storage.getBookIssuesByStudent(studentId);
      res.json(bookIssues);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching book issues", error: error.message });
    }
  });

  app.post("/api/library/issues", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBookIssueSchema.parse(req.body);
      
      // Validate dates
      if (new Date(validatedData.dueDate) < new Date(validatedData.issueDate)) {
        return res.status(400).json({ message: "Due date must be after issue date" });
      }
      
      // Transactional operation: Validates and creates issue with book availability update atomically
      const bookIssue = await storage.issueBookWithTransaction(validatedData, validatedData.bookId);
      
      res.status(201).json(bookIssue);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating book issue", error: error.message });
    }
  });

  app.put("/api/library/issues/:id/return", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { returnDate } = req.body;
      
      // Get the issue to find the book ID
      const issue = await storage.getBookIssueById(id);
      if (!issue) {
        return res.status(404).json({ message: "Book issue not found" });
      }
      
      // Transactional operation: Validates and updates return with book availability update atomically
      const bookIssue = await storage.returnBookWithTransaction(id, returnDate, issue.bookId);
      
      res.json(bookIssue);
    } catch (error: any) {
      res.status(400).json({ message: "Error returning book", error: error.message });
    }
  });

  // ========== NOTICE ROUTES ==========
  
  app.get("/api/notices", requireAuth, async (req, res) => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      const notices = await storage.getAllNotices(branchId, batchId);
      // Limit to latest 100 notices to prevent payload bloat
      res.json(notices.slice(0, 100));
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

  app.get("/api/analytics/global", requireAuth, async (req, res) => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      const stats = await storage.getGlobalStats(branchId, batchId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching analytics", error: error.message });
    }
  });

  app.get("/api/analytics/subjects", requireAuth, async (req, res) => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      const stats = await storage.getSubjectStats(branchId, batchId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subject stats", error: error.message });
    }
  });

  // ========== EXAMS & MARKS ROUTES (Test Based) ==========

  // Get exams for a subject
  app.get("/api/exams/subject/:subjectId", requireAuth, async (req, res) => {
    try {
      const subjectId = parseInt(req.params.subjectId);
      const exams = await storage.getExamsBySubject(subjectId);
      res.json(exams);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching exams", error: error.message });
    }
  });

  // Create new exam
  app.post("/api/exams", requireAdmin, async (req, res) => {
    try {
      console.log("[API] Creating exam with body:", req.body);
      const validatedData = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(validatedData);
      res.status(201).json(exam);
    } catch (error: any) {
      console.error("[API] Error creating exam:", error);
      res.status(400).json({ message: "Error creating exam", error: error.message });
    }
  });

  // Delete exam
  app.delete("/api/exams/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteExam(id);
      if (!deleted) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json({ success: true, message: "Exam deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting exam", error: error.message });
    }
  });

  // Get marks for an exam
  app.get("/api/exams/:examId/marks", requireAuth, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const marks = await storage.getExamMarks(examId);
      res.json(marks);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching exam marks", error: error.message });
    }
  });

  // Save marks for an exam (Bulk)
  app.post("/api/exams/marks", requireAdmin, async (req, res) => {
    try {
      const records = req.body.records;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Records must be an array" });
      }

      const validatedRecords = records.map(r => insertExamMarksSchema.parse(r));
      const results = await storage.saveExamMarks(validatedRecords);
      res.status(201).json(results);
    } catch (error: any) {
      res.status(400).json({ message: "Error saving exam marks", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
