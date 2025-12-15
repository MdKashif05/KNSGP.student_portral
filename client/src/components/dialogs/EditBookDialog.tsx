import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: any;
  onSuccess: () => void;
}

export default function EditBookDialog({ open, onOpenChange, book, onSuccess }: EditBookDialogProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalCopies, setTotalCopies] = useState("");
  const [copiesAvailable, setCopiesAvailable] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (book) {
      setTitle(book.title || "");
      setAuthor(book.author || "");
      setTotalCopies(book.totalCopies?.toString() || "");
      setCopiesAvailable(book.copiesAvailable?.toString() || "");
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !author || !totalCopies || !copiesAvailable) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    const total = parseInt(totalCopies);
    const available = parseInt(copiesAvailable);

    if (isNaN(total) || isNaN(available) || total < 0 || available < 0) {
      toast({
        title: "Error",
        description: "Invalid number of copies",
        variant: "destructive",
      });
      return;
    }

    if (available > total) {
      toast({
        title: "Error",
        description: "Available copies cannot exceed total copies",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/library/books/${book.id}`, {
        title: title.trim(),
        author: author.trim(),
        totalCopies: total,
        copiesAvailable: available,
      });

      await response.json();

      toast({
        title: "Success",
        description: "Book updated successfully",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setAuthor("");
      setTotalCopies("");
      setCopiesAvailable("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update book",
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
          <DialogTitle>Edit Library Book</DialogTitle>
          <DialogDescription>Update book information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Book Title</Label>
              <Input
                id="edit-title"
                data-testid="input-edit-title"
                placeholder="e.g., Introduction to Algorithms"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-author">Author</Label>
              <Input
                id="edit-author"
                data-testid="input-edit-author"
                placeholder="e.g., Thomas H. Cormen"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-total">Total Copies</Label>
                <Input
                  id="edit-total"
                  data-testid="input-edit-total"
                  type="number"
                  min="0"
                  placeholder="e.g., 5"
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-available">Available</Label>
                <Input
                  id="edit-available"
                  data-testid="input-edit-available"
                  type="number"
                  min="0"
                  placeholder="e.g., 3"
                  value={copiesAvailable}
                  onChange={(e) => setCopiesAvailable(e.target.value)}
                  disabled={isLoading}
                />
              </div>
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
            <Button type="submit" disabled={isLoading} data-testid="button-save-book">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
