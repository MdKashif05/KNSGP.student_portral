import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import StatCard from "./StatCard";
import AttendanceChart from "./AttendanceChart";
import MarksChart from "./MarksChart";
import DataTable from "./DataTable";
import LibraryBookCard from "./LibraryBookCard";
import { Users, TrendingUp, BookOpen, Award, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminDashboardProps {
  adminName: string;
  onLogout?: () => void;
}

export default function AdminDashboard({ adminName, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const attendanceData = [
    { subject: 'Programming in C', present: 32, absent: 7 },
    { subject: 'Data Structures', present: 35, absent: 4 },
    { subject: 'DBMS', present: 30, absent: 9 },
    { subject: 'Web Dev', present: 36, absent: 3 },
    { subject: 'OS', present: 28, absent: 11 },
  ];

  const marksData = [
    { test: 'Test 1', student: 75, classAvg: 68 },
    { test: 'Test 2', student: 82, classAvg: 72 },
    { test: 'Mid-term', student: 78, classAvg: 74 },
  ];

  const studentsColumns = [
    { key: 'rollNo', label: 'Roll Number' },
    { key: 'name', label: 'Name' },
    { 
      key: 'attendance', 
      label: 'Attendance',
      render: (value: number) => (
        <Badge variant={value >= 75 ? 'default' : 'destructive'}>
          {value}%
        </Badge>
      )
    },
    { key: 'avgMarks', label: 'Avg Marks' },
    { key: 'booksIssued', label: 'Books' },
  ];

  const studentsData = [
    { rollNo: '2023-CSE-01', name: 'Bhaskar Kumar', attendance: 85, avgMarks: 78, booksIssued: 2 },
    { rollNo: '2023-CSE-03', name: 'Subhash Kumar', attendance: 72, avgMarks: 82, booksIssued: 1 },
    { rollNo: '2023-CSE-04', name: 'Prithvi Kumar Singh', attendance: 90, avgMarks: 88, booksIssued: 3 },
    { rollNo: '2023-CSE-05', name: 'Aniket Kumar', attendance: 68, avgMarks: 75, booksIssued: 0 },
  ];

  const subjectsColumns = [
    { key: 'code', label: 'Subject Code' },
    { key: 'name', label: 'Subject Name' },
    { key: 'instructor', label: 'Instructor' },
    { key: 'students', label: 'Students' },
  ];

  const subjectsData = [
    { code: 'CSE101', name: 'Programming in C', instructor: 'Dr. Sharma', students: 39 },
    { code: 'CSE102', name: 'Data Structures', instructor: 'Prof. Kumar', students: 39 },
    { code: 'CSE103', name: 'DBMS', instructor: 'Dr. Singh', students: 39 },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Students" value="39" icon={Users} description="Active enrollments" />
              <StatCard title="Avg Attendance" value="85.2%" icon={TrendingUp} trend={{ value: 3.5, isPositive: true }} />
              <StatCard title="Books Issued" value="127" icon={BookOpen} description="Currently checked out" />
              <StatCard title="Avg Marks" value="78.4" icon={Award} trend={{ value: 2.1, isPositive: true }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceChart data={attendanceData} />
              <MarksChart data={marksData} />
            </div>
          </div>
        );

      case "students":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Student Management</h2>
                <p className="text-muted-foreground">Manage all student records</p>
              </div>
              <Button data-testid="button-add-student">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
            <DataTable
              title="All Students"
              description="Complete list of enrolled students"
              columns={studentsColumns}
              data={studentsData}
              actions={true}
              onEdit={(row) => console.log('Edit student:', row)}
              onDelete={(row) => console.log('Delete student:', row)}
            />
          </div>
        );

      case "subjects":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Subject Management</h2>
                <p className="text-muted-foreground">Manage all subjects and courses</p>
              </div>
              <Button data-testid="button-add-subject">
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
            <DataTable
              title="All Subjects"
              description="Complete list of subjects"
              columns={subjectsColumns}
              data={subjectsData}
              actions={true}
              onEdit={(row) => console.log('Edit subject:', row)}
              onDelete={(row) => console.log('Delete subject:', row)}
            />
          </div>
        );

      case "attendance":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Attendance Management</h2>
                <p className="text-muted-foreground">Track and manage student attendance</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" data-testid="button-upload-csv">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <Button data-testid="button-mark-attendance">
                  <Plus className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </div>
            </div>
            <AttendanceChart data={attendanceData} />
          </div>
        );

      case "marks":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Marks Management</h2>
                <p className="text-muted-foreground">Upload and manage student marks</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" data-testid="button-upload-marks-csv">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <Button data-testid="button-add-marks">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Marks
                </Button>
              </div>
            </div>
            <MarksChart data={marksData} />
          </div>
        );

      case "library":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Library Management</h2>
                <p className="text-muted-foreground">Manage books and issue records</p>
              </div>
              <Button data-testid="button-add-book">
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <LibraryBookCard
                title="Introduction to Algorithms"
                author="Thomas H. Cormen"
                copiesAvailable={3}
                totalCopies={5}
                onIssue={() => console.log('Issue book')}
              />
              <LibraryBookCard
                title="Database System Concepts"
                author="Abraham Silberschatz"
                copiesAvailable={0}
                totalCopies={4}
              />
              <LibraryBookCard
                title="Operating System Concepts"
                author="Abraham Silberschatz"
                copiesAvailable={2}
                totalCopies={3}
                onIssue={() => console.log('Issue book')}
              />
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <p className="text-muted-foreground">Comprehensive insights and reports</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Report</CardTitle>
                  <CardDescription>Overall attendance statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceChart data={attendanceData} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Report</CardTitle>
                  <CardDescription>Class performance trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <MarksChart data={marksData} />
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar 
          activeItem={activeSection}
          onNavigate={setActiveSection}
          onLogout={onLogout}
        />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Welcome, {adminName}</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
