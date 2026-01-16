import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  branchId?: number | null;
  branchName?: string | null;
}

export default function AddNoticeDialog({ open, onOpenChange, onSuccess, branchId, branchName }: AddNoticeDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/notices", {
        title,
        message,
        priority,
        branchId: branchId || undefined,
      });

      toast({
        title: "Success",
        description: "Notice added successfully",
      });

      setTitle("");
      setMessage("");
      setPriority("normal");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add notice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isInvalidContext = !!branchName && !branchId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Notice</DialogTitle>
          <DialogDescription>Send a notice to {branchName || "all students"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-md text-sm flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Target Audience:</span>
              <span className="font-semibold text-primary">
                {branchName || (branchId ? "Current Branch" : "Global (All Branches)")}
              </span>
            </div>
            {isInvalidContext && (
              <span className="text-xs text-destructive font-medium">
                ⚠️ Error: Branch ID missing. Please refresh or re-select branch.
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notice title"
              required
              data-testid="input-notice-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notice message"
              required
              rows={4}
              data-testid="textarea-notice-message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-notice-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isInvalidContext} data-testid="button-submit-notice">
              {isLoading ? "Adding..." : "Add Notice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
