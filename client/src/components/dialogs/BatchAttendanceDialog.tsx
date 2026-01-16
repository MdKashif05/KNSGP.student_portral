import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { normalizeMonthInput } from "@/lib/utils";

interface BatchAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  branchId?: number; // Optional context
}

export default function BatchAttendanceDialog({ open, onOpenChange, onSuccess, branchId: initialBranchId }: BatchAttendanceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  
  // Filtering state
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [month, setMonth] = useState<string>("");
  const [totalDays, setTotalDays] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);

  // Fetch Students
  // Use initialBranchId if available. If not, we fetch all (limit 1000).
  const { data: studentsResponse } = useQuery<any>({ 
    queryKey: [`/api/students?limit=1000${initialBranchId ? `&branchId=${initialBranchId}` : ''}`],
    enabled: open
  });
  const studentsRaw = studentsResponse?.data;
  const students = Array.isArray(studentsRaw) ? studentsRaw : [];
  
  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 50);

  // Determine active branch for subjects
  const selectedStudentObj = students.find((s: any) => s.id.toString() === selectedStudent);
  const activeBranchId = initialBranchId?.toString() || selectedStudentObj?.branchId;

  // Fetch Subjects (filtered by active branch)
  const { data: subjectsRaw = [] } = useQuery<any[]>({ 
    queryKey: [`/api/subjects${activeBranchId ? `?branchId=${activeBranchId}` : ''}`],
    enabled: open && !!activeBranchId
  });
  const subjects = Array.isArray(subjectsRaw) ? subjectsRaw : [];

  useEffect(() => {
    if (open) {
      setStep('input');
      setValidationErrors([]);
      setPreviewRecords([]);
      // Don't reset filters to allow continuous entry for same batch/branch
    }
  }, [open]);

  // Reset student when not in open
  useEffect(() => {
    if (!open) {
      setSelectedStudent("");
    }
  }, [open]);

  useEffect(() => {
    if (subjects.length > 0 && Object.keys(attendanceData).length === 0) {
      const initialData: Record<string, string> = {};
      subjects.forEach(subject => {
        initialData[subject.id] = "";
      });
      setAttendanceData(initialData);
    }
  }, [subjects]);

  const mutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await apiRequest("POST", "/api/attendance/batch", { records });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      // Optimistic update feeling
      toast({
        title: "Success",
        description: `Successfully created ${data.length} attendance records`,
      });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after a delay to allow animation to finish
    setTimeout(() => {
      setStep('input');
      setSelectedStudent("");
      setMonth("");
      setTotalDays("");
      setAttendanceData({});
      setValidationErrors([]);
      setPreviewRecords([]);
      // We keep batch/branch selected for convenience
    }, 300);
  };

  const validateAndPreview = () => {
    setValidationErrors([]);
    
    if (!selectedStudent || !month || !totalDays) {
      setValidationErrors(["Please fill in all required fields (Student, Month, Total Days)"]);
      return;
    }

    const normalizedMonth = normalizeMonthInput(month);

    const total = parseInt(totalDays);
    if (isNaN(total) || total <= 0) {
      setValidationErrors(["Total days must be a positive number"]);
      return;
    }

    const errors: string[] = [];
    const records: any[] = [];

    try {
      subjects.forEach(subject => {
        const presentDays = attendanceData[subject.id];
        // Skip empty entries
        if (presentDays === "" || presentDays === undefined) return;

        const present = parseInt(presentDays);
        
        if (isNaN(present)) {
          errors.push(`Invalid present days for ${subject.name}`);
          return;
        }

        if (present < 0) {
          errors.push(`Present days cannot be negative for ${subject.name}`);
          return;
        }

        if (present > total) {
          errors.push(`Present days (${present}) cannot exceed total days (${total}) for ${subject.name}`);
          return;
        }

        const percentage = (present / total) * 100;
        
        records.push({
          studentId: parseInt(selectedStudent),
          subjectId: subject.id,
          subjectName: subject.name,
          month: normalizedMonth,
          totalDays: total,
          presentDays: present,
          percentage: percentage.toFixed(1)
        });
      });

      if (records.length === 0) {
        errors.push("Please enter attendance for at least one subject");
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setPreviewRecords(records);
        setStep('confirm');
      }
    } catch (err: any) {
      setValidationErrors([`Unexpected error: ${err.message}`]);
    }
  };

  const handleSubmit = () => {
    // Strip UI-only fields (subjectName, percentage) before sending
    const recordsToSend = previewRecords.map(({ subjectName, percentage, ...rest }) => rest);
    mutation.mutate(recordsToSend);
  };

  const getStudentName = () => {
    const student = students.find((s: any) => s.id.toString() === selectedStudent);
    return student ? `${student.name} (${student.rollNo})` : "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' ? "Batch Attendance Entry" : "Confirm Attendance Entry"}
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search student..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {filteredStudents.map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.rollNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="month"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(normalizeMonthInput(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalDays">Total Days</Label>
                <Input 
                  id="totalDays" 
                  type="number" 
                  min="1"
                  value={totalDays} 
                  onChange={(e) => setTotalDays(e.target.value)}
                  placeholder="e.g. 25"
                />
              </div>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-sm">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'input' ? (
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                <h3 className="font-medium mb-4">Enter Present Days for Subjects {activeBranchId && "(Filtered by Branch)"}</h3>
                {subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {!selectedStudent ? "Please select a student to see subjects." : "No subjects found for this student's branch."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="border-b pb-4 last:border-0 last:pb-0">
                         <div className="mb-2">
                            <Label className="text-base font-semibold" title={subject.name}>{subject.name}</Label>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                         </div>
                         <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Present Days</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={totalDays}
                                  placeholder="Present"
                                  value={attendanceData[subject.id] || ""}
                                  onChange={(e) => setAttendanceData({
                                    ...attendanceData,
                                    [subject.id]: e.target.value
                                  })}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground pt-4">
                               / {totalDays || "-"}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Review Summary</AlertTitle>
                <AlertDescription>
                  You are about to submit attendance for <strong>{getStudentName()}</strong> for <strong>{month}</strong>.
                  <br />
                  Total Working Days: <strong>{totalDays}</strong>
                </AlertDescription>
              </Alert>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRecords.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{record.subjectName}</TableCell>
                        <TableCell className="text-right">{record.presentDays}</TableCell>
                        <TableCell className="text-right">{record.totalDays}</TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(record.percentage) < 75 ? "text-red-500 font-bold" : "text-green-600"}>
                            {record.percentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === 'input' ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={validateAndPreview} disabled={!selectedStudent || subjects.length === 0}>Review & Confirm</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('input')} disabled={mutation.isPending}>Back</Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Records
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
