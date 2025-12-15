
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import { registerRoutes } from "./server/routes";
import { storage } from "./server/storage";
import { db } from "./server/db";
import { students } from "./shared/schema";
import { sql } from "drizzle-orm";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

describe("Authentication Logic", () => {
  let server: any;
  const testStudent = {
    rollNo: "TEST-001",
    name: "Test Student",
    password: "Test Student", // Using name as password for new logic
  };
  let studentId: number;

  beforeAll(async () => {
    // Clean up potentially existing test student
    await db.delete(students).where(sql`roll_no = ${testStudent.rollNo}`);
    
    // Create test student directly in DB to bypass route hashing if any
    const created = await storage.createStudent({
      ...testStudent,
      password: "hashed_ignored_password" // Logic uses name check now
    });
    studentId = created.id;

    server = await registerRoutes(app);
  });

  afterAll(async () => {
    await db.delete(students).where(sql`roll_no = ${testStudent.rollNo}`);
  });

  it("should login successfully with correct student ID and name as password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        username: testStudent.rollNo,
        password: testStudent.name,
        role: "student",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe(testStudent.name);
  });

  it("should reject login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        username: testStudent.rollNo,
        password: "WrongPassword",
        role: "student",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid password");
  });

  it("should lockout account after 3 failed attempts", async () => {
    // Reset attempts first
    await storage.updateStudent(studentId, { failedLoginAttempts: 0, lockoutUntil: null });

    // Fail 1
    let res = await request(app)
      .post("/api/login")
      .send({
        username: testStudent.rollNo,
        password: "WrongPassword",
        role: "student",
      });
    expect(res.status).toBe(401);

    // Fail 2
    res = await request(app)
      .post("/api/login")
      .send({
        username: testStudent.rollNo,
        password: "WrongPassword",
        role: "student",
      });
    expect(res.status).toBe(401);

    // Fail 3 (Should Lock)
    res = await request(app)
      .post("/api/login")
      .send({
        username: testStudent.rollNo,
        password: "WrongPassword",
        role: "student",
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Account locked");

    // Attempt during lockout
    res = await request(app)
      .post("/api/login")
      .send({
        username: testStudent.rollNo,
        password: testStudent.name, // Correct password
        role: "student",
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Account locked");
  });
  
  it("should allow login after lockout expires (simulated)", async () => {
      // Manually expire the lockout
      await storage.updateStudent(studentId, { 
          lockoutUntil: new Date(Date.now() - 1000) // 1 second ago
      });

      const res = await request(app)
      .post("/api/login")
      .send({
          username: testStudent.rollNo,
          password: testStudent.name,
          role: "student",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
  });
});
