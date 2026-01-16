import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReturnBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: any;
  book: any;
  student: any;
  onSuccess: () => void;
}

export default function ReturnBookDialog({ open, onOpenChange, issue, book, student, onSuccess }: ReturnBookDialogProps) {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!issue || !book) {
      toast({
        title: "Error",
        description: "Invalid book issue record",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mark book as returned (backend handles book availability update atomically)
      await apiRequest("PUT", `/api/library/issues/${issue.id}/return`, {
        returnDate,
      });

      toast({
        title: "Success",
        description: `Book returned successfully`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to return book",
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
          <DialogTitle>Return Book</DialogTitle>
          <DialogDescription>
            Process book return
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Book</p>
              <p className="text-sm text-muted-foreground">
                {book?.title || "Unknown"} <span className="text-xs opacity-70">by {book?.author || "Unknown"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Student</p>
              <p className="text-sm text-muted-foreground">
                {student?.name || "Unknown"} ({student?.rollNo || "N/A"})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Issue Date</p>
              <p className="text-sm text-muted-foreground">{issue?.issueDate || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Due Date</p>
              <p className="text-sm text-muted-foreground">{issue?.dueDate || "N/A"}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="returnDate">Return Date</Label>
            <Input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
              data-testid="input-return-date"
            />
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
              disabled={isLoading}
              data-testid="button-return-book"
            >
              {isLoading ? "Processing..." : "Return Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
