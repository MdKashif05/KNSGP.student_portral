# CSE Student Portal - Design Guidelines

## Design Approach
**Utility-Focused Educational Portal** - This is a data-intensive, dashboard-heavy application where clarity, efficiency, and quick information access are paramount. We'll use a **design system approach** inspired by Material Design and modern dashboard patterns (Linear, Notion) with emphasis on data visualization and administrative workflows.

## Core Design Principles
- **Information Hierarchy**: Clear distinction between primary actions and secondary data
- **Status Communication**: Instant visual feedback through color coding
- **Efficient Navigation**: Role-based interfaces optimized for quick task completion
- **Data Clarity**: Tables and charts designed for easy comprehension

## Color Palette

### Primary Colors
**Light Mode:**
- Primary: 217 91% 60% (Blue - trust, education, professionalism)
- Primary Hover: 217 91% 50%

**Dark Mode:**
- Primary: 217 91% 65%
- Primary Hover: 217 91% 55%

### Status & Semantic Colors
- Success: 142 76% 36% (green for high attendance, good marks)
- Warning: 38 92% 50% (orange for medium attendance, approaching deadlines)
- Error: 0 84% 60% (red for low attendance, overdue books, failed marks)
- Info: 199 89% 48% (cyan for notifications, library info)

### Background & Surface Colors
**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Card: 0 0% 100% with shadow
- Border: 0 0% 90%

**Dark Mode:**
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Card: 217 33% 20% with subtle shadow
- Border: 217 33% 25%

### Text Colors
**Light Mode:**
- Primary Text: 222 47% 11%
- Secondary Text: 215 16% 47%
- Tertiary Text: 215 14% 60%

**Dark Mode:**
- Primary Text: 210 40% 98%
- Secondary Text: 215 20% 70%
- Tertiary Text: 215 20% 55%

## Typography
**Font Families:**
- Primary: 'Inter' (headings, UI elements, buttons)
- Secondary: 'Inter' (body text, tables, data)

**Font Scales:**
- H1 (Page Titles): text-3xl font-bold (30px)
- H2 (Section Headers): text-2xl font-semibold (24px)
- H3 (Card Titles): text-xl font-semibold (20px)
- H4 (Table Headers): text-lg font-medium (18px)
- Body: text-base (16px)
- Small/Caption: text-sm (14px)
- Tiny/Helper: text-xs (12px)

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20

**Container Strategy:**
- Dashboard max-width: max-w-7xl mx-auto
- Content padding: px-4 md:px-6 lg:px-8
- Card spacing: space-y-6
- Grid gaps: gap-4 md:gap-6

**Responsive Grid:**
- Stats Cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- Data Tables: Full width with horizontal scroll on mobile
- Charts: grid-cols-1 lg:grid-cols-2

## Component Library

### Navigation
- **Header:** Sticky top-0 with college name, user role badge, logout button
- **Sidebar (Admin):** Fixed left navigation with icons for Students, Subjects, Attendance, Marks, Library, Reports
- **Tabs (Student):** Horizontal tab navigation for Dashboard, Attendance, Marks, Library

### Cards & Containers
- **Stat Cards:** Rounded-xl with p-6, shadow-md, hover:shadow-lg transition
- **Data Cards:** Rounded-lg with p-4, border border-border
- **Chart Containers:** Rounded-xl bg-card p-6 shadow-sm

### Buttons
- **Primary:** bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-hover
- **Secondary:** border border-primary text-primary rounded-lg px-4 py-2 hover:bg-primary/10
- **Danger:** bg-error text-white rounded-lg px-4 py-2 hover:bg-error/90
- **Icon Buttons:** p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800

### Tables
- **Header:** bg-gray-50 dark:bg-gray-800 font-medium text-sm sticky top-0
- **Rows:** hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b transition
- **Cells:** px-4 py-3 text-sm
- **Action Buttons:** Inline icon buttons (Edit, Delete) with tooltips

### Forms & Inputs
- **Text Inputs:** rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-primary
- **Select Dropdowns:** Matching input styling with chevron icon
- **Checkboxes:** Rounded with primary color when checked
- **File Upload:** Dashed border with drag-and-drop area

### Charts & Graphs
- **Color Scheme:** Use primary (blue) for main data, success (green) for positive metrics, warning (orange) for medium, error (red) for alerts
- **Bar Charts:** Rounded tops, adequate spacing between bars
- **Line Charts:** Smooth curves with data point markers
- **Pie/Donut Charts:** Clear labels, distinct segment colors

### Modals & Dialogs
- **Backdrop:** bg-black/50 backdrop-blur-sm
- **Content:** bg-card rounded-xl shadow-2xl p-6 max-w-md
- **Actions:** Flex justify-end gap-2 with Cancel/Confirm buttons

### Notifications & Alerts
- **Toast Notifications:** Fixed top-right, slide-in animation, auto-dismiss after 3s
- **Alert Banners:** Full-width with icon, message, and close button
- **Color Coding:** Use semantic colors (success, warning, error, info)

### Status Indicators
- **Attendance Status:**
  - High (>75%): Green badge with checkmark icon
  - Medium (50-75%): Orange badge with alert icon
  - Low (<50%): Red badge with warning icon
- **Book Status:** Available (green), Issued (blue), Overdue (red)
- **Marks Status:** A+/A (green), B/C (orange), D/F (red)

### Icons & Visual Elements
- **Icon Library:** Heroicons (via CDN)
- **Book Icons:** Stack of books icon for library, individual book icon for each entry
- **Subject Icons:** Code, calculator, flask icons for different subjects
- **Action Icons:** Plus (add), pencil (edit), trash (delete), download (export)

## Dashboard Specific Guidelines

### Admin Dashboard
- **Top Stats Row:** 4 metric cards (Total Students, Avg Attendance, Avg Marks, Books Issued)
- **Main Content:** 2-column grid with charts (Attendance Trend, Marks Distribution)
- **Quick Actions:** Floating action button for common tasks (Add Student, Upload Attendance)

### Student Dashboard
- **Profile Card:** Student info with photo placeholder, roll number, attendance %
- **Performance Summary:** 3 metric cards (Attendance %, Average Marks, Books Issued)
- **Recent Activity:** Timeline of latest updates (marks uploaded, book issued)
- **Charts Section:** Attendance trends and marks comparison

## Interaction Patterns
- **Hover States:** Subtle elevation increase, color shifts
- **Loading States:** Skeleton screens for data tables, spinner for actions
- **Empty States:** Friendly illustrations with "No data" messages
- **Confirmation Dialogs:** "Are you sure?" modals for destructive actions
- **Success Feedback:** Green checkmark toast with success message
- **Error Handling:** Red toast with clear error message and retry option

## Responsive Behavior
- **Desktop (lg+):** Full sidebar navigation, multi-column layouts, expanded tables
- **Tablet (md):** Collapsed sidebar with icons only, 2-column grids
- **Mobile (sm):** Bottom navigation, single column, stacked cards, horizontal scroll tables

## Animations
Use sparingly for enhanced UX:
- Card hover: scale-105 transition-transform
- Modal entrance: fade + slide from top
- Toast notifications: slide from right
- Page transitions: Simple fade

## Images
**Profile Images:** Circular avatars (40px) with fallback initials for users
**Empty States:** Use simple SVG illustrations for "no data" states
**College Branding:** Logo in header (120px width, maintain aspect ratio)