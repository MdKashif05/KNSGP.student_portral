import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

interface IssueBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: any;
  branchId?: number;
  onSuccess: () => void;
}

export default function IssueBookDialog({ open, onOpenChange, book, branchId, onSuccess }: IssueBookDialogProps) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  
  const { data: studentsResponse } = useQuery<any>({ 
    queryKey: [`/api/students?limit=1000${branchId ? `&branchId=${branchId}` : ''}`],
    enabled: open
  });
  const allStudents = studentsResponse?.data || [];
  
  const filteredStudents = allStudents.filter((s: any) => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 50); // Limit dropdown items for performance

  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days from now
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    if (!book || book.copiesAvailable <= 0) {
      toast({
        title: "Error",
        description: "Book is not available",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Issue the book (backend handles book availability update atomically)
      await apiRequest("POST", "/api/library/issues", {
        studentId: parseInt(selectedStudent),
        bookId: book.id,
        issueDate,
        dueDate,
        status: 'issued',
      });

      toast({
        title: "Success",
        description: `Book issued to student successfully`,
      });

      setSelectedStudent("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to issue book",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>
            Issue "{book?.title}" by {book?.author} to a student
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student</Label>
            <div className="space-y-2">
              <Input
                placeholder="Search student..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="mb-2"
              />
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student" data-testid="select-student">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              data-testid="input-issue-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              data-testid="input-due-date"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Available copies: {book?.copiesAvailable || 0}
          </div>

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
            <Button 
              type="submit" 
              disabled={isLoading || !book || book.copiesAvailable <= 0}
              data-testid="button-issue-book"
            >
              {isLoading ? "Issuing..." : "Issue Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
