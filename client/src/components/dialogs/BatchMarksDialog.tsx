import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BatchMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function BatchMarksDialog({ open, onOpenChange, onSuccess }: BatchMarksDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [testName, setTestName] = useState<string>("");
  const [marksData, setMarksData] = useState<Record<string, { obtained: string, total: string }>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);

  const { data: students = [] } = useQuery<any[]>({ queryKey: ['/api/students'] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['/api/subjects'] });

  useEffect(() => {
    if (open) {
      setStep('input');
      setValidationErrors([]);
      setPreviewRecords([]);
    }
  }, [open]);

  useEffect(() => {
    if (subjects.length > 0 && Object.keys(marksData).length === 0) {
      const initialData: Record<string, { obtained: string, total: string }> = {};
      subjects.forEach(subject => {
        initialData[subject.id] = { obtained: "", total: subject.totalMarks?.toString() || "100" };
      });
      setMarksData(initialData);
    }
  }, [subjects]);

  const mutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await apiRequest("POST", "/api/marks/batch", { records });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      toast({
        title: "Success",
        description: `Successfully created ${data.length} marks records`,
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
    setTimeout(() => {
      setStep('input');
      setSelectedStudent("");
      setMonth("");
      setTestName("");
      // Reset marks data but keep default totals
      const resetData: Record<string, { obtained: string, total: string }> = {};
      subjects.forEach(subject => {
        resetData[subject.id] = { obtained: "", total: subject.totalMarks?.toString() || "100" };
      });
      setMarksData(resetData);
      setValidationErrors([]);
      setPreviewRecords([]);
    }, 300);
  };

  const validateAndPreview = () => {
    setValidationErrors([]);

    if (!selectedStudent || !month || !testName) {
      setValidationErrors(["Please fill in all required fields (Student, Month, Test Name)"]);
      return;
    }

    const errors: string[] = [];
    const records: any[] = [];

    try {
      subjects.forEach(subject => {
        const data = marksData[subject.id];
        // Skip empty entries
        if (!data?.obtained) return;

        const obtained = parseFloat(data.obtained);
        const total = parseFloat(data.total);

        if (isNaN(obtained)) {
          errors.push(`Invalid obtained marks for ${subject.name}`);
          return;
        }

        if (isNaN(total) || total <= 0) {
          errors.push(`Invalid total marks for ${subject.name}`);
          return;
        }

        if (obtained < 0) {
          errors.push(`Marks cannot be negative for ${subject.name}`);
          return;
        }

        if (obtained > total) {
          errors.push(`Marks obtained (${obtained}) cannot exceed total marks (${total}) for ${subject.name}`);
          return;
        }

        const percentage = (obtained / total) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else if (percentage >= 35) grade = 'P';

        records.push({
          studentId: parseInt(selectedStudent),
          subjectId: subject.id,
          subjectName: subject.name,
          month,
          testName,
          marksObtained: obtained,
          totalMarks: total,
          percentage: percentage.toFixed(1),
          grade
        });
      });

      if (records.length === 0) {
        errors.push("Please enter marks for at least one subject");
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
    // Strip UI-only fields (subjectName, percentage, grade) before sending
    const recordsToSend = previewRecords.map(({ subjectName, percentage, grade, ...rest }) => rest);
    mutation.mutate(recordsToSend);
  };

  const getStudentName = () => {
    const student = students.find(s => s.id.toString() === selectedStudent);
    return student ? `${student.name} (${student.rollNo})` : "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' ? "Batch Marks Entry" : "Confirm Marks Entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'input' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.rollNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input 
                    id="testName" 
                    value={testName} 
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Mid Term"
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

              <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                <h3 className="font-medium mb-4">Enter Marks for Subjects</h3>
                <div className="grid grid-cols-1 gap-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="grid grid-cols-12 gap-2 items-center">
                      <Label className="col-span-6 truncate" title={subject.name}>{subject.name}</Label>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Obtained"
                          value={marksData[subject.id]?.obtained || ""}
                          onChange={(e) => setMarksData({
                            ...marksData,
                            [subject.id]: { 
                              ...marksData[subject.id], 
                              obtained: e.target.value 
                            }
                          })}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Total"
                          value={marksData[subject.id]?.total || ""}
                          onChange={(e) => setMarksData({
                            ...marksData,
                            [subject.id]: { 
                              ...marksData[subject.id], 
                              total: e.target.value 
                            }
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Review Summary</AlertTitle>
                <AlertDescription>
                  You are about to submit marks for <strong>{getStudentName()}</strong> for <strong>{testName}</strong> ({month}).
                </AlertDescription>
              </Alert>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Obtained</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRecords.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{record.subjectName}</TableCell>
                        <TableCell className="text-right">{record.marksObtained}</TableCell>
                        <TableCell className="text-right">{record.totalMarks}</TableCell>
                        <TableCell className="text-right">{record.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${record.grade === 'F' ? 'text-red-500' : 'text-green-600'}`}>
                            {record.grade}
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
              <Button onClick={validateAndPreview}>Review & Confirm</Button>
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