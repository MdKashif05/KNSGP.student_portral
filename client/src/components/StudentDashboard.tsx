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
  onLogout?: () => void;
}

export default function StudentDashboard({ studentName, rollNo, onLogout }: StudentDashboardProps) {
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
    { test: 'Test 3', student: 85, classAvg: 76 },
    { test: 'Final', student: 88, classAvg: 79 },
  ];

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

  const attendanceTableData = [
    { subject: 'Programming in C', date: '2025-10-09', status: 'Present' },
    { subject: 'Data Structures', date: '2025-10-09', status: 'Present' },
    { subject: 'DBMS', date: '2025-10-08', status: 'Absent' },
    { subject: 'Web Dev', date: '2025-10-08', status: 'Present' },
  ];

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

  const marksTableData = [
    { subject: 'Programming in C', test: 'Mid-term', marks: 38, total: 50, percentage: 76 },
    { subject: 'Data Structures', test: 'Test 1', marks: 42, total: 50, percentage: 84 },
    { subject: 'DBMS', test: 'Mid-term', marks: 35, total: 50, percentage: 70 },
    { subject: 'Web Dev', test: 'Test 2', marks: 45, total: 50, percentage: 90 },
  ];

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
                value="85.2%"
                icon={TrendingUp}
                trend={{ value: 3.5, isPositive: true }}
              />
              <StatCard
                title="Average Marks"
                value="81.6"
                icon={Award}
                trend={{ value: 5.2, isPositive: true }}
              />
              <StatCard
                title="Books Issued"
                value="2"
                icon={BookOpen}
                description="Currently reading"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceChart data={attendanceData} />
              <MarksChart data={marksData} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Attendance marked for Web Dev</p>
                      <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Award className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">New marks uploaded for DBMS Mid-term</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 3:15 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceChart data={attendanceData} />
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceData.map((item, index) => {
                      const total = item.present + item.absent;
                      const percentage = ((item.present / total) * 100).toFixed(1);
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
            <DataTable
              title="Attendance Records"
              description="Recent attendance history"
              columns={attendanceColumns}
              data={attendanceTableData}
            />
          </TabsContent>

          <TabsContent value="marks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarksChart data={marksData} />
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">A+ (90-100)</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: '60%' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">3</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">A (80-89)</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: '80%' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">4</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">B (70-79)</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-warning rounded-full" style={{ width: '40%' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">2</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DataTable
              title="Marks Details"
              description="All test and exam results"
              columns={marksColumns}
              data={marksTableData}
            />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Issued Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Introduction to Algorithms</p>
                        <p className="text-xs text-muted-foreground">Due: Oct 20, 2025</p>
                      </div>
                    </div>
                    <Badge>Issued</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Database System Concepts</p>
                        <p className="text-xs text-muted-foreground">Due: Oct 18, 2025</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold mb-4">Available Books</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <LibraryBookCard
                  title="Operating System Concepts"
                  author="Abraham Silberschatz"
                  copiesAvailable={2}
                  totalCopies={3}
                  onIssue={() => console.log('Issue book')}
                />
                <LibraryBookCard
                  title="Computer Networks"
                  author="Andrew S. Tanenbaum"
                  copiesAvailable={4}
                  totalCopies={5}
                  onIssue={() => console.log('Issue book')}
                />
                <LibraryBookCard
                  title="Software Engineering"
                  author="Ian Sommerville"
                  copiesAvailable={0}
                  totalCopies={3}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
