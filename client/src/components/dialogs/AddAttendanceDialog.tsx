import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { normalizeMonthInput } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface AddAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  branchId?: number; // Optional branch context
}

export default function AddAttendanceDialog({ open, onOpenChange, onSuccess, branchId }: AddAttendanceDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [month, setMonth] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [presentDays, setPresentDays] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch students (filtered by branch if provided)
  const { data: studentsResponse } = useQuery<any>({ 
    queryKey: [`/api/students?limit=1000${branchId ? `&branchId=${branchId}` : ''}`],
    enabled: open
  });
  const studentsRaw = studentsResponse?.data;
  const students = Array.isArray(studentsRaw) ? studentsRaw : [];
  
  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 50);

  // Fetch subjects (filtered by branch if provided)
  const { data: subjectsRaw = [] } = useQuery<any[]>({ 
    queryKey: [`/api/subjects${branchId ? `?branchId=${branchId}` : ''}`],
    enabled: open
  });
  const subjects = Array.isArray(subjectsRaw) ? subjectsRaw : [];

  // Calculate percentage and status
  const percentage = totalDays && presentDays 
    ? (parseInt(presentDays) / parseInt(totalDays)) * 100 
    : 0;

  const getStatus = (pct: number) => {
    if (pct >= 80) return { label: 'Good', variant: 'default' as const };
    if (pct >= 60) return { label: 'Average', variant: 'secondary' as const };
    return { label: 'Poor', variant: 'destructive' as const };
  };

  const status = getStatus(percentage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const normalizedMonth = normalizeMonthInput(month);

    try {
      await apiRequest("POST", "/api/attendance", {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        month: normalizedMonth,
        totalDays: parseInt(totalDays),
        presentDays: parseInt(presentDays),
      });

      toast({
        title: "Success",
        description: "Attendance record added successfully",
      });

      // Reset form
      setStudentId("");
      setSubjectId("");
      setMonth("");
      setTotalDays("");
      setPresentDays("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add attendance",
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
          <DialogTitle>Add Monthly Attendance</DialogTitle>
          <DialogDescription>Record monthly attendance for a student in a subject</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <div className="space-y-2">
              <Input
                placeholder="Search student..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="mb-2"
              />
              <Select value={studentId} onValueChange={setStudentId} required>
                <SelectTrigger
                  id="student"
                  data-testid="select-student"
                  className="w-full h-10"
                >
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {filteredStudents.map((student: any) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.rollNo} - {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger
                id="subject"
                data-testid="select-subject"
                className="w-full h-10"
              >
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.code} - {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                required
                data-testid="input-month"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDays">Total Working Days</Label>
              <Input
                id="totalDays"
                type="number"
                min="1"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                placeholder="e.g., 22"
                required
                data-testid="input-total-days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentDays">Present Days</Label>
              <Input
                id="presentDays"
                type="number"
                min="0"
                max={totalDays}
                value={presentDays}
                onChange={(e) => setPresentDays(e.target.value)}
                placeholder="e.g., 20"
                required
                data-testid="input-present-days"
              />
            </div>
          </div>

          {totalDays && presentDays && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance Percentage:</span>
                <span className="text-lg font-bold" data-testid="text-percentage">{percentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={status.variant} data-testid="badge-status">{status.label}</Badge>
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
              {isLoading ? "Adding..." : "Add Attendance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
