import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import StatCard from "./StatCard";
import AttendanceChart from "./AttendanceChart";
import MarksChart from "./MarksChart";
import DataTable from "./DataTable";
import LibraryBookCard from "./LibraryBookCard";
import AddStudentDialog from "./AddStudentDialog";
import AddSubjectDialog from "./AddSubjectDialog";
import AddBookDialog from "./AddBookDialog";
import EditStudentDialog from "./EditStudentDialog";
import EditSubjectDialog from "./EditSubjectDialog";
import EditBookDialog from "./EditBookDialog";
import AddAttendanceDialog from "./AddAttendanceDialog";
import EditAttendanceDialog from "./EditAttendanceDialog";
import AddMarksDialog from "./AddMarksDialog";
import EditMarksDialog from "./EditMarksDialog";
import UploadMarksCSVDialog from "./UploadMarksCSVDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Users, TrendingUp, BookOpen, Award, Plus, Upload, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface AdminDashboardProps {
  adminName: string;
  onLogout?: () => void;
}

export default function AdminDashboard({ adminName, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [showEditBookDialog, setShowEditBookDialog] = useState(false);
  const [showAddAttendanceDialog, setShowAddAttendanceDialog] = useState(false);
  const [showEditAttendanceDialog, setShowEditAttendanceDialog] = useState(false);
  const [showAddMarksDialog, setShowAddMarksDialog] = useState(false);
  const [showEditMarksDialog, setShowEditMarksDialog] = useState(false);
  const [showUploadCSVDialog, setShowUploadCSVDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'student' | 'subject' | 'book' | 'attendance' | 'marks' | null>(null);
  const { toast } = useToast();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Fetch students
  const { data: students = [], refetch: refetchStudents } = useQuery<any[]>({
    queryKey: ['/api/students'],
    enabled: activeSection === 'dashboard' || activeSection === 'students',
  });

  // Fetch subjects
  const { data: subjects = [], refetch: refetchSubjects } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
    enabled: activeSection === 'dashboard' || activeSection === 'subjects',
  });

  // Fetch library books
  const { data: books = [], refetch: refetchBooks } = useQuery<any[]>({
    queryKey: ['/api/library/books'],
    enabled: activeSection === 'library',
  });

  // Fetch attendance records
  const { data: attendance = [], refetch: refetchAttendance } = useQuery<any[]>({
    queryKey: ['/api/attendance'],
    enabled: activeSection === 'attendance',
  });

  // Fetch marks records
  const { data: marks = [], refetch: refetchMarks } = useQuery<any[]>({
    queryKey: ['/api/marks'],
    enabled: activeSection === 'marks',
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const endpoints: Record<string, string> = {
        student: '/api/students',
        subject: '/api/subjects',
        book: '/api/library/books',
        attendance: '/api/attendance',
        marks: '/api/marks',
      };
      return await apiRequest('DELETE', `${endpoints[type]}/${id}`);
    },
    onSuccess: (_, { type }) => {
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
      });
      if (type === 'student') refetchStudents();
      if (type === 'subject') refetchSubjects();
      if (type === 'book') refetchBooks();
      if (type === 'attendance') refetchAttendance();
      if (type === 'marks') refetchMarks();
      setShowDeleteDialog(false);
      setItemToDelete(null);
      setDeleteType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (type: 'student' | 'subject' | 'book' | 'attendance' | 'marks', item: any) => {
    setItemToEdit(item);
    if (type === 'student') setShowEditStudentDialog(true);
    if (type === 'subject') setShowEditSubjectDialog(true);
    if (type === 'book') setShowEditBookDialog(true);
    if (type === 'attendance') setShowEditAttendanceDialog(true);
    if (type === 'marks') setShowEditMarksDialog(true);
  };

  const handleDelete = (type: 'student' | 'subject' | 'book' | 'attendance' | 'marks', item: any) => {
    setDeleteType(type);
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (itemToDelete && deleteType) {
      deleteMutation.mutate({ type: deleteType, id: itemToDelete.id });
    }
  };

  const studentsColumns = [
    { key: 'rollNo', label: 'Roll Number' },
    { key: 'name', label: 'Name' },
    { 
      key: 'attendancePercentage', 
      label: 'Attendance',
      render: (value: string) => {
        const percentage = parseFloat(value);
        return (
          <Badge variant={percentage >= 75 ? 'default' : 'destructive'}>
            {value}%
          </Badge>
        );
      }
    },
    { key: 'avgMarks', label: 'Avg Marks' },
    { key: 'booksIssued', label: 'Books' },
  ];

  const subjectsColumns = [
    { key: 'code', label: 'Subject Code' },
    { key: 'name', label: 'Subject Name' },
    { key: 'instructor', label: 'Instructor' },
  ];

  const attendanceColumns = [
    { 
      key: 'studentId', 
      label: 'Student',
      render: (value: number) => {
        const student = students.find(s => s.id === value);
        return student ? `${student.rollNo} - ${student.name}` : value;
      }
    },
    { 
      key: 'subjectId', 
      label: 'Subject',
      render: (value: number) => {
        const subject = subjects.find(s => s.id === value);
        return subject ? `${subject.code} - ${subject.name}` : value;
      }
    },
    { key: 'month', label: 'Month' },
    { key: 'presentDays', label: 'Present Days' },
    { key: 'totalDays', label: 'Total Days' },
    { 
      key: 'percentage', 
      label: 'Percentage',
      render: (value: number) => `${value.toFixed(1)}%`
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Good' ? 'default' : value === 'Average' ? 'secondary' : 'destructive'}>
          {value}
        </Badge>
      )
    },
  ];

  const marksColumns = [
    { 
      key: 'studentId', 
      label: 'Student',
      render: (value: number) => {
        const student = students.find(s => s.id === value);
        return student ? `${student.rollNo} - ${student.name}` : value;
      }
    },
    { 
      key: 'subjectId', 
      label: 'Subject',
      render: (value: number) => {
        const subject = subjects.find(s => s.id === value);
        return subject ? `${subject.code} - ${subject.name}` : value;
      }
    },
    { key: 'month', label: 'Month' },
    { key: 'testName', label: 'Test Name' },
    { 
      key: 'marksObtained', 
      label: 'Marks',
      render: (value: number, row: any) => `${value} / ${row.totalMarks}`
    },
    { 
      key: 'percentage', 
      label: 'Percentage',
      render: (value: number) => `${value.toFixed(1)}%`
    },
    { 
      key: 'grade', 
      label: 'Grade',
      render: (value: string) => (
        <Badge variant={['A+', 'A'].includes(value) ? 'default' : ['B+', 'B'].includes(value) ? 'secondary' : value === 'C' ? 'outline' : 'destructive'}>
          {value}
        </Badge>
      )
    },
  ];

  // Calculate dashboard stats
  const totalStudents = students.length;
  const avgAttendance = students.length > 0 
    ? (students.reduce((sum: number, s: any) => sum + parseFloat(s.attendancePercentage || 0), 0) / students.length).toFixed(1)
    : '0.0';
  const avgMarks = students.length > 0
    ? (students.reduce((sum: number, s: any) => sum + parseFloat(s.avgMarks || 0), 0) / students.length).toFixed(1)
    : '0.0';
  const totalBooksIssued = students.reduce((sum: number, s: any) => sum + (s.booksIssued || 0), 0);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Students" value={totalStudents.toString()} icon={Users} description="Active enrollments" />
              <StatCard title="Avg Attendance" value={`${avgAttendance}%`} icon={TrendingUp} />
              <StatCard title="Books Issued" value={totalBooksIssued.toString()} icon={BookOpen} description="Currently checked out" />
              <StatCard title="Avg Marks" value={avgMarks} icon={Award} />
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
              <Button 
                onClick={() => setShowAddStudentDialog(true)}
                data-testid="button-add-student"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
            <DataTable
              title="All Students"
              description="Complete list of enrolled students"
              columns={studentsColumns}
              data={students}
              actions={true}
              onEdit={(row) => handleEdit('student', row)}
              onDelete={(row) => handleDelete('student', row)}
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
              <Button 
                onClick={() => setShowAddSubjectDialog(true)}
                data-testid="button-add-subject"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
            <DataTable
              title="All Subjects"
              description="Complete list of subjects"
              columns={subjectsColumns}
              data={subjects}
              actions={true}
              onEdit={(row) => handleEdit('subject', row)}
              onDelete={(row) => handleDelete('subject', row)}
            />
          </div>
        );

      case "attendance":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Attendance Management</h2>
                <p className="text-muted-foreground">Track and manage monthly attendance records</p>
              </div>
              <Button 
                onClick={() => setShowAddAttendanceDialog(true)}
                data-testid="button-add-attendance"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attendance
              </Button>
            </div>
            <DataTable
              title="Attendance Records"
              description="Monthly attendance tracking"
              columns={attendanceColumns}
              data={attendance}
              actions={true}
              onEdit={(row) => handleEdit('attendance', row)}
              onDelete={(row) => handleDelete('attendance', row)}
            />
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadCSVDialog(true)}
                  data-testid="button-upload-marks-csv"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <Button 
                  onClick={() => setShowAddMarksDialog(true)}
                  data-testid="button-add-marks"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Marks
                </Button>
              </div>
            </div>
            <DataTable
              title="Marks Records"
              description="Student marks and grades"
              columns={marksColumns}
              data={marks}
              actions={true}
              onEdit={(row) => handleEdit('marks', row)}
              onDelete={(row) => handleDelete('marks', row)}
            />
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
              <Button 
                onClick={() => setShowAddBookDialog(true)}
                data-testid="button-add-book"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book: any) => (
                <div key={book.id} className="relative">
                  <LibraryBookCard
                    title={book.title}
                    author={book.author}
                    copiesAvailable={book.copiesAvailable}
                    totalCopies={book.totalCopies}
                    onIssue={() => toast({ title: "Issue", description: "Issue book functionality coming soon" })}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit('book', book)}
                      data-testid={`button-edit-book-${book.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDelete('book', book)}
                      data-testid={`button-delete-book-${book.id}`}
                    >
                      <span className="text-xs">×</span>
                    </Button>
                  </div>
                </div>
              ))}
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
            <Card>
              <CardHeader>
                <CardTitle>Reports functionality</CardTitle>
                <CardDescription>Detailed reports and analytics coming soon</CardDescription>
              </CardHeader>
            </Card>
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

      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onSuccess={refetchStudents}
      />

      <AddSubjectDialog
        open={showAddSubjectDialog}
        onOpenChange={setShowAddSubjectDialog}
        onSuccess={refetchSubjects}
      />

      <AddBookDialog
        open={showAddBookDialog}
        onOpenChange={setShowAddBookDialog}
        onSuccess={refetchBooks}
      />

      <EditStudentDialog
        open={showEditStudentDialog}
        onOpenChange={setShowEditStudentDialog}
        student={itemToEdit}
        onSuccess={refetchStudents}
      />

      <EditSubjectDialog
        open={showEditSubjectDialog}
        onOpenChange={setShowEditSubjectDialog}
        subject={itemToEdit}
        onSuccess={refetchSubjects}
      />

      <EditBookDialog
        open={showEditBookDialog}
        onOpenChange={setShowEditBookDialog}
        book={itemToEdit}
        onSuccess={refetchBooks}
      />

      <AddAttendanceDialog
        open={showAddAttendanceDialog}
        onOpenChange={setShowAddAttendanceDialog}
        onSuccess={refetchAttendance}
      />

      <EditAttendanceDialog
        open={showEditAttendanceDialog}
        onOpenChange={setShowEditAttendanceDialog}
        attendance={itemToEdit}
        onSuccess={refetchAttendance}
      />

      <AddMarksDialog
        open={showAddMarksDialog}
        onOpenChange={setShowAddMarksDialog}
        onSuccess={refetchMarks}
      />

      <EditMarksDialog
        open={showEditMarksDialog}
        onOpenChange={setShowEditMarksDialog}
        marks={itemToEdit}
        onSuccess={refetchMarks}
      />

      <UploadMarksCSVDialog
        open={showUploadCSVDialog}
        onOpenChange={setShowUploadCSVDialog}
        onSuccess={refetchMarks}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType}?`}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </SidebarProvider>
  );
}
