
import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import express from "express";
import session from "express-session";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { students } from "../shared/schema";
import { sql } from "drizzle-orm";
import { createServer } from "http";

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

let server: any;
let baseUrl: string;
let studentId: number;

const testStudent = {
  rollNo: "TEST-001",
  name: "Test Student",
  password: "Test Student", 
};

describe("Authentication Logic", async () => {
  before(async () => {
    // Setup server
    server = await registerRoutes(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // Clean up
    await db.delete(students).where(sql`roll_no = ${testStudent.rollNo}`);
    
    // Create test student
    const created = await storage.createStudent({
      ...testStudent,
      password: "hashed_ignored_password"
    });
    studentId = created.id;
  });

  after(async () => {
    await db.delete(students).where(sql`roll_no = ${testStudent.rollNo}`);
    server.close();
  });

  test("should login successfully with correct student ID and name as password", async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testStudent.rollNo,
        password: testStudent.name,
        role: "student",
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.name, testStudent.name);
  });

  test("should reject login with incorrect password", async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testStudent.rollNo,
        password: "WrongPassword",
        role: "student",
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.match(body.message, /Invalid password/);
  });

  test("should lockout account after 3 failed attempts", async () => {
    // Reset attempts first
    await storage.updateStudent(studentId, { failedLoginAttempts: 0, lockoutUntil: null });

    // Fail 1
    let res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testStudent.rollNo, password: "WrongPassword", role: "student" }),
    });
    assert.strictEqual(res.status, 401);

    // Fail 2
    res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: testStudent.rollNo, password: "WrongPassword", role: "student" }),
    });
    assert.strictEqual(res.status, 401);

    // Fail 3 (Should Lock)
    res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: testStudent.rollNo, password: "WrongPassword", role: "student" }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 403);
    assert.match(body.message, /Account locked/);

    // Attempt during lockout with CORRECT password
    res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: testStudent.rollNo, password: testStudent.name, role: "student" }),
    });
    assert.strictEqual(res.status, 403);
  });

  test("should allow login after lockout expires (simulated)", async () => {
    // Manually expire the lockout
    await storage.updateStudent(studentId, { 
        lockoutUntil: new Date(Date.now() - 1000) // 1 second ago
    });

    const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: testStudent.rollNo,
            password: testStudent.name,
            role: "student",
        }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
  });

  test("should reject invalid roll number format", async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "invalid_format!",
        password: "any",
        role: "student",
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.match(body.message, /Invalid student ID format/);
  });

  test("should reject login during maintenance mode", async () => {
    process.env.MAINTENANCE_MODE = "true";
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testStudent.rollNo,
        password: testStudent.name,
        role: "student",
      }),
    });
    
    delete process.env.MAINTENANCE_MODE; // Reset

    const body = await res.json();
    assert.strictEqual(res.status, 503);
    assert.match(body.message, /maintenance/);
  });
});
