import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, FileUp } from "lucide-react";

interface UploadMarksCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function UploadMarksCSVDialog({ open, onOpenChange, onSuccess }: UploadMarksCSVDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
        setError("Please select a valid CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file must contain header and at least one data row");
      }

      // Validate header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredHeaders = ['studentid', 'subjectid', 'month', 'testname', 'marksobtained', 'totalmarks'];
      const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Parse data rows
      const marksRecords = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 6) continue; // Skip incomplete rows

        const studentIdIdx = header.indexOf('studentid');
        const subjectIdIdx = header.indexOf('subjectid');
        const monthIdx = header.indexOf('month');
        const testNameIdx = header.indexOf('testname');
        const marksObtainedIdx = header.indexOf('marksobtained');
        const totalMarksIdx = header.indexOf('totalmarks');

        marksRecords.push({
          studentId: parseInt(values[studentIdIdx]),
          subjectId: parseInt(values[subjectIdIdx]),
          month: values[monthIdx],
          testName: values[testNameIdx],
          marksObtained: parseFloat(values[marksObtainedIdx]),
          totalMarks: parseFloat(values[totalMarksIdx]),
        });
      }

      // Upload all records
      let successCount = 0;
      let errorCount = 0;

      for (const record of marksRecords) {
        try {
          await apiRequest("POST", "/api/marks", record);
          successCount++;
        } catch (err) {
          errorCount++;
          console.error("Error uploading record:", err);
        }
      }

      toast({
        title: "CSV Upload Complete",
        description: `Successfully uploaded ${successCount} records. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
      });

      setFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      setError(error.message || "Failed to process CSV file");
      toast({
        title: "Error",
        description: error.message || "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Marks CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing marks data. The CSV must have the following headers:<br />
            <code className="text-xs">studentId, subjectId, month, testName, marksObtained, totalMarks</code>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
              data-testid="input-csv-file"
            />
            {file && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                {file.name}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format Example:</strong><br />
              <code className="text-xs">
                studentId,subjectId,month,testName,marksObtained,totalMarks<br />
                1,1,2025-01,Mid-Term,85,100<br />
                2,1,2025-01,Mid-Term,90,100
              </code>
            </AlertDescription>
          </Alert>

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
            <Button type="submit" disabled={isLoading || !file} data-testid="button-upload">
              {isLoading ? "Uploading..." : "Upload CSV"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
