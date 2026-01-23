import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Save, Plus, Trash2, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function MarksManagement({ department, branchId, batchId }: { department?: string, branchId?: number, batchId?: number }) {
  const { toast } = useToast();
  
  // State
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [marksMap, setMarksMap] = useState<Record<number, number>>({}); // studentId -> marks
  const [isModified, setIsModified] = useState(false);
  
  // Create Exam State
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamTotal, setNewExamTotal] = useState("100");
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch Subjects
  const { data: subjects = [] } = useQuery<any[]>({ 
    queryKey: [`/api/subjects${branchId ? `?branchId=${branchId}` : department ? `?department=${department}` : "?"}${batchId ? `&batchId=${batchId}` : ""}`] 
  });

  // Fetch Exams for Subject
  const { data: exams = [], refetch: refetchExams } = useQuery<any[]>({
    queryKey: [`/api/exams/subject/${selectedSubject}`],
    enabled: !!selectedSubject,
  });

  // Fetch Students
  const { data: studentsResponse, isLoading: isLoadingStudents } = useQuery<any>({ 
    queryKey: [`/api/students?limit=1000${branchId ? `&branchId=${branchId}` : department ? `&department=${department}` : ""}${batchId ? `&batchId=${batchId}` : ""}`],
    staleTime: 0,
    refetchOnWindowFocus: true
  });
  const students = studentsResponse?.data || [];

  // Fetch Marks for Exam
  const { data: existingMarks = [], isLoading: isLoadingMarks, refetch: refetchMarks } = useQuery<any[]>({
    queryKey: [`/api/exams/${selectedExam}/marks`],
    enabled: !!selectedExam,
  });

  // Sync marks
  useEffect(() => {
    if (existingMarks && students.length > 0) {
      const newMap: Record<number, number> = {};
      students.forEach((student: any) => {
        const record = existingMarks.find((r: any) => r.studentId === student.id);
        if (record) {
          newMap[student.id] = record.marksObtained;
        }
      });
      setMarksMap(newMap);
      setIsModified(false);
    } else {
        setMarksMap({});
    }
  }, [existingMarks, students, selectedExam]);

  // Create Exam Mutation
  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/exams", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Exam created successfully" });
      setShowCreateExam(false);
      setNewExamName("");
      refetchExams();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete Exam Mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exams/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Exam deleted successfully" });
      setSelectedExam("");
      refetchExams();
    },
  });

  // Save Marks Mutation
  const saveMarksMutation = useMutation({
    mutationFn: async (records: any[]) => {
      await apiRequest("POST", "/api/exams/marks", { records });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Marks saved successfully" });
      setIsModified(false);
      refetchMarks();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateExam = () => {
    if (!newExamName || !newExamTotal || !selectedSubject) {
        toast({ title: "Error", description: "All fields are required", variant: "destructive" });
        return;
    }
    
    // Ensure totalMarks is a valid number
    const totalMarks = parseFloat(newExamTotal);
    if (isNaN(totalMarks) || totalMarks <= 0) {
        toast({ title: "Error", description: "Total marks must be a valid positive number", variant: "destructive" });
        return;
    }

    createExamMutation.mutate({
      name: newExamName,
      subjectId: parseInt(selectedSubject),
      totalMarks: totalMarks,
      date: newExamDate // string format YYYY-MM-DD
    });
  };

  const handleSaveMarks = () => {
    if (!selectedExam) return;
    const records = Object.entries(marksMap).map(([studentId, marks]) => ({
      examId: parseInt(selectedExam),
      studentId: parseInt(studentId),
      marksObtained: marks
    }));
    saveMarksMutation.mutate(records);
  };

  const handleMarkChange = (studentId: number, value: string) => {
    // Allow empty string to clear the input
    if (value === "") {
        const newMap = { ...marksMap };
        delete newMap[studentId];
        setMarksMap(newMap);
        setIsModified(true);
        return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    // Validate against total marks
    const currentExam = exams.find((e: any) => e.id.toString() === selectedExam);
    
    if (numValue < 0) return; // Prevent negative marks

    if (currentExam && numValue > currentExam.totalMarks) {
        // Allow typing but warn visually (already implemented)
        // Or strictly clamp? Strict clamping is safer for data integrity
        // setMarksMap(prev => ({ ...prev, [studentId]: currentExam.totalMarks }));
        // Let's stick to warning for now as user might be typing "100" and at "10" it's fine
    }

    setMarksMap(prev => ({
      ...prev,
      [studentId]: numValue
    }));
    setIsModified(true);
  };

  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentExam = exams.find((e: any) => e.id.toString() === selectedExam);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Marks Management</h2>
          <p className="text-sm text-muted-foreground">Manage exams and enter student marks</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
          {/* Subject Selector */}
          <Select value={selectedSubject} onValueChange={(val) => { setSelectedSubject(val); setSelectedExam(""); }}>
            <SelectTrigger className="w-62.5">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((sub: any) => (
                <SelectItem key={sub.id} value={sub.id.toString()}>
                  {sub.name} ({sub.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Exam Selector */}
          <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedSubject}>
            <SelectTrigger className="w-62.5">
              <SelectValue placeholder={selectedSubject ? "Select Exam" : "Select Subject First"} />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam: any) => (
                <SelectItem key={exam.id} value={exam.id.toString()}>
                  {exam.name} (Max: {exam.totalMarks})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Create Exam Button */}
          <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={!selectedSubject}>
                    <Plus className="h-4 w-4 mr-2" /> New Exam
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Exam</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Exam Name</Label>
                        <Input placeholder="e.g. Unit Test 1" value={newExamName} onChange={e => setNewExamName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Total Marks</Label>
                        <Input type="number" value={newExamTotal} onChange={e => setNewExamTotal(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateExam} disabled={createExamMutation.isPending}>Create</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col min-h-0 border-t-4 border-t-primary/20">
        <CardHeader className="pb-3 border-b">
           <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
               <CardTitle className="text-lg">
                 {currentExam ? `${currentExam.name} (${currentExam.totalMarks} Marks)` : "Select an Exam"}
               </CardTitle>
               {currentExam && (
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                    onClick={() => {
                        if(confirm("Are you sure you want to delete this exam and all its marks?")) {
                            deleteExamMutation.mutate(currentExam.id);
                        }
                    }}
                   >
                       <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
                   </Button>
               )}
             </div>
             
             <div className="flex items-center gap-3">
               <div className="relative w-64">
                 <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search students..." 
                   className="pl-8 h-9" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               
               <Button 
                onClick={handleSaveMarks} 
                disabled={!selectedExam || saveMarksMutation.isPending || !isModified}
                className={cn("gap-2 transition-all duration-300", isModified && "shadow-lg scale-105")}
              >
                {saveMarksMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Marks
              </Button>
             </div>
           </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-0">
          {!selectedExam ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-20" />
              <p>Please select an exam to enter marks</p>
            </div>
          ) : isLoadingStudents || isLoadingMarks ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No students found</p>
              <p className="max-w-xs mt-2 text-sm">
                If you expected students here, check if you selected the correct <strong>Batch</strong> in the dashboard.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/90 backdrop-blur sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium sticky left-0 z-30 bg-muted/90 backdrop-blur border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Roll No</th>
                  <th className="px-6 py-3 font-medium">Student Name</th>
                  <th className="px-6 py-3 font-medium w-48">Marks Obtained</th>
                  <th className="px-6 py-3 font-medium text-center">Percentage</th>
                  <th className="px-6 py-3 font-medium text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student: any) => {
                  const marks = marksMap[student.id];
                  const percentage = marks !== undefined && currentExam ? (marks / currentExam.totalMarks) * 100 : 0;
                  
                  let grade = 'F';
                  if (percentage >= 90) grade = 'A+';
                  else if (percentage >= 80) grade = 'A';
                  else if (percentage >= 70) grade = 'B';
                  else if (percentage >= 60) grade = 'C';
                  else if (percentage >= 40) grade = 'D';

                  const gradeColor = grade === 'F' ? 'text-red-500' : grade.startsWith('A') ? 'text-green-500' : 'text-blue-500';

                  return (
                    <tr key={student.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4 font-mono sticky left-0 z-10 bg-background group-hover:bg-muted/50 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">{student.rollNo}</td>
                      <td className="px-6 py-4 font-medium">{student.name}</td>
                      <td className="px-6 py-4">
                        <Input 
                            type="number" 
                            min="0" 
                            max={currentExam?.totalMarks} 
                            value={marks !== undefined ? marks : ""} 
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            className={cn(
                                "w-32",
                                marks !== undefined && marks > (currentExam?.totalMarks || 100) && "border-red-500 text-red-500"
                            )}
                        />
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {marks !== undefined ? `${percentage.toFixed(1)}%` : "-"}
                      </td>
                      <td className={cn("px-6 py-4 text-center font-bold", gradeColor)}>
                        {marks !== undefined ? grade : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
