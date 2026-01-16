import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  branchId?: number;
}

export default function AddSubjectDialog({ open, onOpenChange, onSuccess, branchId }: AddSubjectDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [instructor, setInstructor] = useState("");
  // Default values for hidden fields
  const [department, setDepartment] = useState("CSE");
  const [semester, setSemester] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch Branches to map ID to Name if needed
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: [`/api/branches`],
    enabled: open
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalBranchId = branchId;
      let finalDepartment = department;

      // Logic to determine department and branchId
      if (finalBranchId) {
        const branchObj = branches.find(b => b.id === finalBranchId);
        if (branchObj) {
           const deptMap: Record<string, string> = {
            "Computer Science": "CSE",
            "Electronics": "ECE",
            "Mechanical": "ME",
            "Civil": "CE",
            "Civil Engineering": "CE",
            "Electrical": "EE"
          };
          finalDepartment = deptMap[branchObj.name] || branchObj.name;
        }
      } else {
        // Try to guess from code if no branch context
        // e.g. CSE101 -> CSE, ME101 -> ME
        const codePrefix = code.replace(/[0-9].*$/, '').toUpperCase();
        if (codePrefix.length >= 2) {
             const branchObj = branches.find(b => 
                b.name.toUpperCase() === codePrefix || 
                b.name.toUpperCase().includes(codePrefix) ||
                (codePrefix === "CSE" && b.name.includes("Computer Science")) ||
                (codePrefix === "ECE" && b.name.includes("Electronics")) ||
                (codePrefix === "ME" && b.name.includes("Mechanical")) ||
                (codePrefix === "CE" && b.name.includes("Civil")) ||
                (codePrefix === "EE" && b.name.includes("Electrical"))
              );
              if (branchObj) {
                finalBranchId = branchObj.id;
                finalDepartment = codePrefix; // Or map from branch name
              } else {
                // If code is valid dept code, use it as department string at least
                if (["CSE", "ME", "CE", "EE", "ECE"].includes(codePrefix)) {
                    finalDepartment = codePrefix;
                }
              }
        }
      }

      await apiRequest("POST", "/api/subjects", {
        code,
        name,
        instructor,
        department: finalDepartment,
        branchId: finalBranchId,
        semester: parseInt(semester),
      });

      toast({
        title: "Success",
        description: "Subject added successfully",
      });

      setCode("");
      setName("");
      setInstructor("");
      setDepartment("CSE");
      setSemester("1");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add subject",
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
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>Enter the subject details below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden Department and Semester selectors as per request */}
          
          <div className="space-y-2">
            <Label htmlFor="code">Subject Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., CSE106"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subject name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Input
              id="instructor"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Enter instructor name"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
