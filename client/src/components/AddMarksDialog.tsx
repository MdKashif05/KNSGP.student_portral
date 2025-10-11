import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddMarksDialog({ open, onOpenChange, onSuccess }: AddMarksDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [month, setMonth] = useState("");
  const [testName, setTestName] = useState("");
  const [marksObtained, setMarksObtained] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch students and subjects
  const { data: students = [] } = useQuery<any[]>({ queryKey: ['/api/students'] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['/api/subjects'] });

  // Calculate percentage and grade
  const percentage = totalMarks && marksObtained 
    ? (parseFloat(marksObtained) / parseFloat(totalMarks)) * 100 
    : 0;

  const getGrade = (pct: number) => {
    if (pct >= 90) return 'A+';
    if (pct >= 85) return 'A';
    if (pct >= 80) return 'B+';
    if (pct >= 75) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const grade = getGrade(percentage);

  const getGradeVariant = (g: string) => {
    if (['A+', 'A'].includes(g)) return 'default' as const;
    if (['B+', 'B'].includes(g)) return 'secondary' as const;
    if (g === 'C') return 'outline' as const;
    return 'destructive' as const;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/marks", {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        month,
        testName,
        marksObtained: parseFloat(marksObtained),
        totalMarks: parseFloat(totalMarks),
      });

      toast({
        title: "Success",
        description: "Marks added successfully",
      });

      // Reset form
      setStudentId("");
      setSubjectId("");
      setMonth("");
      setTestName("");
      setMarksObtained("");
      setTotalMarks("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add marks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Marks</DialogTitle>
          <DialogDescription>Add marks for a student in a subject</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <Select value={studentId} onValueChange={setStudentId} required>
              <SelectTrigger id="student" data-testid="select-student">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.rollNo} - {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger id="subject" data-testid="select-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.code} - {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                data-testid="input-month"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testName">Test Name</Label>
              <Input
                id="testName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g., Mid-Term"
                required
                data-testid="input-test-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marksObtained">Marks Obtained</Label>
              <Input
                id="marksObtained"
                type="number"
                step="0.01"
                min="0"
                max={totalMarks}
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                placeholder="e.g., 85"
                required
                data-testid="input-marks-obtained"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                step="0.01"
                min="1"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g., 100"
                required
                data-testid="input-total-marks"
              />
            </div>
          </div>

          {totalMarks && marksObtained && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Percentage:</span>
                <span className="text-lg font-bold" data-testid="text-percentage">{percentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Grade:</span>
                <Badge variant={getGradeVariant(grade)} data-testid="badge-grade">{grade}</Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit">
              {isLoading ? "Adding..." : "Add Marks"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
