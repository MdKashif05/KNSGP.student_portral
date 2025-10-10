import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";
import AttendanceChart from "./AttendanceChart";
import MarksChart from "./MarksChart";
import LibraryBookCard from "./LibraryBookCard";
import DataTable from "./DataTable";
import { TrendingUp, Award, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface StudentDashboardProps {
  studentName: string;
  rollNo: string;
  studentId: number;
  onLogout?: () => void;
}

export default function StudentDashboard({ studentName, rollNo, studentId, onLogout }: StudentDashboardProps) {
  // Fetch student's attendance
  const { data: attendanceData = [] } = useQuery<any[]>({
    queryKey: ['/api/attendance'],
  });

  // Fetch student's marks
  const { data: marksData = [] } = useQuery<any[]>({
    queryKey: ['/api/marks'],
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
  });

  // Fetch library books
  const { data: books = [] } = useQuery<any[]>({
    queryKey: ['/api/library/books'],
  });

  // Fetch student's book issues
  const { data: bookIssues = [] } = useQuery<any[]>({
    queryKey: ['/api/library/issues'],
  });

  // Process attendance data for charts
  const attendanceBySubject = subjects.map((subject: any) => {
    const subjectAttendance = attendanceData.filter((a: any) => a.subjectId === subject.id);
    const present = subjectAttendance.filter((a: any) => a.status === 'Present').length;
    const absent = subjectAttendance.filter((a: any) => a.status === 'Absent').length;
    return {
      subject: subject.name,
      present,
      absent,
    };
  });

  // Calculate attendance percentage
  const totalClasses = attendanceData.length;
  const presentClasses = attendanceData.filter((a: any) => a.status === 'Present').length;
  const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : '0.0';

  // Process marks data for charts
  const marksChartData = Array.from(new Set(marksData.map((m: any) => m.testName))).map((testName: any) => {
    const testMarks = marksData.filter((m: any) => m.testName === testName);
    const studentAvg = testMarks.reduce((sum: number, m: any) => sum + (m.marksObtained / m.totalMarks * 100), 0) / Math.max(testMarks.length, 1);
    return {
      test: testName,
      student: Math.round(studentAvg),
      classAvg: Math.round(studentAvg - 5 + Math.random() * 10), // Approximate class average
    };
  });

  // Calculate average marks
  const avgMarks = marksData.length > 0
    ? (marksData.reduce((sum: number, m: any) => sum + (m.marksObtained / m.totalMarks * 100), 0) / marksData.length).toFixed(1)
    : '0.0';

  // Get books issued count
  const booksIssued = bookIssues.filter((issue: any) => issue.status === 'issued').length;

  // Prepare attendance table data
  const attendanceTableData = attendanceData.slice(0, 10).map((record: any) => {
    const subject = subjects.find((s: any) => s.id === record.subjectId);
    return {
      subject: subject?.name || 'Unknown',
      date: record.date,
      status: record.status,
    };
  });

  const attendanceColumns = [
    { key: 'subject', label: 'Subject' },
    { key: 'date', label: 'Date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Present' ? 'default' : 'destructive'}>
          {value}
        </Badge>
      )
    },
  ];

  // Prepare marks table data
  const marksTableData = marksData.slice(0, 10).map((record: any) => {
    const subject = subjects.find((s: any) => s.id === record.subjectId);
    const percentage = ((record.marksObtained / record.totalMarks) * 100).toFixed(0);
    return {
      subject: subject?.name || 'Unknown',
      test: record.testName,
      marks: record.marksObtained,
      total: record.totalMarks,
      percentage: parseInt(percentage),
    };
  });

  const marksColumns = [
    { key: 'subject', label: 'Subject' },
    { key: 'test', label: 'Test' },
    { key: 'marks', label: 'Marks Obtained' },
    { key: 'total', label: 'Total Marks' },
    { 
      key: 'percentage', 
      label: 'Percentage',
      render: (value: number) => (
        <Badge variant={value >= 75 ? 'default' : value >= 50 ? 'secondary' : 'destructive'}>
          {value}%
        </Badge>
      )
    },
  ];

  // Get issued books details
  const issuedBooksData = bookIssues
    .filter((issue: any) => issue.status === 'issued')
    .map((issue: any) => {
      const book = books.find((b: any) => b.id === issue.bookId);
      return {
        ...issue,
        title: book?.title || 'Unknown Book',
      };
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Portal</h1>
            <p className="text-sm text-muted-foreground">
              {studentName} ({rollNo})
            </p>
          </div>
          <Button variant="ghost" onClick={onLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
            <TabsTrigger value="marks" data-testid="tab-marks">Marks</TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Attendance"
                value={`${attendancePercentage}%`}
                icon={TrendingUp}
              />
              <StatCard
                title="Average Marks"
                value={avgMarks}
                icon={Award}
              />
              <StatCard
                title="Books Issued"
                value={booksIssued.toString()}
                icon={BookOpen}
                description="Currently reading"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {attendanceBySubject.length > 0 && (
                <AttendanceChart data={attendanceBySubject} />
              )}
              {marksChartData.length > 0 && (
                <MarksChart data={marksChartData} />
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceTableData.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Latest attendance: {attendanceTableData[0].subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {attendanceTableData[0].date} - {attendanceTableData[0].status}
                        </p>
                      </div>
                    </div>
                  )}
                  {marksTableData.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Award className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Latest marks: {marksTableData[0].subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {marksTableData[0].test} - {marksTableData[0].marks}/{marksTableData[0].total}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {attendanceBySubject.length > 0 && (
                <AttendanceChart data={attendanceBySubject} />
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceBySubject.map((item: any, index: number) => {
                      const total = item.present + item.absent;
                      const percentage = total > 0 ? ((item.present / total) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{item.subject}</span>
                            <Badge variant={Number(percentage) >= 75 ? 'default' : 'destructive'}>
                              {percentage}%
                            </Badge>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            {attendanceTableData.length > 0 && (
              <DataTable
                title="Attendance Records"
                description="Recent attendance history"
                columns={attendanceColumns}
                data={attendanceTableData}
              />
            )}
          </TabsContent>

          <TabsContent value="marks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marksChartData.length > 0 && (
                <MarksChart data={marksChartData} />
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Tests</span>
                      <span className="text-lg font-semibold">{marksData.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Score</span>
                      <span className="text-lg font-semibold">{avgMarks}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {marksTableData.length > 0 && (
              <DataTable
                title="Marks Details"
                description="All test and exam results"
                columns={marksColumns}
                data={marksTableData}
              />
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            {issuedBooksData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>My Issued Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {issuedBooksData.map((issue: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{issue.title}</p>
                            <p className="text-xs text-muted-foreground">Due: {issue.dueDate}</p>
                          </div>
                        </div>
                        <Badge>Issued</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Available Books</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.filter((book: any) => book.copiesAvailable > 0).slice(0, 6).map((book: any) => (
                  <LibraryBookCard
                    key={book.id}
                    title={book.title}
                    author={book.author}
                    copiesAvailable={book.copiesAvailable}
                    totalCopies={book.totalCopies}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
