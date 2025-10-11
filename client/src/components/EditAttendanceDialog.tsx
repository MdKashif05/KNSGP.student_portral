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

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  attendance: any;
}

export default function EditAttendanceDialog({ open, onOpenChange, onSuccess, attendance }: EditAttendanceDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [month, setMonth] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [presentDays, setPresentDays] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch students and subjects
  const { data: students = [] } = useQuery<any[]>({ queryKey: ['/api/students'] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['/api/subjects'] });

  // Pre-populate form when attendance changes
  useEffect(() => {
    if (attendance) {
      setStudentId(attendance.studentId?.toString() || "");
      setSubjectId(attendance.subjectId?.toString() || "");
      setMonth(attendance.month || "");
      setTotalDays(attendance.totalDays?.toString() || "");
      setPresentDays(attendance.presentDays?.toString() || "");
    }
  }, [attendance]);

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

    try {
      await apiRequest("PUT", `/api/attendance/${attendance.id}`, {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        month,
        totalDays: parseInt(totalDays),
        presentDays: parseInt(presentDays),
      });

      toast({
        title: "Success",
        description: "Attendance record updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
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
          <DialogTitle>Edit Monthly Attendance</DialogTitle>
          <DialogDescription>Update monthly attendance record</DialogDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDays">Total Working Days</Label>
              <Input
                id="totalDays"
                type="number"
                min="1"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
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
            <Button type="submit" disabled={isLoading} data-testid="button-save">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
