import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface AddBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: number | null;
  onSuccess?: () => void;
}

export default function AddBranchDialog({ open, onOpenChange, batchId, onSuccess }: AddBranchDialogProps) {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!batchId) throw new Error("No batch selected");
      await apiRequest("POST", "/api/branches", { name: name.trim(), batchId });
    },
    onSuccess: async () => {
      toast({ title: "Branch created", description: "New branch has been added successfully." });
      onOpenChange(false);
      setName("");
      if (batchId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/branches?batchId=${batchId}`] });
        await queryClient.refetchQueries({ queryKey: [`/api/branches?batchId=${batchId}`] });
      }
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create branch", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !batchId) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogDescription>
            Add a department/branch to this batch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Computer Science"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
