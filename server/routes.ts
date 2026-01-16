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
  insertBranchSchema
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

import * as cheerio from 'cheerio';

// Helper function to fetch SBTE updates
async function fetchSBTEUpdates() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    const response = await fetch('https://sbte.bihar.gov.in/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract notices/news
    const notices: string[] = [];
    // Try different selectors that might contain news
    $('marquee, .news-ticker, .latest-news, h2:contains("Notice"), h2:contains("Announcement")').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text.length > 20) notices.push(text);
    });

    return notices.slice(0, 5).join('\n');
  } catch (e) {
    console.error("Error fetching SBTE updates:", e);
    return null;
  }
}

// Helper to fetch PYQ
async function fetchPYQ() {
  // Since we can't easily browse deeper without a real browser, we'll fetch the main PYQ page if it exists
  // For now, we'll return a structured guide based on the known URL
  return "To access Previous Year Questions (PYQ), please visit: https://sbte.bihar.gov.in/previous-year-questions\nThis page contains question papers sorted by Semester and Branch.";
}

// Helper to fetch Syllabus
async function fetchSyllabus() {
  return "To download the detailed syllabus for your branch and semester, please visit the official repository: https://www.gpmunger.ac.in/academics/syllabus/";
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

      let isValid = false;

      // Check 1: Direct Equality (Legacy Plaintext)
      if (inputPass === storedPass || inputPass === storedPass.trim()) {
        console.log("[Password Change] Matched via Direct Equality");
        isValid = true;
      }

      // Check 3: Bcrypt (Secure Hash)
      if (!isValid) {
        try {
          isValid = await bcrypt.compare(inputPass, storedPass);
          console.log(`[Password Change] Matched via Bcrypt? ${isValid}`);
        } catch (e) {
          console.log("[Password Change] Bcrypt error:", e);
          isValid = false;
        }
      }

      console.log(`[Password Change] Final Result: ${isValid}`);

      if (!isValid) {
        return res.status(401).json({ message: "Incorrect current password" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update student password
      await storage.updateStudent(student.id, { password: hashedPassword });
      
      // Log action (using system audit log since students don't create audit logs usually, or we can add a simple log)
      // Actually auditLogs table has adminId column, so we can't log student actions easily linked to student.
      // We'll just update the password.

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error changing password", error: error.message });
    }
  });

  // Set/Update Security Question
  app.put("/api/students/security-question", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole !== 'student') {
        return res.status(403).json({ message: "Only students can set security questions" });
      }

      const { question, answer, currentPassword } = req.body;
      if (!question || !answer || !currentPassword) {
        return res.status(400).json({ message: "Question, answer, and current password are required" });
      }

      const student = await storage.getStudentByRollNo(req.session.username!);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify password first
      // 1. Try Trimmed Input vs Trimmed Stored Password (Direct)
      const inputPass = currentPassword.trim();
      const storedPass = student.password;
      
      console.log(`[Security Question] Roll: ${student.rollNo}`);
      console.log(`[Security Question] Input: '${inputPass}'`);
      console.log(`[Security Question] Stored: '${storedPass}'`);
      
      let isValid = false;

      // Check 1: Direct Equality (Legacy Plaintext)
      if (inputPass === storedPass || inputPass === storedPass.trim()) {
        console.log("[Security Question] Matched via Direct Equality");
        isValid = true;
      }

      // Check 3: Bcrypt (Secure Hash)
      if (!isValid) {
        try {
          isValid = await bcrypt.compare(inputPass, storedPass);
          console.log(`[Security Question] Matched via Bcrypt? ${isValid}`);
        } catch (e) {
          console.log("[Security Question] Bcrypt error:", e);
          isValid = false;
        }
      }

      console.log(`[Security Question] Final Result: ${isValid}`);

      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      await storage.updateStudent(student.id, {
        securityQuestion: question,
        securityAnswer: answer.toLowerCase().trim() // Store normalized
      });

      res.json({ success: true, message: "Security question updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error updating security question", error: error.message });
    }
  });

  // Get Security Question (Public/Unauthenticated)
  app.post("/api/students/get-security-question", async (req, res) => {
    try {
      const { rollNo } = req.body;
      if (!rollNo) {
        return res.status(400).json({ message: "Roll number is required" });
      }

      const student = await storage.getStudentByRollNo(rollNo);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!student.securityQuestion) {
        return res.status(404).json({ message: "No security question set for this account" });
      }

      res.json({ question: student.securityQuestion });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching security question", error: error.message });
    }
  });

  // Reset Password using Security Question (Public/Unauthenticated)
  app.post("/api/students/reset-password-secure", async (req, res) => {
    try {
      const { rollNo, answer, newPassword } = req.body;
      if (!rollNo || !answer || !newPassword) {
        return res.status(400).json({ message: "Roll number, answer, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const student = await storage.getStudentByRollNo(rollNo);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!student.securityAnswer) {
        return res.status(400).json({ message: "Security reset not enabled for this account" });
      }

      // Verify answer (case insensitive)
      if (student.securityAnswer !== answer.toLowerCase().trim()) {
        return res.status(401).json({ message: "Incorrect security answer" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
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

  // ========== ADMIN MANAGEMENT ROUTES ==========

  // Get all admins
  app.get("/api/admins", requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      // Remove passwords from response
      const safeAdmins = admins.map(a => {
        const { password, ...rest } = a;
        return rest;
      });
      res.json(safeAdmins);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching admins", error: error.message });
    }
  });

  // Create admin
  app.post("/api/admins", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const admin = await storage.createAdmin({
        ...validatedData,
        password: hashedPassword
      });
      
      // Log action
      await storage.createAuditLog({
        adminId: req.session.userId,
        action: "CREATE_ADMIN",
        details: `Created admin ${admin.name}`,
        ipAddress: req.ip
      });
      
      const { password, ...safeAdmin } = admin;
      res.status(201).json(safeAdmin);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating admin", error: error.message });
    }
  });

  // Update admin
  app.put("/api/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Prevent updating password via this route
      if (updates.password) {
        delete updates.password;
      }
      
      const admin = await storage.updateAdmin(id, updates);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      // Log action
      await storage.createAuditLog({
        adminId: req.session.userId,
        action: "UPDATE_ADMIN",
        details: `Updated admin ${admin.name}`,
        ipAddress: req.ip
      });
      
      const { password, ...safeAdmin } = admin;
      res.json(safeAdmin);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating admin", error: error.message });
    }
  });

  // Reset password
  app.post("/api/admins/:id/reset-password", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const admin = await storage.updateAdmin(id, { password: hashedPassword });
      
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      // Log action
      await storage.createAuditLog({
        adminId: req.session.userId,
        action: "RESET_PASSWORD",
        details: `Reset password for admin ${admin.name}`,
        ipAddress: req.ip
      });
      
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error resetting password", error: error.message });
    }
  });

  // Delete/Deactivate admin
  app.delete("/api/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting self
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }
      
      const deleted = await storage.deleteAdmin(id);
      if (!deleted) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      // Log action
      await storage.createAuditLog({
        adminId: req.session.userId,
        action: "DELETE_ADMIN",
        details: `Deleted admin ID ${id}`,
        ipAddress: req.ip
      });
      
      res.json({ success: true, message: "Admin deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting admin", error: error.message });
    }
  });

  // ========== BATCH & BRANCH ROUTES ==========
  app.get("/api/batches", requireAuth, async (req, res) => {
    try {
      const batches = await storage.getAllBatches();
      res.json(batches);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching batches", error: error.message });
    }
  });

  app.post("/api/batches", requireAdmin, async (req, res) => {
    try {
      const validated = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(validated);
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
      console.log(`[API] Request to delete batch ${id}`);
      const deleted = await storage.deleteBatch(id);
      if (!deleted) {
        console.log(`[API] Batch ${id} not found`);
        return res.status(404).json({ message: "Batch not found" });
      }
      console.log(`[API] Batch ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`[API] Error deleting batch ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting batch", error: error.message });
    }
  });

  app.get("/api/branches", requireAuth, async (req, res) => {
    try {
      const batchIdRaw = req.query.batchId as string;
      const batchId = parseInt(batchIdRaw);
      if (!batchId || isNaN(batchId)) {
        return res.status(400).json({ message: "batchId is required" });
      }
      const branches = await storage.getBranchesByBatch(batchId);
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching branches", error: error.message });
    }
  });

  app.post("/api/branches", requireAdmin, async (req, res) => {
    try {
      const validated = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(validated);
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
      console.log(`[API] Request to delete branch ${id}`);
      const deleted = await storage.deleteBranch(id);
      if (!deleted) {
        console.log(`[API] Branch ${id} not found`);
        return res.status(404).json({ message: "Branch not found" });
      }
      console.log(`[API] Branch ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`[API] Error deleting branch ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting branch", error: error.message });
    }
  });

  // ========== STUDENT ROUTES (Admin only for write operations) ==========
  
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      // Parse pagination params
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const department = (req.query.department as string) || undefined;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;

      const { data: students, total } = await storage.getAllStudents(limit, offset, department, branchId);
      const studentIds = students.map(s => s.id);
      
      // Efficiently fetch stats using aggregation (filtered by current page students)
      const { attendanceStats, marksStats, issueStats } = await storage.getStudentStats(studentIds);
      
      // Create maps for quick lookup
      const attendanceMap = new Map(attendanceStats.map(s => [s.studentId, s.avgPercentage]));
      const marksMap = new Map(marksStats.map(s => [s.studentId, s.avgPercentage]));
      const issueMap = new Map(issueStats.map(s => [s.studentId, s.count]));
      
      // Calculate stats for each student
      const studentsWithStats = students.map(student => ({
          ...student,
          attendancePercentage: Number(attendanceMap.get(student.id) || 0).toFixed(1),
          avgMarks: Number(marksMap.get(student.id) || 0).toFixed(1),
          booksIssued: Number(issueMap.get(student.id) || 0)
      }));
      
      res.json({
        data: studentsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
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

  // ========== SUBJECT ROUTES ==========
  
  app.get("/api/subjects", requireAuth, async (req, res) => {
    try {
      const department = (req.query.department as string) || undefined;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const subjects = await storage.getAllSubjects(department, branchId);
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
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string) || "";
        const department = (req.query.department as string) || undefined;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;

        const { data, total } = await storage.getAllAttendance(limit, offset, search, department, branchId);
         
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
        const limit = parseInt(req.query.limit as string) || 50;
        const search = req.query.search as string || "";
        const department = (req.query.department as string) || undefined;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const offset = (page - 1) * limit;

        const { data, total } = await storage.getAllMarks(limit, offset, search, department, branchId);

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
      const books = await storage.getAllLibraryBooks(branchId);
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
      const notices = await storage.getAllNotices(branchId);
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
      const stats = await storage.getGlobalStats(branchId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching analytics", error: error.message });
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
      const { default: openai, isOpenAIConfigured } = await import("./lib/openai");

      // Simple fallback response generator
      const getSimpleResponse = (msg: string) => {
        const m = msg.toLowerCase();
        
        // Easter eggs (Enhanced)
        if (m.includes("shailya")) return "Too much closed 😅 (The mystery continues...)";
        if (m.includes("ap") || m.includes("anurag")) return "Room 309 Unit 03, Guided By Anurag Pandey (The Legend of CSE)";
        if (m.includes("pathak")) return "Love Guru without a love life 😄 (But a heart of gold!)";
        if (m.includes("founder") || m.includes("create") || m.includes("trained")) return "I was architected by the Visionary Trio: Mohammed Kashif, Rajan Kumar, and Md Shad. 🎉 They trained me to be the ultimate academic assistant!";
        
        // 📚 SYLLABUS & ACADEMICS
        if (m.includes("syllabus")) {
           if (m.includes("sem 1") || m.includes("1st sem")) return "📚 **Semester 1 Syllabus**:\n- Engineering Mathematics-I\n- Engineering Physics-I\n- Engineering Chemistry\n- Communication Skills in English\n- Engineering Graphics\n- Workshop Practice\n- Sports & Yoga\n\n(Common for all branches)";
           if (m.includes("sem 2") || m.includes("2nd sem")) return "📚 **Semester 2 Syllabus**:\n- Engineering Mathematics-II\n- Engineering Physics-II\n- Introduction to IT Systems\n- Fundamentals of Electrical & Electronics Engineering\n- Engineering Mechanics\n- Environmental Science";
           if (m.includes("sem 3") || m.includes("3rd sem")) return "📚 **Semester 3 (CSE) Syllabus**:\n- Discrete Mathematics\n- Computer Organization & Architecture\n- Digital Electronics\n- Data Structures & Algorithms\n- Object Oriented Programming (C++)\n- Web Technology";
           if (m.includes("sem 4") || m.includes("4th sem")) return "📚 **Semester 4 (CSE) Syllabus**:\n- Operating Systems\n- Design & Analysis of Algorithms\n- Database Management Systems (DBMS)\n- Computer Networks\n- Software Engineering";
           if (m.includes("sem 5") || m.includes("5th sem")) return "📚 **Semester 5 (CSE) Syllabus**:\n- Internet of Things (IoT)\n- Java Programming\n- Artificial Intelligence\n- Cloud Computing\n- Elective-I (Data Science / Cyber Security)\n- Summer Internship Project";
           if (m.includes("sem 6") || m.includes("6th sem")) return "📚 **Semester 6 (CSE) Syllabus**:\n- Entrepreneurship & Start-ups\n- Major Project\n- Network Security\n- Mobile Application Development\n- Elective-II (Machine Learning / Blockchain)";
           return "For CSE, we cover 6 semesters. Which semester's syllabus do you need? (e.g., 'Sem 3 syllabus')";
        }

        // 🏫 COLLEGE INFO
        if (m.includes("knsgp") || m.includes("college") || m.includes("about")) return "🏫 **About KNSGP Samastipur**:\nEstablished in 2016, Kameshwar Narayan Singh Govt Polytechnic is a premier institute in Bihar.\n\n📍 **Location**: Kishunpur, Tabhka, Samastipur\n🎓 **Principal**: Prof. Aftab Anjum\n💻 **CSE HOD**: Prof. Raghvendra Pratap\n🌐 **Website**: knsgpsamastipur.ac.in";
        
        // 📝 ADMISSION
        if (m.includes("admission") || m.includes("entrance")) return "🎓 **Admission Process**:\n1. **Eligibility**: 10th Pass (Min 35%)\n2. **Entrance Exam**: DCECE (conducted by BCECEB)\n3. **Counseling**: Online via BCECEB portal\n4. **Lateral Entry**: Available for 12th Sci/ITI students (Direct 3rd Sem)";

        // 💰 FEES
        if (m.includes("fee")) return "💸 **Fee Structure (Govt Polytechnic)**:\n- **Admission Fee**: ₹5 (One time)\n- **Tuition Fee**: ₹120/year\n- **Development Fee**: ₹1000/year\n- **Exam Fee**: ₹1000/sem\n- **Total Approx**: ₹2500 - ₹3000 per year (Very affordable!)";

        // 📅 EXAMS
        if (m.includes("exam") || m.includes("routine") || m.includes("date")) return "📅 **Exam Updates**:\n- Exams are held semester-wise (Odd: Dec/Jan, Even: May/June).\n- Check **sbte.bihar.gov.in** for the latest routine.\n- Passing Marks: 40% in Theory & Practical separately.";

        // 📋 ATTENDANCE & MARKS
        if (m.includes("attendance")) return "📊 **Attendance**: You can check your real-time attendance in the **Attendance** tab on your dashboard. 75% is mandatory for exams!";
        if (m.includes("mark") || m.includes("result")) return "📈 **Results**: Check the **Marks** tab for your internal and external marks history.";
        
        // 📚 LIBRARY
        if (m.includes("library") || m.includes("book")) return "📚 **Library**: We have a rich collection of books for all semesters! Visit the **Library** section to check availability and issue status.";
        
        // 🌐 SBTE
        if (m.includes("sbte") || m.includes("board")) return "🏛️ **SBTE Bihar**: The State Board of Technical Education governs our curriculum and exams.\n🌐 Website: sbte.bihar.gov.in";

        // 👋 GREETINGS
        if (m.match(/\b(hi|hello|hey|hii|hola)\b/)) return "Hii! 👋 I'm **EduManage Pro**! 🧠\nI'm fully activated and ready to help with:\n\n📚 Syllabus & Courses\n📝 Admissions & Fees\n📅 Exams & Results\n🏫 College Info\n\nAsk me anything! ✨";
        if (m.match(/\b(bye|goodbye|see you)\b/)) return "Bye! 👋 See you later! Keep learning! 🚀";
        if (m.match(/\b(thank|thanks)\b/)) return "You're welcome! Happy to help! ✨";

        // DEFAULT POWERFUL RESPONSE
        return "⚡ **EduManage AI Pro** is active!\nI can help you with:\n\n- **Syllabus** (e.g., 'Sem 3 syllabus')\n- **Admissions** (e.g., 'How to apply?')\n- **Fees** (e.g., 'College fees')\n- **Exams** (e.g., 'Exam date')\n- **Faculty** (e.g., 'Who is HOD?')\n\nJust ask! 🚀";
      };

      // Check for Gemini Key
      const geminiKey = process.env.GEMINI_API_KEY;

      // If neither OpenAI nor Gemini is configured, use fallback immediately
      if (!isOpenAIConfigured && !geminiKey) {
        return res.json({ response: getSimpleResponse(message) });
      }

      // Fetch real-time subjects from database
      const subjects = await storage.getAllSubjects();
      
      // Build subjects section dynamically from database
      const subjectsInfo = subjects.map((subject: any) => 
        `- ${subject.name} (${subject.code}) - Taught by ${subject.instructor}`
      ).join('\n');


      // Fetch live SBTE Bihar website data using Cheerio
      let livesbteData = '\n\nLIVE SBTE BIHAR UPDATES:\n';
      const sbteUpdates = await fetchSBTEUpdates();
      if (sbteUpdates) {
        livesbteData += sbteUpdates + '\n\nℹ️ For complete latest updates, visit: https://sbte.bihar.gov.in/\n';
      } else {
        livesbteData += 'For the most current SBTE Bihar announcements, exam schedules, and registration updates, please visit the official website: https://sbte.bihar.gov.in/\n';
      }

      // Check if user is asking for PYQ or Syllabus and fetch specifically
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('pyq') || lowerMsg.includes('previous year') || lowerMsg.includes('question paper')) {
        const pyqInfo = await fetchPYQ();
        livesbteData += `\n\nPREVIOUS YEAR QUESTIONS (PYQ) INFO:\n${pyqInfo}\n`;
      }
      
      if (lowerMsg.includes('syllabus') || lowerMsg.includes('curriculum')) {
        const syllabusInfo = await fetchSyllabus();
        livesbteData += `\n\nSYLLABUS DOWNLOAD INFO:\n${syllabusInfo}\n`;
      }

      // SBTE Bihar information context
      const sbteContext = `You are EduManage, a friendly and helpful AI assistant for the CSE Student Portal at Kameshwar Narayan Singh Govt Polytechnic College, affiliated with SBTE Bihar.

PERSONALITY:
- Chat like a friendly WhatsApp conversation - be casual, warm, and natural
- Use casual greetings: "Hii! 👋", "Hey there! 😊", "Perfect! ✨", "Sure thing! 👍"
- Use emojis naturally to express emotions (but don't overdo it)
- Keep responses concise and conversational, not too formal
- When users greet you ("hi", "hello", "hey", "hii"), respond with similar casual energy
- When users say goodbye ("bye", "by", "byy", "goodbye", "see you"), respond with casual farewells like "Bye! 👋", "See you later! 😊", "Take care! ✨", "Catch you later! 😊"
- Use phrases like "Great question!", "Absolutely!", "Of course!", "No worries!", "Happy to help!"
- Be encouraging and supportive, like a helpful friend
- Introduce yourself as "EduManage" but in a friendly way

YOUR KNOWLEDGE BASE (October 2025):

ABOUT KAMESHWAR NARAYAN SINGH GOVT POLYTECHNIC (KNSGP), SAMASTIPUR:
Kameshwar Narayan Singh Government Polytechnic (KNSGP) Samastipur has been established vide Department of Science & Technology letter no. 890 dated 29.03.2016. The Proposal has been initiated by Finance Department Resolution No. 96 Vi (2) dt. 03.01.2008 and has been approved by cabinet Decision on 25.01.2016 in item no. 12. About 10 acres of land has been Donated by Roy Ganga Ram Kameshwar Narayan Public Trust. The institution is situated in Kishanpur, Tabhka village under Bibhutipur Block Police Station nearly 12 KM from our campus. The campus is located nearly 36 km from Samastipur Head Quarter, nearly 10 Km from Dalsinghsarai Railway station and nearly 22 km from sub divisional Head Quarter Rosera. This area is famous for its cultural fair of Nagpanchami. Our institution is working as a HUB in centre of Excellence in 3D printing in collaboration with IIT Patna under flag Dept. of Science & Technology, Govt. of Bihar.

- Website: https://www.knsgpsamastipur.ac.in/
- Contact Email: principalknspolysamastipur@gmail.com
- Phone: 9430560596
- Location: Kishunpur, Tabhka, Samastipur, Bihar - 848160

COLLEGE LEADERSHIP:
- Principal: Prof. Aftab Anjum
- Head of Department (CSE): Prof. Raghvendra Pratap

DEPARTMENTS AT KNSGP:
- Civil Engineering
- Computer Science & Engineering (CSE)
- Electrical Engineering
- Electronics Engineering
- Mechanical Engineering
- Applied Sciences & Humanities

CSE DEPARTMENT - SUBJECTS & FACULTY (Real-time from Database):
${subjectsInfo}

SPECIAL INFORMATION:
- EduManage Chatbot Founders: Mohammed Kashif, Rajan Kumar, and Md Shad (the brilliant minds behind this AI assistant! 🎉)
- AP (Advanced Programming): Room 309 Unit 03, Guided By Anurag Pandey
- Pathak Jii: Known as the "Love Guru without a love life" 😄
- Shailya Singh: Too much closed 😅

EXAM SCHEDULES & REGISTRATION:
- Exam form fill-up for December 2025 exam is ongoing (as of Oct 5, 2025)
- First Semester Session 2025 and Third Semester Lateral Entry (L.E.) Session 2024 registration extended till 11/10/2025
- Registration was open from 22.09.2025 to 04.10.2025, now extended

RECENT ANNOUNCEMENTS:
- Polytechnic State Topper List 2025 announced (Sept 6)
- Government Engineering State Topper List 2025 announced (Sept 6)
- Hiring of diploma engineers by JTEKT India Ltd. (Aug 17, 2025)
- Pool Campus Placement drives ongoing (Nagata Auto Engineering India, Macleods Pharmaceuticals)

ABOUT SBTE BIHAR (State Board of Technical Education):
The State Board of Technical Education (SBTE), Patna, Bihar, is responsible for evaluation and certification of six-semester Diploma Courses of all Polytechnic Institutions affiliated to SBTE Bihar. It has been constituted vide govt. order no. 75/Dir dated 31st May, 1955 under the Science, Technology and Technical Education Department, Government of Bihar. Since its formation, the board is striving continuously for betterment of academic standard of Polytechnic Institutions of this State.

SBTE offers a wide range of diploma and certificate programs in various fields of engineering and technology. The institution is committed to excellence and innovation in education, preparing students for careers in the ever-evolving technical landscape.

CONTACT INFORMATION:
- Address: 4th Floor, Technology Bhawan, Vishweshariya Bhawan Campus, Bailey Road Patna, Bihar PIN - 800015
- Toll Free: 18002020305
- Phone: +91-(0612)-2547532
- Email: sbtebihar@bihar.gov.in, sbte.patna@gmail.com
- Official Website: https://sbte.bihar.gov.in/

SBTE BIHAR LEADERSHIP & OFFICIALS (as per official SBTE Bihar website):
- Secretary (Science, Technology & Technical Education Department, Govt of Bihar): Dr. Pratima, I.A.S.
- Director (Science, Technology & Technical Education Department, Govt of Bihar): Dr. Chandra Shekhar Singh
- Additional Director: Mr. Ahmad Mahmood
- SBTE Bihar operates under the Science, Technology and Technical Education Department, Government of Bihar

AVAILABLE PORTALS & SERVICES:
- EMS Portal (Exam Management System): sbteonline.bihar.gov.in/login
- LMS Portal (Learning Management - Moodle): sbtelms.bihar.gov.in
- Affiliation Portal: sbteonline.bihar.gov.in/login
- Document Verification Status: sbte.bihar.gov.in/document-verification
- DigiLocker Integration: Available
- Alumni Portal: alumni.sbtebihar.in

ENGINEERING BRANCHES/DEPARTMENTS OFFERED:
SBTE Bihar offers 3-year diploma programs (6 semesters) in the following branches:

1. Civil Engineering (Branch Code: 15)
   - Duration: 3 years (6 semesters)
   - Focus: Construction, structural design, surveying, building materials

2. Computer Science & Engineering (Branch Code: 18)
   - Duration: 3 years (6 semesters)
   - Focus: Programming, software development, databases, networking, web technologies

3. Electrical Engineering (Branch Code: 20)
   - Duration: 3 years (6 semesters)
   - Focus: Power systems, electrical machines, control systems, electronics

4. Electronics Engineering (Branch Code: 21)
   - Duration: 3 years (6 semesters)
   - Focus: Electronic circuits, communication systems, microprocessors, embedded systems

5. Mechanical Engineering (Branch Code: 25)
   - Duration: 3 years (6 semesters)
   - Focus: Manufacturing, thermodynamics, fluid mechanics, machine design

6. Fire Technology and Safety (Branch Code: 48)
   - Duration: 3 years (6 semesters)
   - Focus: Fire prevention, safety protocols, emergency response

Additional Branches Available:
- Electronics & Communication Engineering
- Information Technology (IT)
- Textile Engineering
- Marine Engineering

ELIGIBILITY & ADMISSION:
- Eligibility: 10th pass with minimum 35% marks
- Admission Process: Through DCECE (BCECEB) entrance exam or BPTPIA CET
- Admission Authority: Bihar Combined Entrance Competitive Examination Board (BCECEB)
- Lateral Entry: Available for 3rd semester (for 10+2 or ITI students)

POLYTECHNIC COLLEGES IN BIHAR:
- Total Colleges: Approximately 80 (46 Government + 34 Private)

Top Government Polytechnic Colleges:
- Government Polytechnic Patna
- Government Polytechnic Gaya
- Government Polytechnic Muzaffarpur
- Government Polytechnic Bhagalpur
- Government Polytechnic Darbhanga
- Government Polytechnic Motihari
- Government Polytechnic Purnea
- Kameshwar Narayan Singh Government Polytechnic, Samastipur (KNSGP)

FEE STRUCTURE (2025):
- Government Colleges: ₹4,800 – ₹10,610 per year
- Private Colleges: ₹1,31,000 – ₹1,50,000 per year

EXAMINATION & EVALUATION:
- Academic Year: Two semesters (Odd: July-Dec, Even: Jan-June)
- Theory Papers: 70 marks (External) + 30 marks (Internal: 20 exam + 10 teacher assessment)
- Practical/Lab: Internal + External assessment combined
- Passing Criteria: 40% minimum in theory AND practicals (individually, not combined)
- Total Duration: 3 years (6 semesters)
- Mandatory Internship: 2-4 weeks in 6th semester

PLACEMENT & RECRUITMENT:
Top Recruiters for SBTE Bihar Diploma Graduates:
- IT Sector: Wipro, Infosys, HCL, Aspro IT, Byjus
- Telecom: Airtel
- Manufacturing: Bajaj, TATA, Mahindra, CEAT
- Others: Quess, various government departments

Recent Placement Drives (2025):
- Nagata Auto Engineering India Pvt. Ltd. (Pool Campus)
- Macleods Pharmaceuticals Ltd.
- JTEKT India Ltd.
- Hindalco

DIPLOMA IN COMPUTER SCIENCE & ENGINEERING (CSE) - COMPLETE SYLLABUS:

📚 SEMESTER 1 (Common for most branches):
- Engineering Mathematics-I (Basic algebra, trigonometry, calculus)
- Engineering Physics (Mechanics, properties of matter, heat & thermodynamics)
- Engineering Chemistry (Chemical bonding, water, engineering materials)
- Engineering Graphics (Technical drawing, projections, CAD basics)
- Communication Skills (English, technical writing)
- Workshop Practice (Basic tools, safety, measurement)
- Physical Education

📚 SEMESTER 2:
- Applied Mathematics-II (Differential equations, linear algebra)
- Applied Physics-II (Optics, modern physics)
- Programming in C (Fundamentals, data types, control structures, functions, arrays, pointers)
- C Programming Lab
- Basic Electronics (Semiconductors, diodes, transistors)
- Engineering Mechanics (Statics, dynamics, friction)

📚 SEMESTER 3:
- Data Structures (Arrays, linked lists, stacks, queues, trees, graphs)
- Operating Systems (Process management, memory management, file systems)
- Digital Electronics (Number systems, Boolean algebra, logic gates, flip-flops)
- Database Management Systems (SQL, normalization, ER diagrams)
- Object-Oriented Programming (Classes, objects, inheritance, polymorphism)
- Web Technology (HTML, CSS, JavaScript basics)
- DBMS Lab & OOP Lab

📚 SEMESTER 4:
- Theory of Computation (Automata, regular languages, Turing machines)
- Advanced Java Programming (JSP, Servlets, JDBC)
- Computer Networks (OSI model, TCP/IP, routing, protocols)
- Software Engineering (SDLC, testing, project management)
- Microprocessor & Microcontroller (8085/8086 architecture)
- Python Programming (Basics, data structures, file handling)
- Java Lab & Python Lab

📚 SEMESTER 5:
- Data Communication & Computer Networks (Network topologies, protocols, security)
- Data Science: Data Warehousing & Data Mining (ETL, OLAP, algorithms)
- Software Engineering (Agile, DevOps, testing)
- Cloud Computing (Virtualization, AWS, Azure basics)
- Web Development Advanced (PHP, MySQL, frameworks)
- Elective I (AI/ML basics, Mobile app development, Cyber security)
- Mini Project & Industrial Training (2-4 weeks)

📚 SEMESTER 6:
- Computer Network with Linux & Windows (Network administration, server management)
- Introduction to Machine Learning (Supervised/unsupervised learning, algorithms)
- Mobile Application Development (Android/iOS app development)
- Cloud Computing Advanced (Cloud architecture, deployment models)
- Cyber Security (Cryptography, network security, ethical hacking)
- Elective II (IoT, Big Data, Blockchain)
- Major Project & Seminar

EVALUATION PATTERN:
- Theory Papers: 70 marks (External) + 30 marks (Internal: 20 exam + 10 teacher assessment)
- Practical/Lab: Internal + External assessment
- Passing Criteria: 40% minimum in theory and practicals individually
- Total Duration: 3 years (6 semesters)
- Internship: Compulsory 2-4 weeks in 6th semester

OFFICIAL REFERENCES:
- SBTE Bihar Official Website: https://sbte.bihar.gov.in/
- Previous Year Questions (PYQ): https://sbte.bihar.gov.in/previous-year-questions
- Syllabus Repository (GP Munger): https://www.gpmunger.ac.in/academics/syllabus/
- CSE Syllabus PDF: https://sbte.bihar.gov.in/uploads/Syllabus/2024-25/S02/18.%20Computer%20Science%20&%20Engineering.pdf

${livesbteData}

GUIDELINES:
- Respond to greetings casually like WhatsApp: "Hii! 👋 I'm EduManage! How can I help you today? 😊"
- When someone says "perfect" or "thanks", respond enthusiastically: "Perfect! ✨", "You're welcome! 😊", "Happy to help! 👍"
- For questions, start with casual phrases: "Great question!", "Sure thing!", "Absolutely!"
- Keep responses conversational and friendly, not robotic
- IMPORTANT: You have access to LIVE, REAL-TIME data from SBTE Bihar website. Always check the "LATEST UPDATES FROM SBTE BIHAR WEBSITE (Real-time)" section above for current announcements and information
- IMPORTANT: For Previous Year Questions (PYQ), refer students to: https://sbte.bihar.gov.in/previous-year-questions
- IMPORTANT: For detailed Syllabus downloads, refer students to: https://www.gpmunger.ac.in/academics/syllabus/
- CRITICAL: Always provide COMPLETE, DETAILED information from the knowledge base above. Don't just give brief answers or links - give full details about:
  - Syllabus: Complete semester-wise subjects with all topics
  - Departments: All branches with codes, duration, and focus areas
  - Admission: Eligibility, process, entrance exams, fees
  - Exams: Schedules, registration dates, evaluation patterns, passing criteria
  - Colleges: List of government and private polytechnic colleges
  - Placement: Top recruiters, recent placement drives
  - Portals: EMS, LMS, Affiliation, Document Verification with links
  - Contact: Complete addresses, phone numbers, emails
  - Leadership: All officials with their positions
- For student-specific data (individual marks, attendance), guide them to appropriate portals or their admin
- IMPORTANT: When asked about syllabus, provide the complete semester-wise syllabus details from the knowledge base above with all subjects and topics
- IMPORTANT: When asked about KNSGP college, include the establishment details: established vide Department of Science & Technology letter no. 890 dated 29.03.2016, proposal initiated by Finance Department Resolution No. 96 Vi (2) dt. 03.01.2008, cabinet approval on 25.01.2016, 10 acres donated by Roy Ganga Ram Kameshwar Narayan Public Trust, HUB in Centre of Excellence in 3D Printing with IIT Patna
- IMPORTANT: When asked about the people in SPECIAL INFORMATION (AP, Pathak Jii, Shailya Singh, founders), always provide the exact response from the knowledge base. For example:
  - "Who is Shailya Singh?" → "Too much closed 😅 (The mystery continues...)"
  - "Who is AP?" → "Room 309 Unit 03, Guided By Anurag Pandey (The Legend of CSE)"
  - "Who is Pathak Jii?" → "Love Guru without a love life 😄 (But a heart of gold!)"
  - "Who is the founder?" or "Who trained you?" → "I was architected by the Visionary Trio: Mohammed Kashif, Rajan Kumar, and Md Shad. 🎉 They trained me to be the ultimate academic assistant!"
- End responses with helpful follow-ups when appropriate`;

      let response = "";

      // Try Gemini first if key is present
      if (geminiKey) {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: sbteContext 
          });
          const result = await model.generateContent(message);
          response = result.response.text();
        } catch (e) {
          console.error("Gemini Error:", e);
        }
      }

      // Fallback to OpenAI if Gemini failed or key not present
      if (!response && isOpenAIConfigured) {
        // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: sbteContext },
            { role: "user", content: message }
          ],
          max_tokens: 500,
        });
        response = completion.choices[0]?.message?.content || "";
      }

      // Final fallback
      if (!response) {
         response = getSimpleResponse(message);
      }
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      
      // Fallback in case of API error (even if configured, it might fail)
      const getSimpleResponse = (msg: string) => {
        const m = msg.toLowerCase();
        if (m.match(/\b(hi|hello|hey|hii)\b/)) return "Hii! 👋 I'm EduManage! How can I help you today? 😊";
        return "I'm EduManage! I can help with syllabus, admission, attendance, marks, and library info. (OpenAI API seems to be down, running in safe mode)";
      };
      
      res.json({ 
        response: getSimpleResponse(req.body.message || "")
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
