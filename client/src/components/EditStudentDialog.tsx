import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onSuccess: () => void;
}

export default function EditStudentDialog({ open, onOpenChange, student, onSuccess }: EditStudentDialogProps) {
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setRollNo(student.rollNo || "");
      setName(student.name || "");
      setPassword(student.password || "");
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rollNo || !name || !password) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/students/${student.id}`, {
        rollNo: rollNo.trim(),
        name: name.trim(),
        password: password.toLowerCase().trim(),
      });

      await response.json();

      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setRollNo("");
      setName("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
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
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rollno">Roll Number</Label>
              <Input
                id="edit-rollno"
                data-testid="input-edit-rollno"
                placeholder="e.g., 2023-CSE-01"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Student Name</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                data-testid="input-edit-password"
                placeholder="Student name (used as password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Password will be stored in lowercase</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-save-student">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
