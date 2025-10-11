import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: any;
  onSuccess: () => void;
}

export default function EditSubjectDialog({ open, onOpenChange, subject, onSuccess }: EditSubjectDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (subject) {
      setCode(subject.code || "");
      setName(subject.name || "");
      setInstructor(subject.instructor || "");
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !name) {
      toast({
        title: "Error",
        description: "Subject code and name are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/subjects/${subject.id}`, {
        code: code.trim(),
        name: name.trim(),
        instructor: instructor.trim(),
      });

      await response.json();

      toast({
        title: "Success",
        description: "Subject updated successfully",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setCode("");
      setName("");
      setInstructor("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject",
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
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>Update subject information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input
                id="edit-code"
                data-testid="input-edit-code"
                placeholder="e.g., CSE101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-subject-name"
                placeholder="e.g., Programming in C"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instructor">Instructor Name</Label>
              <Input
                id="edit-instructor"
                data-testid="input-edit-instructor"
                placeholder="e.g., Dr. Sharma"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                disabled={isLoading}
              />
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
            <Button type="submit" disabled={isLoading} data-testid="button-save-subject">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
