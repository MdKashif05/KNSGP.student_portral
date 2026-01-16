import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface AddBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function AddBatchDialog({ open, onOpenChange, onCreated }: AddBatchDialogProps) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        startYear: parseInt(startYear, 10),
        endYear: parseInt(endYear, 10),
      };
      await apiRequest("POST", "/api/batches", payload);
    },
    onSuccess: () => {
      toast({ title: "Batch created", description: "New academic batch has been added successfully." });
      onOpenChange(false);
      setName("");
      setStartYear("");
      setEndYear("");
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      if (onCreated) onCreated();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create batch", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Batch name is required", variant: "destructive" });
      return;
    }
    const start = parseInt(startYear, 10);
    const end = parseInt(endYear, 10);
    
    if (isNaN(start) || start < 2000 || start > 2100) {
      toast({ title: "Validation Error", description: "Start year must be between 2000 and 2100", variant: "destructive" });
      return;
    }
    if (isNaN(end) || end < 2000 || end > 2100) {
      toast({ title: "Validation Error", description: "End year must be between 2000 and 2100", variant: "destructive" });
      return;
    }
    if (end <= start) {
      toast({ title: "Validation Error", description: "End year must be after start year", variant: "destructive" });
      return;
    }

    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Batch</DialogTitle>
          <DialogDescription>
            Create a new academic batch. e.g., "2023–2026"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2023–2026"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startYear">Start Year</Label>
              <Input
                id="startYear"
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="2023"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endYear">End Year</Label>
              <Input
                id="endYear"
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                placeholder="2026"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
