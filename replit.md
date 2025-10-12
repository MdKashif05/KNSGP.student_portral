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
- Recharts for data visualization with interactive charts:
  - **Admin Dashboard Charts:**
    - AttendanceOverviewChart: Line chart showing monthly attendance trends (present vs absent)
    - MarksDistributionChart: Bar chart displaying marks distribution across ranges
    - SubjectPerformanceChart: Bar chart showing average performance by subject
    - LibraryStatisticsChart: Pie chart with book availability overview
  - **Student Dashboard Charts:**
    - AttendanceChart: Personal attendance trends
    - MarksChart: Individual performance visualization

**Design System:**
- **Modern Color Palette (October 2025):** Purple/violet theme (262 hue) for primary colors, replacing previous blue theme
  - Light mode: Clean backgrounds (220 20% 97%) with subtle purple accents
  - Dark mode: Professional dark backgrounds (240 10% 8%) with vibrant purple highlights
  - Primary color: 262 83% 58% (light) / 262 80% 65% (dark)
- **Custom Gradient Effects:** 
  - `gradient-text`: Purple-to-pink gradient text for headers
  - `gradient-bg`: Subtle purple gradient backgrounds
  - `glass-effect`: Frosted glass effect with backdrop blur
  - `modern-card`: Enhanced card styling with hover effects
- **Smooth Animations System:**
  - `fade-in`: Smooth opacity entrance animation
  - `slide-up`: Upward slide with fade-in effect
  - `scale-in`: Scale entrance animation
  - `hover-lift`: Smooth lift effect on hover (translateY + shadow)
  - `smooth-transition`: Cubic-bezier easing for all transitions
  - **Important:** No scale transforms on interactive elements (buttons, inputs) to avoid layout shifts
  - Staggered animations for dashboard cards (0.1s, 0.2s, 0.3s, 0.4s delays)
- Dual theme support (light/dark mode) with CSS custom properties
- Consistent spacing and typography using Inter font family
- Component variants using class-variance-authority for maintainable styling
- Elevation system for hover and active states
- **Mobile-First Responsive Design:** Full-width buttons on mobile (w-full sm:w-auto), adaptive spacing (p-4 sm:p-6 lg:p-8)

**Key Architectural Decisions:**
- Role-based UI rendering: Separate dashboard components for admin and student views
- Client-side routing handled within App.tsx component switching
- Form validation using react-hook-form with Zod schema resolvers
- Optimistic UI updates with React Query mutations
- Session-based authentication state management

**AI-Powered Chatbot:**
- **EduManage**: Dialog-based chatbot available on both admin and student dashboards
- **Technology**: OpenAI GPT-4o integration via Replit AI Integrations (no API key required, billed to Replit credits)
- **Dynamic Database Integration**: Fetches real-time subjects and instructor data from database on each request, ensuring chatbot always has current information
- **Knowledge Base**: Comprehensive institutional and SBTE Bihar information including:
  - **Complete SBTE Bihar CSE Syllabus**: Detailed semester-wise syllabus (Semester 1-6) with all subjects, topics, and evaluation patterns
  - **Official References**: Links to SBTE Bihar website and official CSE syllabus PDF for additional resources
  - **KNSGP College Information**:
    - Full Name: Kameshwar Narayan Singh Government Polytechnic (KNSGP), Samastipur
    - Established: March 29, 2016 (Department of Science & Technology letter no. 890 dated 29.03.2016)
    - Proposal initiated by Finance Department Resolution No. 96 Vi (2) dt. 03.01.2008
    - Cabinet approval on 25.01.2016 in item no. 12
    - Land: 10 acres donated by Roy Ganga Ram Kameshwar Narayan Public Trust
    - Location: Kishunpur, Tabhka village under Bibhutipur Block, Samastipur, Bihar - 848160
    - Distance: 36 km from Samastipur HQ, 10 km from Dalsinghsarai Railway Station, 22 km from Rosera
    - Cultural significance: Famous for Nagpanchami fair
    - Special Feature: HUB in Centre of Excellence in 3D Printing in collaboration with IIT Patna under Dept. of Science & Technology, Govt. of Bihar
    - Website: https://www.knsgpsamastipur.ac.in/
    - Contact: principalknspolysamastipur@gmail.com, Phone: 9430560596
    - Principal: Prof. Aftab Anjum
    - HOD (CSE Department): Prof. Raghvendra Pratap
    - Departments: Civil Engineering, Computer Science & Engineering, Electrical Engineering, Electronics Engineering, Mechanical Engineering, Applied Sciences & Humanities
  - **CSE Department Faculty & Subjects**:
    - Programming in C (CSE101) - Dr. Sharma
    - Data Structures (CSE102) - Prof. Kumar
    - Database Management Systems (CSE103) - Dr. Singh
    - Web Development (CSE104) - Prof. Verma
    - Operating Systems (CSE105) - Dr. Patel
  - **Special Information**:
    - EduManage Chatbot Founders: Mohammad Kashif, Rajan Kumar, and Md Shad
    - AP (Advanced Programming): Room 309 Unit 03, Guided By Anurag Pandey
    - Pathak Jii: Love Guru without a love life
    - Shailya Singh: Too much closed
  - Current exam schedules and registration deadlines (December 2025 exams)
  - SBTE Bihar course details, syllabus, and portal links
  - General polytechnic education guidance
- **UI Design**: 
  - **Launcher Button**: Enhanced visibility with purple gradient and pulse animation
    - Size: 64px (h-16 w-16) for prominent visibility
    - Gradient: from-primary to-purple-600 with purple shadow glow
    - Pulse animation with 2-second duration
    - Hover effect: scales to 110% with enhanced shadow
    - Position: fixed bottom-4 right-4 with z-index 9999
  - **Dialog Modal**: Centered Shadcn Dialog component (replaces floating overlay)
    - Width: 95vw on mobile, max-width 672px (2xl) on desktop
    - Height: 80vh with max-height 600px
    - Backdrop overlay dims dashboard content when active
    - Prevents content overlap - modal clearly takes focus in center of viewport
  - **Auto-Scroll Functionality**: 
    - Automatically scrolls to bottom when new messages arrive
    - Scrolls to bottom as user types to keep input visible
    - Smooth scroll behavior for better UX
  - Real-time message streaming with timestamps
  - Loading indicators and error handling
  - Accessible: ESC key closes, focus management, backdrop click dismissal, screen reader support
- **User Experience**: Click launcher → Dialog opens centered → Dashboard visible behind backdrop → Close with X/ESC/backdrop
- **Personality**: Conversational and friendly like WhatsApp chats
  - Uses casual greetings: "Hii! 👋", "Hey there! 😊", "Perfect! ✨"
  - Recognizes farewells: "Bye! 👋", "See you later! 😊", "Take care! ✨" (for "bye", "by", "goodbye")
  - Natural emoji usage throughout responses
  - Conversational phrases: "Great question!", "Sure thing!", "Happy to help! 👍"
  - Responds warmly to thanks and acknowledgments
  - Maintains accuracy while being friendly and approachable

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
- **Chatbot Endpoint**: POST /api/chat (authentication-protected)
  - Accepts user messages and returns AI-generated responses
  - Injects SBTE Bihar context into GPT-4o model
  - Uses Replit AI Integrations for OpenAI access

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