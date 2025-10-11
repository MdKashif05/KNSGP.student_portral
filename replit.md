# CSE Student Portal

## Overview

The CSE Student Portal is a comprehensive educational management system for Kameshwar Narayan Singh Govt Polytechnic College's Computer Science Engineering department. The application enables administrators to manage student records, attendance, marks, and library resources, while students can view their academic progress and library information through dedicated dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- TailwindCSS for utility-first styling with custom design tokens
- Shadcn/ui component library built on Radix UI primitives
- TanStack Query (React Query) for server state management
- Recharts for data visualization (attendance and marks charts)

**Design System:**
- Custom color palette with semantic colors for status communication (success/warning/error/info)
- Dual theme support (light/dark mode) with CSS custom properties
- Consistent spacing and typography using Inter font family
- Component variants using class-variance-authority for maintainable styling
- Elevation system for hover and active states

**Key Architectural Decisions:**
- Role-based UI rendering: Separate dashboard components for admin and student views
- Client-side routing handled within App.tsx component switching
- Form validation using react-hook-form with Zod schema resolvers
- Optimistic UI updates with React Query mutations
- Session-based authentication state management

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js server framework
- TypeScript for type safety across the codebase
- Drizzle ORM for database operations with type-safe queries
- Express sessions for authentication state persistence
- Zod for runtime validation of API payloads

**API Design:**
- RESTful API endpoints organized by resource type
- Role-based middleware (requireAuth, requireAdmin, requireStudent) for access control
- Session-based authentication (no JWT tokens)
- Centralized error handling and response formatting
- Request/response logging for debugging

**Authentication System:**
- Dual login system: Admin (username/password) and Student (roll number/name)
- Case-insensitive password matching for student logins
- Session-based authentication with HttpOnly cookies stored in PostgreSQL
- PostgreSQL session store ensures session persistence across autoscale instances
- Role-based access control enforced at route level
- Shared admin password from ADMIN_PASSWORD environment variable (Knsgp2023)

### Data Storage

**Database:**
- PostgreSQL database (configured for Neon serverless)
- Connection pooling via @neondatabase/serverless
- WebSocket-based connection for serverless compatibility

**Schema Design:**
- Students table: Roll number as unique identifier, name as password
- Admins table: Name as unique identifier with shared password
- Subjects table: Course information with instructor details
- Attendance table: Foreign keys to students and subjects with status tracking
- Marks table: Student performance records linked to subjects and tests
- Library books table: Inventory management with available/total copies
- Book issues table: Tracking student borrowing with due dates and return status

**Data Relationships:**
- One-to-many: Student to Attendance records
- One-to-many: Student to Marks records
- One-to-many: Student to Book Issues
- Many-to-one: Attendance/Marks to Subjects
- Many-to-one: Book Issues to Library Books

## External Dependencies

**UI Component Libraries:**
- @radix-ui/* - Accessible, unstyled UI primitives (dialogs, dropdowns, tooltips, etc.)
- lucide-react - Icon library for consistent iconography
- recharts - Chart library for attendance and marks visualization
- embla-carousel-react - Carousel functionality
- cmdk - Command palette component

**Data Management:**
- @tanstack/react-query - Server state synchronization and caching
- drizzle-orm - Type-safe database ORM
- drizzle-zod - Schema validation integration
- @neondatabase/serverless - PostgreSQL serverless client

**Form Management:**
- react-hook-form - Form state and validation
- @hookform/resolvers - Validation resolver integration
- zod - Schema validation library

**Development Tools:**
- @replit/vite-plugin-* - Replit-specific development plugins
- tsx - TypeScript execution for development
- esbuild - Production build bundling

**Session Management:**
- express-session - Session middleware
- connect-pg-simple - PostgreSQL session store for production reliability
- **Important:** PostgreSQL session store is REQUIRED for production deployments with autoscale to persist sessions across multiple server instances

**Styling:**
- tailwindcss - Utility-first CSS framework
- autoprefixer - CSS vendor prefixing
- class-variance-authority - Component variant management
- clsx & tailwind-merge - Conditional class composition