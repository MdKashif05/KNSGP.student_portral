import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/common/StatCard";
import AttendanceChart from "@/components/charts/AttendanceChart";
import MarksChart from "@/components/charts/MarksChart";
import LibraryBookCard from "@/components/common/LibraryBookCard";
import DataTable from "@/components/common/DataTable";
import { TrendingUp, Award, BookOpen, Calendar, Bell, Key, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import ChangePasswordDialog from "@/components/dialogs/ChangePasswordDialog";

// Isolated component for time display to prevent full dashboard re-renders
function CurrentTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <StatCard
      title="Current Time"
      value={currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      icon={Clock}
      description={currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
    />
  );
}

interface StudentDashboardProps {
  studentName: string;
  rollNo: string;
  studentId: number;
  branchId?: number | null;
  onLogout?: () => void;
}

export default function StudentDashboard({ studentName, rollNo, studentId, branchId, onLogout }: StudentDashboardProps) {
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [latestPopupNotice, setLatestPopupNotice] = useState<any>(null);

  // Fetch student's attendance - cached with studentId for instant loading
  const { data: attendanceData = [], isLoading: isLoadingAttendance } = useQuery<any[]>({
    queryKey: ['/api/attendance', studentId],
  });

  // Fetch student's marks - cached with studentId for instant loading
  const { data: marksData = [], isLoading: isLoadingMarks } = useQuery<any[]>({
    queryKey: ['/api/marks', studentId],
  });

  // Fetch subjects - cached globally for instant loading
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<any[]>({
    queryKey: branchId ? [`/api/subjects?branchId=${branchId}`] : ['/api/subjects'],
  });

  // Fetch library books - cached globally for instant loading
  const { data: books = [] } = useQuery<any[]>({
    queryKey: branchId ? [`/api/library/books?branchId=${branchId}`] : ['/api/library/books'],
  });

  // Fetch student's book issues - cached with studentId for instant loading
  const { data: bookIssues = [] } = useQuery<any[]>({
    queryKey: ['/api/library/issues', studentId],
  });

  // Fetch notices - cached globally for instant loading
  const { data: notices = [] } = useQuery<any[]>({
    queryKey: branchId ? [`/api/notices?branchId=${branchId}`] : ['/api/notices'],
  });

  useEffect(() => {
    if (notices && notices.length > 0) {
      // Assuming notices are sorted by date desc (which they are from backend)
      const latest = notices[0];
      const seenNoticeId = localStorage.getItem('lastSeenNoticeId');
      
      // If we haven't seen this notice yet (compare as numbers)
      if (!seenNoticeId || parseInt(seenNoticeId) !== latest.id) {
        setLatestPopupNotice(latest);
        setShowNoticePopup(true);
      }
    }
  }, [notices]);

  // Check if critical data is still loading
  const isLoading = isLoadingAttendance || isLoadingMarks || isLoadingSubjects;

  // Backend already returns only this student's data via parameterized route
  const studentAttendance = attendanceData;

  // Process attendance data for charts - monthly data
  const attendanceBySubject = subjects.map((subject: any) => {
    const subjectAttendance = studentAttendance.filter((a: any) => a.subjectId === subject.id);
    const avgPercentage = subjectAttendance.length > 0 
      ? subjectAttendance.reduce((sum: number, a: any) => sum + a.percentage, 0) / subjectAttendance.length
      : 0;
    return {
      subject: subject.name,
      percentage: Math.round(avgPercentage),
    };
  });

  // Calculate overall attendance percentage
  const attendancePercentage = studentAttendance.length > 0
    ? (studentAttendance.reduce((sum: number, a: any) => sum + a.percentage, 0) / studentAttendance.length).toFixed(1)
    : '0.0';

  // Backend already returns only this student's data via parameterized route
  const studentMarks = marksData;

  // Process marks data for charts - monthly data
  const marksChartData = Array.from(new Set(studentMarks.map((m: any) => m.month))).map((month: any) => {
    const monthMarks = studentMarks.filter((m: any) => m.month === month);
    const avgPercentage = monthMarks.length > 0
      ? monthMarks.reduce((sum: number, m: any) => sum + m.percentage, 0) / monthMarks.length
      : 0;
    return {
      month: month,
      percentage: Math.round(avgPercentage),
    };
  });

  // Calculate average marks
  const avgMarks = studentMarks.length > 0
    ? (studentMarks.reduce((sum: number, m: any) => sum + m.percentage, 0) / studentMarks.length).toFixed(1)
    : '0.0';

  // Get books issued count
  const booksIssued = bookIssues.filter((issue: any) => issue.status === 'issued').length;

  // Prepare attendance table data - monthly records
  const attendanceTableData = studentAttendance.slice(0, 10).map((record: any) => {
    const subject = subjects.find((s: any) => s.id === record.subjectId);
    return {
      subject: subject?.name || 'Unknown',
      month: record.month,
      presentDays: record.presentDays,
      totalDays: record.totalDays,
      percentage: record.percentage,
      status: record.status,
    };
  });

  const attendanceColumns = [
    { key: 'subject', label: 'Subject' },
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

  // Prepare marks table data - monthly records
  const marksTableData = studentMarks.slice(0, 10).map((record: any) => {
    const subject = subjects.find((s: any) => s.id === record.subjectId);
    return {
      subject: subject?.name || 'Unknown',
      month: record.month,
      test: record.testName,
      marks: record.marksObtained,
      total: record.totalMarks,
      percentage: record.percentage,
      grade: record.grade,
    };
  });

  const marksColumns = [
    { key: 'subject', label: 'Subject' },
    { key: 'month', label: 'Month' },
    { key: 'test', label: 'Test' },
    { 
      key: 'marks', 
      label: 'Marks',
      render: (value: number, row: any) => `${value} / ${row.total}`
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

  const handleCloseNoticePopup = () => {
    if (latestPopupNotice) {
      localStorage.setItem('lastSeenNoticeId', latestPopupNotice.id.toString());
    }
    setShowNoticePopup(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Notice Popup */}
      <Dialog open={showNoticePopup} onOpenChange={(open) => !open && handleCloseNoticePopup()}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <DialogTitle>New Notice</DialogTitle>
            </div>
            <DialogDescription>
              {latestPopupNotice ? new Date(latestPopupNotice.createdAt).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          {latestPopupNotice && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{latestPopupNotice.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{latestPopupNotice.message}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <Badge 
                  variant={latestPopupNotice.priority === 'high' ? 'destructive' : latestPopupNotice.priority === 'normal' ? 'default' : 'secondary'}
                >
                  {latestPopupNotice.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleCloseNoticePopup} className="w-full sm:w-auto">
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-10 border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Portal</h1>
            <p className="text-sm text-muted-foreground">
              {studentName} ({rollNo})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowChangePasswordDialog(true)}
              className="hidden sm:flex"
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button variant="ghost" onClick={onLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <ChangePasswordDialog 
        open={showChangePasswordDialog} 
        onOpenChange={setShowChangePasswordDialog} 
      />

      <main className="p-4 sm:p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 -mb-2">
            <TabsList className="w-full justify-start inline-flex min-w-max sm:w-auto">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
              <TabsTrigger value="marks" data-testid="tab-marks">Marks</TabsTrigger>
              <TabsTrigger value="library" data-testid="tab-library">Library</TabsTrigger>
              <TabsTrigger value="notices" data-testid="tab-notices">Notices</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-64 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <>
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
                  <CurrentTimeDisplay />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {attendanceBySubject.length > 0 && (
                    <AttendanceChart data={attendanceBySubject} />
                  )}
                  {marksChartData.length > 0 && (
                    <MarksChart data={marksChartData} />
                  )}
                </div>
              </>
            )}

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
                          {attendanceTableData[0].month} - {attendanceTableData[0].percentage.toFixed(1)}% ({attendanceTableData[0].status})
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
                          {marksTableData[0].month} - {marksTableData[0].test} ({marksTableData[0].grade})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-64 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
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
                          const percentage = item.percentage;
                          const variant = percentage >= 80 ? 'default' : percentage >= 60 ? 'secondary' : 'destructive';
                          return (
                            <div key={index}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">{item.subject}</span>
                                <Badge variant={variant}>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="marks" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-64 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
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
              </>
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

          <TabsContent value="notices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notice Board</CardTitle>
              </CardHeader>
              <CardContent>
                {notices.length > 0 ? (
                  <div className="space-y-4">
                    {notices.map((notice: any) => (
                      <div key={notice.id} className="p-4 border rounded-lg" data-testid={`notice-${notice.id}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Bell className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-base" data-testid={`notice-title-${notice.id}`}>{notice.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3" data-testid={`notice-message-${notice.id}`}>{notice.message}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                              <Badge 
                                variant={notice.priority === 'high' ? 'destructive' : notice.priority === 'normal' ? 'default' : 'secondary'}
                                data-testid={`notice-priority-${notice.id}`}
                              >
                                {notice.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="status-no-notices">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p data-testid="text-no-notices">No notices available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
