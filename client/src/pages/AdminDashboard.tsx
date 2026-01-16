import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatCard from "@/components/common/StatCard";
import AttendanceManagement from "@/components/modules/AttendanceManagement";
import MarksManagement from "@/components/modules/MarksManagement";
import AttendanceOverviewChart from "@/components/charts/AttendanceOverviewChart";
import MarksDistributionChart from "@/components/charts/MarksDistributionChart";
import AttendancePieChart from "@/components/charts/AttendancePieChart";
import GradesPieChart from "@/components/charts/GradesPieChart";
import SubjectPerformanceChart from "@/components/charts/SubjectPerformanceChart";
import LibraryStatisticsChart from "@/components/charts/LibraryStatisticsChart";
import DataTable from "@/components/common/DataTable";
import LibraryBookCard from "@/components/common/LibraryBookCard";
import AddStudentDialog from "@/components/dialogs/AddStudentDialog";
import AddSubjectDialog from "@/components/dialogs/AddSubjectDialog";
import AddBatchDialog from "@/components/dialogs/AddBatchDialog";
import AddBranchDialog from "@/components/dialogs/AddBranchDialog";
import AddBookDialog from "@/components/dialogs/AddBookDialog";
import EditStudentDialog from "@/components/dialogs/EditStudentDialog";
import EditSubjectDialog from "@/components/dialogs/EditSubjectDialog";
import EditBookDialog from "@/components/dialogs/EditBookDialog";
import AddNoticeDialog from "@/components/dialogs/AddNoticeDialog";
import EditNoticeDialog from "@/components/dialogs/EditNoticeDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import AdminManagement from "@/components/modules/AdminManagement";
import { Users, TrendingUp, BookOpen, Award, Plus, Pencil, Trash2, Infinity as InfinityIcon, CalendarRange, School, ChevronRight, Layers, ArrowLeft, Code, Zap, Wrench, Building2, Radio, GraduationCap, Microscope, Hammer, Plug, Cpu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { sortStudentsByRollNo } from "@/lib/utils";

interface AdminDashboardProps {
  adminName: string;
  adminRole?: 'admin' | 'super_admin' | null;
  onLogout?: () => void;
}

export default function AdminDashboard({ adminName, adminRole, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit] = useState(50);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [showEditBookDialog, setShowEditBookDialog] = useState(false);
  const [showAddNoticeDialog, setShowAddNoticeDialog] = useState(false);
  const [showEditNoticeDialog, setShowEditNoticeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showIssueBookDialog, setShowIssueBookDialog] = useState(false);
  const [showReturnBookDialog, setShowReturnBookDialog] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [bookToIssue, setBookToIssue] = useState<any>(null);
  const [issueToReturn, setIssueToReturn] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'student' | 'subject' | 'book' | 'notice' | 'batch' | 'branch' | null>(null);
  const { toast } = useToast();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Helpers to map display name to code used in DB
  const deptCode = (name: string | null) => {
    switch (name) {
      case "Computer Science": return "CSE";
      case "Electronics": return "ECE";
      case "Mechanical": return "ME";
      case "Civil":
      case "Civil Engineering": return "CE";
      case "Electrical": return "EE";
      default: return undefined;
    }
  };

  const getBranchIcon = (name: string) => {
    if (!name) return GraduationCap;
    const lowerName = name.toLowerCase();
    
    // Prioritize specific engineering branches
    
    // Civil Engineering
    if (lowerName.includes("civil") || lowerName.includes("const") || lowerName.includes("struct")) return Hammer;

    // Mechanical & Automobile
    if (lowerName.includes("mech") || lowerName.includes("auto") || lowerName.includes("prod")) return Settings;

    // Electronics & Communication (Must be before Electrical to avoid conflict)
    if (lowerName.includes("electronics") || lowerName.includes("ece") || lowerName.includes("comm") || lowerName.includes("tele")) return Cpu;
    
    // Computer Science & IT
    if (lowerName.includes("computer") || lowerName.includes("cse") || lowerName.includes("soft") || lowerName.includes("it") || lowerName.includes("data") || lowerName.includes("ai") || lowerName.includes("artificial")) return Code;
    
    // Electrical (Strict check)
    if (lowerName.includes("electrical") || lowerName.includes("power") || lowerName.includes(" eee ")) return Plug;
    
    // Science & Humanities
    if (lowerName.includes("science") || lowerName.includes("phy") || lowerName.includes("chem") || lowerName.includes("math")) return Microscope;
    
    return GraduationCap;
  };

  // Fetch batches
  const { data: batches = [], isLoading: batchesLoading, error: batchesErrorObj } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });
  const batchesError = batchesErrorObj ? (batchesErrorObj as Error).message : null;

  // Fetch branches first
  const { data: branches = [], isLoading: branchesLoading, error: branchesErrorObj } = useQuery<any[]>({
    queryKey: [`/api/branches?batchId=${selectedBatchId ?? ''}`],
    enabled: !!selectedBatchId,
  });
  const branchesError = branchesErrorObj ? (branchesErrorObj as Error).message : null;

  const selectedBranchId = branches.find(b => b.name === selectedDepartment)?.id;

  // Fetch global analytics
  // Only fetch if we are in the right section AND if we have resolved the branch ID (if a department is selected)
  const { data: globalStats } = useQuery<any>({
    queryKey: [`/api/analytics/global${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`],
    enabled: (activeSection === 'dashboard' || activeSection === 'reports') && (!selectedDepartment || selectedBranchId !== undefined),
  });

  // Fetch students (paginated)
  const { data: studentsResponse, refetch: refetchStudents } = useQuery<any>({
    queryKey: [`/api/students?page=${studentPage}&limit=${studentLimit}${selectedDepartment && deptCode(selectedDepartment) ? `&department=${deptCode(selectedDepartment)}` : ""}${selectedBranchId ? `&branchId=${selectedBranchId}` : ""}`],
    enabled: activeSection === 'dashboard' || activeSection === 'students' || activeSection === 'reports' || activeSection === 'branch_home',
  });

  const students = studentsResponse?.data || [];
  const studentTotal = studentsResponse?.pagination?.total || 0;
  const studentTotalPages = studentsResponse?.pagination?.totalPages || 1;

  // Fetch subjects
  const { data: subjects = [], refetch: refetchSubjects } = useQuery<any[]>({
    queryKey: [`/api/subjects?${selectedDepartment && deptCode(selectedDepartment) ? `department=${deptCode(selectedDepartment)}&` : ""}${selectedBranchId ? `branchId=${selectedBranchId}` : ""}`],
    enabled: activeSection === 'dashboard' || activeSection === 'subjects' || activeSection === 'reports' || activeSection === 'branch_home',
  });

  // Fetch library books
  const { data: books = [], refetch: refetchBooks } = useQuery<any[]>({
    queryKey: [`/api/library/books${selectedBranchId ? `?branchId=${selectedBranchId}` : ""}`],
    enabled: activeSection === 'library' || activeSection === 'reports' || activeSection === 'dashboard' || activeSection === 'branch_home',
  });

  // Fetch attendance records (paginated for reports, lightweight for dashboard)
  const { data: attendanceResponse } = useQuery<any>({
    queryKey: [`/api/attendance?limit=1000${selectedBranchId ? `&branchId=${selectedBranchId}` : ""}`], // Limit for charts
    enabled: activeSection === 'dashboard' || activeSection === 'reports' || activeSection === 'branch_home',
  });
  const attendanceRaw = attendanceResponse?.data;
  const attendance = Array.isArray(attendanceRaw) ? attendanceRaw : [];

  // Fetch marks records (paginated for reports, lightweight for dashboard)
  const { data: marksResponse } = useQuery<any>({
    queryKey: [`/api/marks?limit=1000${selectedBranchId ? `&branchId=${selectedBranchId}` : ""}`], // Limit for charts
    enabled: activeSection === 'dashboard' || activeSection === 'reports' || activeSection === 'branch_home',
  });
  const marksRaw = marksResponse?.data;
  const marks = Array.isArray(marksRaw) ? marksRaw : [];

  // Fetch notices
  const { data: notices = [], refetch: refetchNotices } = useQuery<any[]>({
    queryKey: [`/api/notices${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`],
    enabled: activeSection === 'notices' || activeSection === 'branch_home',
  });

  // Fetch book issues
  const { data: bookIssues = [], refetch: refetchBookIssues } = useQuery<any[]>({
    queryKey: ['/api/library/issues'],
    enabled: activeSection === 'library' || activeSection === 'reports' || activeSection === 'dashboard' || activeSection === 'branch_home',
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const endpoints: Record<string, string> = {
        student: '/api/students',
        subject: '/api/subjects',
        book: '/api/library/books',
        notice: '/api/notices',
        batch: '/api/batches',
        branch: '/api/branches',
      };
      return await apiRequest('DELETE', `${endpoints[type]}/${id}`);
    },
    onSuccess: (_, { type }) => {
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
      });
      if (type === 'student') {
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/students')) });
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/marks')) });
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/attendance')) });
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/library/issues')) });
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/analytics/global')) });
      }
      if (type === 'subject') {
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/subjects')) });
      }
      if (type === 'book') {
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/library/books')) });
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/analytics/global')) });
      }
      if (type === 'notice') {
         queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/notices')) });
      }
      if (type === 'batch') queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      if (type === 'branch' && selectedBatchId) {
        queryClient.invalidateQueries({ queryKey: [`/api/branches?batchId=${selectedBatchId}`] });
        queryClient.refetchQueries({ queryKey: [`/api/branches?batchId=${selectedBatchId}`] });
      }
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

  const handleEdit = (type: 'student' | 'subject' | 'book' | 'notice', item: any) => {
    setItemToEdit(item);
    if (type === 'student') setShowEditStudentDialog(true);
    if (type === 'subject') setShowEditSubjectDialog(true);
    if (type === 'book') setShowEditBookDialog(true);
    if (type === 'notice') setShowEditNoticeDialog(true);
  };

  const handleDelete = (type: 'student' | 'subject' | 'book' | 'notice' | 'batch' | 'branch', item: any) => {
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
    {
      key: 'avgMarks',
      label: 'Grade',
      render: (value: string) => {
        const marks = parseFloat(value);
        let grade = 'F';
        if (marks >= 90) grade = 'A+';
        else if (marks >= 85) grade = 'A';
        else if (marks >= 80) grade = 'B+';
        else if (marks >= 75) grade = 'B';
        else if (marks >= 60) grade = 'C';
        else if (marks >= 50) grade = 'D';
        
        return (
          <Badge variant={grade === 'F' ? 'destructive' : 'secondary'}>
            {grade}
          </Badge>
        );
      }
    },
  ];

  const subjectsColumns = [
    { key: 'code', label: 'Subject Code' },
    { key: 'name', label: 'Subject Name' },
    { key: 'instructor', label: 'Instructor' },
  ];

  const noticesColumns = [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message' },
    { 
      key: 'branchName', 
      label: 'Target',
      render: (value: string | null) => (
        <Badge variant="outline" className={!value ? "bg-primary/10" : ""}>
          {value || "Global (All Branches)"}
        </Badge>
      )
    },
    { 
      key: 'priority', 
      label: 'Priority',
      render: (value: string) => (
        <Badge variant={value === 'high' ? 'destructive' : value === 'normal' ? 'default' : 'secondary'}>
          {value.toUpperCase()}
        </Badge>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];



  const loadBatches = async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
  };

  useEffect(() => {
    // Batches are now loaded via useQuery
  }, []);
  const updateBatchMutation = useMutation({
    mutationFn: async (batch: any) => {
      const payload = {
        name: batch.name.trim(),
        startYear: parseInt(batch.startYear, 10),
        endYear: parseInt(batch.endYear, 10),
      };
      await apiRequest("PUT", `/api/batches/${batch.id}`, payload);
    },
    onSuccess: async () => {
      toast({ title: "Batch updated", description: "Batch details saved" });
      setEditingBatch(null);
      await queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update batch", variant: "destructive" });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async (branch: any) => {
      await apiRequest("PUT", `/api/branches/${branch.id}`, { name: branch.name });
    },
    onSuccess: async () => {
      toast({ title: "Branch updated", description: "Branch name saved" });
      setEditingBranch(null);
      if (selectedBatchId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/branches?batchId=${selectedBatchId}`] });
        await queryClient.refetchQueries({ queryKey: [`/api/branches?batchId=${selectedBatchId}`] });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update branch", variant: "destructive" });
    },
  });

  // Calculate dashboard stats
  const totalStudents = globalStats?.totalStudents || studentTotal || 0;
  const avgAttendance = globalStats?.avgAttendance?.toFixed(1) || '0.0';
  const avgMarks = globalStats?.avgMarks?.toFixed(1) || '0.0';
  const totalBooksIssued = globalStats?.totalBooksIssued || 0;

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-8 fade-in">
            {/* Batches Section */}
            {!selectedBatch ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">Academic Batches</h2>
                    <p className="text-muted-foreground mt-1">Select a batch to manage branches and students</p>
                  </div>
                  <Button onClick={() => setShowAddBatch(true)} size="lg" className="shadow-lg shadow-primary/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Batch
                  </Button>
                  <AddBatchDialog open={showAddBatch} onOpenChange={setShowAddBatch} onCreated={loadBatches} />
                </div>

                {batchesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                      <p className="text-muted-foreground animate-pulse">Loading batches...</p>
                    </div>
                  </div>
                ) : batchesError ? (
                  <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-center">
                    <p>{batchesError}</p>
                  </div>
                ) : batches.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <CalendarRange className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">No batches found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                          Get started by creating your first academic batch to organize students and curriculum.
                        </p>
                      </div>
                      <Button onClick={() => setShowAddBatch(true)} variant="outline">
                        Create Batch
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                    {batches.map((batch: any) => (
                      <Card 
                        key={batch.id} 
                        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                          editingBatch?.id === batch.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                        }`}
                      >
                        <CardContent className="p-0">
                          {editingBatch?.id === batch.id ? (
                            <div className="p-6 space-y-4">
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Batch Name</label>
                                <Input
                                  placeholder="e.g. 2023-2027"
                                  value={editingBatch.name}
                                  onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-muted-foreground">Start Year</label>
                                  <Input
                                    placeholder="YYYY"
                                    value={editingBatch.startYear}
                                    onChange={(e) => setEditingBatch({ ...editingBatch, startYear: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-muted-foreground">End Year</label>
                                  <Input
                                    placeholder="YYYY"
                                    value={editingBatch.endYear}
                                    onChange={(e) => setEditingBatch({ ...editingBatch, endYear: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" className="flex-1" onClick={() => updateBatchMutation.mutate(editingBatch)} disabled={updateBatchMutation.isPending}>
                                  {updateBatchMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingBatch(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center p-5">
                              <div 
                                className="flex-1 cursor-pointer flex items-center gap-6" 
                                onClick={() => { setSelectedBatch(batch.name); setSelectedBatchId(batch.id); }}
                              >
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                  <CalendarRange className="h-7 w-7" />
                                </div>
                                
                                <div>
                                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{batch.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                    {batch.startYear} — {batch.endYear}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 border-l pl-4 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-muted" title="Edit" onClick={(e) => { e.stopPropagation(); setEditingBatch(batch); }}>
                                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 hover:bg-destructive/10"
                                  title="Delete"
                                  onClick={(e) => { e.stopPropagation(); handleDelete('batch', batch); }}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                                <div className="text-xs text-muted-foreground font-medium flex items-center ml-2 cursor-pointer" onClick={() => { setSelectedBatch(batch.name); setSelectedBatchId(batch.id); }}>
                                  View <ChevronRight className="h-3 w-3 ml-1" />
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedBatch(null); setSelectedBatchId(null); setSelectedDepartment(null); }}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Batches
                      </Button>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">{selectedBatch}</h2>
                    <p className="text-muted-foreground mt-1">Manage departments and branches for this batch</p>
                  </div>
                  <Button onClick={() => setShowAddBranch(true)} className="shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                  <AddBranchDialog 
                    open={showAddBranch} 
                    onOpenChange={setShowAddBranch} 
                    batchId={selectedBatchId} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {branchesError && (
                      <div className="col-span-full p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-center">
                        <p>Error loading branches: {branchesError}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/branches?batchId=${selectedBatchId}`] })}>
                          Retry
                        </Button>
                      </div>
                    )}

                    {editingBranch ? (
                      <Card className="border-primary ring-1 ring-primary shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        <CardContent className="p-6 space-y-4">
                          <h3 className="font-semibold text-primary">Edit Branch</h3>
                          <Input
                            placeholder="Branch name"
                            value={editingBranch.name}
                            onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => updateBranchMutation.mutate(editingBranch)} disabled={updateBranchMutation.isPending}>
                              Save
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => setEditingBranch(null)}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                    
                    {branches.map((branch: any) => {
                      const BranchIcon = getBranchIcon(branch.name);
                      return (
                        <Card 
                          key={branch.id}
                          className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary hover:-translate-y-1"
                        >
                          <CardContent className="p-0">
                            <div className="flex flex-col p-5 gap-4">
                              <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 group-hover:from-primary/20 group-hover:to-purple-500/20 flex items-center justify-center text-primary transition-all duration-300 shadow-sm group-hover:shadow-inner group-hover:scale-110">
                                  <BranchIcon className="h-6 w-6" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-muted" title="Edit" onClick={() => setEditingBranch(branch)}>
                                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10" title="Delete" onClick={() => handleDelete('branch', branch)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div 
                                className="cursor-pointer space-y-2"
                                onClick={() => { setSelectedDepartment(branch.name); setActiveSection("branch_home"); }}
                              >
                                <h4 className="text-lg font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                                  {branch.name}
                                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  Manage students, attendance, and marks for {branch.name}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {branches.length === 0 && !editingBranch && (
                      <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-muted/30">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                           <Layers className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium">No branches yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Add your first branch to start managing the curriculum and student records for this batch.</p>
                        <Button onClick={() => setShowAddBranch(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Branch
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        );

      case "branch_home":
        // Calculate branch stats
        const branchStudentCount = studentTotal;
        
        // Avg Attendance
        const branchTotalPresentDays = attendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
        const branchTotalDaysCount = attendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
        const branchAvgAttendance = branchTotalDaysCount > 0 ? ((branchTotalPresentDays / branchTotalDaysCount) * 100).toFixed(1) : '0.0';

        // Avg Marks
        const branchTotalMarksObtained = marks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
        const branchTotalMarksTotal = marks.reduce((sum: number, m: any) => sum + (m.totalMarks || 0), 0);
        const branchAvgMarks = branchTotalMarksTotal > 0 ? ((branchTotalMarksObtained / branchTotalMarksTotal) * 100).toFixed(1) : '0.0';

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold gradient-text">Branch Dashboard</h2>
                <p className="text-sm text-muted-foreground">{selectedBatch} • {selectedDepartment}</p>
              </div>
              <Button variant="outline" onClick={() => { setSelectedDepartment(null); setActiveSection("dashboard"); }}>
                Change Batch/Branch
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Students" value={branchStudentCount.toString()} icon={Users} />
              <StatCard title="Avg Attendance" value={`${branchAvgAttendance}%`} icon={TrendingUp} />
              <StatCard title="Avg Marks" value={`${branchAvgMarks}%`} icon={Award} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceOverviewChart data={attendance} />
              <MarksDistributionChart data={marks} />
            </div>

            {/* Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendancePieChart data={attendance} />
              <GradesPieChart data={marks} />
            </div>
          </div>
        );

      case "admins":
        return <AdminManagement />;

      case "students":
        return (
          <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center flex-shrink-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Student Management</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage all student records</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                 <Badge variant="outline" className="h-9 px-4 flex items-center gap-2 mr-2">
                    <InfinityIcon className="h-4 w-4" />
                    <span>Infinity Mode</span>
                 </Badge>
                <Button 
                  onClick={() => setShowAddStudentDialog(true)}
                  data-testid="button-add-student"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DataTable
                title="All Students"
                description={`Showing all ${students.length} students`}
                columns={studentsColumns}
                data={sortStudentsByRollNo(students)}
                actions={true}
                onEdit={(row) => handleEdit('student', row)}
                onDelete={(row) => handleDelete('student', row)}
                enableVirtualization={true}
              />
            </div>
          </div>
        );

      case "subjects":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Subject Management</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage all subjects and courses</p>
              </div>
              <Button 
                onClick={() => setShowAddSubjectDialog(true)}
                data-testid="button-add-subject"
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
            <DataTable
              title="All Subjects"
              description="Complete list of subjects"
              columns={subjectsColumns}
              data={[...subjects].sort((a: any, b: any) => a.id - b.id)}
              actions={true}
              onEdit={(row) => handleEdit('subject', row)}
              onDelete={(row) => handleDelete('subject', row)}
            />
          </div>
        );

      case "attendance":
        return <AttendanceManagement department={deptCode(selectedDepartment || null)} branchId={selectedBranchId} />;

      case "marks":
        return <MarksManagement department={deptCode(selectedDepartment || null)} branchId={selectedBranchId} />;

      case "library":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Library Management</h2>
                <p className="text-muted-foreground">Manage books</p>
              </div>
              <Button 
                onClick={() => setShowAddBookDialog(true)}
                data-testid="button-add-book"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </div>

            {/* Available Books Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Books</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...books].sort((a: any, b: any) => a.id - b.id).map((book: any) => (
                  <div key={book.id} className="relative">
                    <LibraryBookCard
                      title={book.title}
                      author={book.author}
                      copiesAvailable={book.copiesAvailable}
                      totalCopies={book.totalCopies}
                      branchName={!selectedBranchId && book.branchId ? branches.find(b => b.id === book.branchId)?.name : undefined}
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
          </div>
        );

      case "notices":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Notice Management</h2>
                <p className="text-muted-foreground">Send and manage notices for students</p>
              </div>
              <Button 
                onClick={() => setShowAddNoticeDialog(true)}
                data-testid="button-add-notice"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Notice
              </Button>
            </div>
            <DataTable
              title="All Notices"
              description="Student notices and announcements"
              columns={noticesColumns}
              data={notices}
              actions={true}
              onEdit={(row) => handleEdit('notice', row)}
              onDelete={(row) => handleDelete('notice', row)}
            />
          </div>
        );

      case "reports":
        // Calculate analytics
        // Prefer studentTotal (filtered count from students API) over globalStats if available and matching context
        const reportsStudentCount = selectedBranchId ? studentTotal : (globalStats?.totalStudents || students.length);
        const reportsSubjectCount = subjects.length;
        const reportsBooksCount = books.length;
        // const reportsAttendanceRecords = attendance.length;
        // const reportsMarksRecords = marks.length;
        
        // Calculate overall attendance percentage
        // const totalPresentDays = attendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
        // const totalDaysCount = attendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
        const overallAttendance = globalStats?.avgAttendance?.toFixed(1) || '0.0';
        
        // Calculate average marks percentage
        // const totalMarksObtained = marks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
        // const totalMarksTotal = marks.reduce((sum: number, m: any) => sum + (m.totalMarks || 0), 0);
        const reportsAvgMarks = globalStats?.avgMarks?.toFixed(1) || '0.0';
        
        // Subject-wise performance
        const subjectPerformance = subjects.map((subject: any) => {
          const subjectMarks = marks.filter((m: any) => m.subjectId === subject.id);
          const subjectAttendance = attendance.filter((a: any) => a.subjectId === subject.id);
          
          const subjectMarksObtained = subjectMarks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
          const subjectMarksTotal = subjectMarks.reduce((sum: number, m: any) => sum + (m.totalMarks || 0), 0);
          const avgSubjectMarks = subjectMarksTotal > 0
            ? ((subjectMarksObtained / subjectMarksTotal) * 100).toFixed(1)
            : '0.0';
          
          const subjectPresentDays = subjectAttendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
          const subjectTotalDays = subjectAttendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
          const subjectAttendancePerc = subjectTotalDays > 0
            ? ((subjectPresentDays / subjectTotalDays) * 100).toFixed(1)
            : '0.0';
          
          return {
            name: subject.name,
            code: subject.code,
            avgMarks: avgSubjectMarks,
            attendance: subjectAttendancePerc,
          };
        });
        
        // Student performance ranking
        const studentPerformance = students.map((student: any) => {
          const studentMarks = marks.filter((m: any) => m.studentId === student.id);
          const studentAttendance = attendance.filter((a: any) => a.studentId === student.id);
          
          const studentMarksObtained = studentMarks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
          const studentMarksTotal = studentMarks.reduce((sum: number, m: any) => sum + (m.totalMarks || 0), 0);
          const avgStudentMarks = studentMarksTotal > 0
            ? (studentMarksObtained / studentMarksTotal) * 100
            : 0;
          
          const studentPresentDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
          const studentTotalDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
          const studentAttendancePerc = studentTotalDays > 0
            ? (studentPresentDays / studentTotalDays) * 100
            : 0;
          
          return {
            rollNo: student.rollNo,
            name: student.name,
            avgMarks: avgStudentMarks,
            attendance: studentAttendancePerc,
          };
        }).sort((a: { avgMarks: number }, b: { avgMarks: number }) => b.avgMarks - a.avgMarks);
        
        const topPerformers = studentPerformance.slice(0, 5);
        
        // Filter for students who genuinely need attention (failing marks or poor attendance)
        const needAttentionList = studentPerformance
          .filter((s: any) => s.avgMarks < 40 || s.attendance < 60)
          .sort((a: any, b: any) => a.avgMarks - b.avgMarks) // Sort by lowest marks first
          .slice(0, 5);
        
        // Attendance distribution
        const goodAttendance = students.filter((student: any) => {
          const studentAttendance = attendance.filter((a: any) => a.studentId === student.id);
          const presentDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
          const totalDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
          const perc = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
          return perc >= 80;
        }).length;
        
        const averageAttendance = students.filter((student: any) => {
          const studentAttendance = attendance.filter((a: any) => a.studentId === student.id);
          const presentDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
          const totalDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
          const perc = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
          return perc >= 60 && perc < 80;
        }).length;
        
        const poorAttendance = students.filter((student: any) => {
          const studentAttendance = attendance.filter((a: any) => a.studentId === student.id);
          const presentDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.presentDays || 0), 0);
          const totalDays = studentAttendance.reduce((sum: number, a: any) => sum + (a.totalDays || 0), 0);
          const perc = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
          return perc < 60;
        }).length;
        
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
            </div>
            
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Students" value={reportsStudentCount.toString()} icon={Users} />
              <StatCard title="Overall Attendance" value={`${overallAttendance}%`} icon={TrendingUp} />
              <StatCard title="Average Marks" value={`${reportsAvgMarks}%`} icon={Award} />
              <StatCard title="Total Books" value={reportsBooksCount.toString()} icon={BookOpen} />
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceOverviewChart data={attendance} />
              <MarksDistributionChart data={marks} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendancePieChart data={attendance} />
              <GradesPieChart data={marks} />
            </div>
            
            {/* Subject Performance */}
            {subjectPerformance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Performance</CardTitle>
                  <CardDescription>Average marks and attendance by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subjectPerformance.map((subject: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{subject.name} ({subject.code})</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Avg Marks</p>
                            <p className="font-semibold">{subject.avgMarks}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Attendance</p>
                            <Badge variant={
                              parseFloat(subject.attendance) >= 80 ? 'default' : 
                              parseFloat(subject.attendance) >= 60 ? 'secondary' : 
                              'destructive'
                            }>
                              {subject.attendance}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Attendance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Student distribution by attendance percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="default">≥ 80%</Badge>
                      <span className="text-sm">Good Attendance</span>
                    </div>
                    <span className="font-semibold">{goodAttendance} students</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">60-79%</Badge>
                      <span className="text-sm">Average Attendance</span>
                    </div>
                    <span className="font-semibold">{averageAttendance} students</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">&lt; 60%</Badge>
                      <span className="text-sm">Poor Attendance</span>
                    </div>
                    <span className="font-semibold">{poorAttendance} students</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top & Bottom Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topPerformers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Students with highest average marks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topPerformers.map((student: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{student.avgMarks.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">{student.attendance.toFixed(1)}% attendance</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {needAttentionList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Need Attention</CardTitle>
                    <CardDescription>Students requiring academic support (Marks &lt; 40% or Attendance &lt; 60%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {needAttentionList.map((student: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{student.avgMarks.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">{student.attendance.toFixed(1)}% attendance</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
        adminRole={adminRole}
        hasBranchContext={!!selectedBatch && !!selectedDepartment && activeSection !== 'dashboard'}
      />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 glass-effect z-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {adminName}
                  {selectedBatch && <> • {selectedBatch}</>}
                  {selectedDepartment && <> • {selectedDepartment}</>}
                </p>
              </div>
            </div>
            {(selectedDepartment || selectedBatch) && (
              <Button variant="outline" onClick={() => { setSelectedDepartment(null); setSelectedBatch(null); setActiveSection("dashboard"); }}>
                Clear Department
              </Button>
            )}
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </main>
        </div>
      </div>

      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/students')) });
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/analytics/global')) });
        }}
        batchId={selectedBatchId}
        branchId={selectedBranchId}
      />

      <AddSubjectDialog
        open={showAddSubjectDialog}
        onOpenChange={setShowAddSubjectDialog}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/subjects')) });
        }}
        branchId={selectedBranchId}
      />

      <AddBookDialog
        open={showAddBookDialog}
        onOpenChange={setShowAddBookDialog}
        branchId={selectedBranchId}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/library/books')) });
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/analytics/global')) });
        }}
      />

      <EditStudentDialog
        open={showEditStudentDialog}
        onOpenChange={setShowEditStudentDialog}
        student={itemToEdit}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/students')) });
           queryClient.resetQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/marks')) });
           queryClient.resetQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/attendance')) });
           queryClient.resetQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/library/issues')) });
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/analytics/global')) });
        }}
      />

      <EditSubjectDialog
        open={showEditSubjectDialog}
        onOpenChange={setShowEditSubjectDialog}
        subject={itemToEdit}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/subjects')) });
        }}
      />

      <EditBookDialog
        open={showEditBookDialog}
        onOpenChange={setShowEditBookDialog}
        book={itemToEdit}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/library/books')) });
        }}
      />

      <AddNoticeDialog
        open={showAddNoticeDialog}
        onOpenChange={setShowAddNoticeDialog}
        branchId={selectedBranchId}
        branchName={selectedDepartment}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/notices')) });
        }}
      />

      <EditNoticeDialog
        open={showEditNoticeDialog}
        onOpenChange={setShowEditNoticeDialog}
        notice={itemToEdit}
        onSuccess={() => {
           queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/notices')) });
        }}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType}?`}
        description={
          deleteType === 'batch' 
            ? "Are you sure you want to delete this Batch? This will permanently delete ALL branches, students, and subjects in this batch. This action cannot be undone."
            : deleteType === 'branch'
            ? "Are you sure you want to delete this Branch? This will permanently delete ALL students and subjects in this branch. This action cannot be undone."
            : `Are you sure you want to delete this ${deleteType}? This action cannot be undone.`
        }
        isLoading={deleteMutation.isPending}
      />
    </SidebarProvider>
  );
}
