# Fix Duplicate Students in Production Database

## ⚠️ IMPORTANT: Run this on your PRODUCTION database only!

This guide will help you remove duplicate students from your production database.

## Step 1: Find Duplicate Students

Run this SQL to see which students have duplicates:

```sql
SELECT roll_no, COUNT(*) as count, STRING_AGG(id::text, ', ') as ids
FROM students 
GROUP BY roll_no 
HAVING COUNT(*) > 1;
```

## Step 2: Keep Only One Record (Automatic)

This SQL will automatically keep the FIRST student record (lowest ID) for each roll number and delete all duplicates:

```sql
-- This deletes duplicate students, keeping only the one with lowest ID
DELETE FROM students 
WHERE id IN (
  SELECT s.id 
  FROM students s
  INNER JOIN (
    SELECT roll_no, MIN(id) as min_id
    FROM students
    GROUP BY roll_no
    HAVING COUNT(*) > 1
  ) dups ON s.roll_no = dups.roll_no
  WHERE s.id > dups.min_id
);
```

## Step 3: Verify No Duplicates Remain

```sql
-- Should return no rows
SELECT roll_no, COUNT(*) as count
FROM students 
GROUP BY roll_no 
HAVING COUNT(*) > 1;
```

## Step 4: Check Total Students

```sql
SELECT COUNT(*) as total_students FROM students;
```

---

## 🔧 How to Run These SQL Commands

### On Replit (Production Database):

1. **Go to your published app**: https://edu-manage-knsgp.replit.app
2. **Open Replit Dashboard** → Click on your project
3. **Click "Tools"** in the left sidebar
4. **Click "Database"** 
5. **Select "PostgreSQL"** tab
6. **Switch to "Production"** environment (important!)
7. **Click "SQL Editor"**
8. **Copy and paste** the SQL commands above
9. **Run each command** one by one

---

## ✅ After Fixing Duplicates

1. **Hard refresh your website**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Test student login** with any roll number
3. **Login should work immediately** without errors

---

## 📋 Common Issues

**Q: Still getting login errors?**
- Make sure you're using the correct roll number (check admin dashboard)
- Password is the student's NAME (case-insensitive)
- Hard refresh the browser

**Q: Which student record is kept?**
- The system keeps the FIRST student (lowest database ID)
- All duplicates are removed automatically
