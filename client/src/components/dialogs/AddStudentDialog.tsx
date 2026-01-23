import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  batchId?: number | null;
  branchId?: number | null;
}

export default function AddStudentDialog({ open, onOpenChange, onSuccess, batchId: initialBatchId, branchId: initialBranchId }: AddStudentDialogProps) {
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState("1");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Batches
  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
    enabled: open
  });

  // Fetch Branches
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: [`/api/branches?batchId=${selectedBatch}`],
    enabled: !!selectedBatch && open
  });

  // Pre-fill fields when dialog opens
  useEffect(() => {
    if (open) {
      if (initialBatchId) setSelectedBatch(initialBatchId.toString());
      if (initialBranchId) setSelectedBranch(initialBranchId.toString());
    } else {
      // Reset logic is handled on successful submit or can be done here
      if (!initialBatchId) setSelectedBatch("");
      if (!initialBranchId) setSelectedBranch("");
    }
  }, [open, initialBatchId, initialBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedRollNo = rollNo.trim();
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!trimmedRollNo || !trimmedName || !trimmedPassword) {
      toast({
        title: "Error",
        description: "Name, Roll Number, and Password are required",
        variant: "destructive",
      });
      return;
    }

    // Strict Branch/Batch Requirement
    if (!selectedBatch) {
      toast({ title: "Error", description: "Please select a Batch", variant: "destructive" });
      return;
    }
    if (!selectedBranch && !initialBranchId) {
      toast({ title: "Error", description: "Please select a Branch", variant: "destructive" });
      return;
    }

    // Simplified validation
    if (!/^\d{4}-[A-Za-z]+-\d+$/i.test(trimmedRollNo)) {
      toast({
        title: "Invalid roll number",
        description: "Use format YYYY-BRANCH-NN, for example 2023-CSE-57",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Determine Branch ID (Strictly from selection)
      let targetBranchId = initialBranchId || (selectedBranch ? parseInt(selectedBranch) : undefined);
      
      if (!targetBranchId) {
         throw new Error("Branch ID is missing. Please select a branch.");
      }

      // Determine Department Name (for legacy schema support)
      let department = "General";
      const branchObj = branches.find(b => b.id === targetBranchId);
      if (branchObj) {
          const deptMap: Record<string, string> = {
          "Computer Science": "CSE",
          "Computer Science & Engineering": "CSE",
          "Electronics": "ECE",
          "Electronics Engineering": "ECE",
          "Mechanical": "ME",
          "Mechanical Engineering": "ME",
          "Civil": "CE",
          "Civil Engineering": "CE",
          "Electrical": "EE",
          "Electrical Engineering": "EE"
        };
        department = deptMap[branchObj.name] || branchObj.name;
      }

      await apiRequest("POST", "/api/students", {
        rollNo: trimmedRollNo,
        name: trimmedName,
        password: trimmedPassword, 
        department: department, 
        branchId: targetBranchId, 
        semester: parseInt(semester),
      });

      // Force aggressive refetching
      await queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/students')) });
      await queryClient.refetchQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/students')) });
      
      await queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes('/api/analytics/global')) });

      toast({
        title: "Success",
        description: "Student added successfully",
      });

      setRollNo("");
      setName("");
      setPassword("");
      setSemester("1");
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
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
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>Enter the student details below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conditionally render Batch/Branch selectors if not provided in context */}
          {initialBatchId ? (
             <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground space-y-1">
                <p><strong>Batch:</strong> {batches.find(b => b.id === initialBatchId)?.name || "Loading..."}</p>
                {initialBranchId && (
                   <p><strong>Branch:</strong> {branches.find(b => b.id === initialBranchId)?.name || "Loading..."}</p>
                )}
             </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch} required>
                <SelectTrigger id="batch">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id.toString()}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!initialBranchId && selectedBatch && (
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch} required>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="rollNo">Roll Number</Label>
            <Input
              id="rollNo"
              data-testid="input-student-rollno"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g., 2023-CSE-57"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              data-testid="input-student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              data-testid="input-student-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-student">
              {isLoading ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
