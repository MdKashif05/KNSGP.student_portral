# Authentication Mechanism

## Student Login
- **Username**: Student Roll Number (e.g., `2023-CSE-01`)
- **Password**: Student Name (Case-sensitive, e.g., `Bhaskar Kumar`)

### Security & Account Lockout
- **Invalid ID Format**: The system validates the Student ID format before processing the login.
- **Failed Attempts**: Invalid login attempts are tracked.
- **Account Lockout**: After **3 consecutive failed attempts**, the account is locked for **15 minutes**.
- **Error Messages**: 
  - "Invalid student ID format"
  - "Invalid roll number"
  - "Invalid password. X attempts remaining."
  - "Account locked due to multiple failed attempts. Please try again in 15 minutes."

### System Maintenance
- If the system is in maintenance mode (`MAINTENANCE_MODE=true`), all login attempts will be rejected with a 503 Service Unavailable status and a maintenance message.

## Admin Login
- Uses standard username/password with bcrypt hashing.
- Admin accounts are protected by standard security measures.

## Changes (2025-12-15)
- **Restored Authentication Flow**: Student login now uses Roll Number as username and Name as password.
- **Enhanced Security**:
  - Added `failed_login_attempts` and `lockout_until` columns to `students` table.
  - Implemented 3-strike account lockout policy (15 minutes duration).
  - Added validation for Student ID format.
- **Maintenance Mode**: Added support for system-wide maintenance mode via environment variable.
- **Testing**: Added comprehensive unit tests in `tests/auth.test.ts` covering:
  - Successful login
  - Incorrect password handling
  - Account lockout logic
  - Lockout expiration
  - Invalid ID format rejection
  - Maintenance mode behavior
