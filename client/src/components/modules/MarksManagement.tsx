import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Layers, Loader2, Calendar, Award, Upload } from "lucide-react";
import DataTable from "../common/DataTable";
import AddMarksDialog from "../dialogs/AddMarksDialog";
import EditMarksDialog from "../dialogs/EditMarksDialog";
import BatchMarksDialog from "../dialogs/BatchMarksDialog";
import UploadMarksCSVDialog from "../dialogs/UploadMarksCSVDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MarksManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: students = [] } = useQuery<any[]>({ queryKey: ['/api/students'] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['/api/subjects'] });
  const { data: marks = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/marks'] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/marks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      toast({ title: "Success", description: "Marks record deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = (item: any) => {
    if (confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(item.id);
    }
  };

  const columns = [
    { 
      key: 'studentInfo', 
      label: 'Student',
      render: (_: any, row: any) => {
        const student = students.find(s => s.id === row.studentId);
        return (
          <div className="flex flex-col">
            <span className="font-medium">{student ? student.name : 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{student ? student.rollNo : row.studentId}</span>
          </div>
        );
      }
    },
    { 
      key: 'subjectInfo', 
      label: 'Subject',
      render: (_: any, row: any) => {
        const subject = subjects.find(s => s.id === row.subjectId);
        return (
          <div className="flex flex-col">
            <span className="font-medium">{subject ? subject.name : 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{subject ? subject.code : row.subjectId}</span>
          </div>
        );
      }
    },
    { 
      key: 'testInfo', 
      label: 'Test / Month',
      render: (_: any, row: any) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{row.testName}</span>
          <span className="text-xs text-muted-foreground">{row.month}</span>
        </div>
      )
    },
    { 
      key: 'marks', 
      label: 'Score',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1 font-mono">
          <span>{row.marksObtained}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{row.totalMarks}</span>
        </div>
      )
    },
    { 
      key: 'grade', 
      label: 'Grade',
      render: (_: any, row: any) => {
        const variant = ['A+', 'A'].includes(row.grade) ? 'default' : ['B+', 'B'].includes(row.grade) ? 'secondary' : row.grade === 'C' ? 'outline' : 'destructive';
        return (
          <div className="flex items-center gap-2">
             <Badge variant={variant}>{row.grade}</Badge>
             <span className="text-xs text-muted-foreground hidden sm:inline">({row.percentage}%)</span>
          </div>
        );
      }
    },
  ];

  const filteredData = marks.filter((record: any) => {
    if (!searchTerm.trim()) return true;
    
    const student = students.find(s => s.id === record.studentId);
    const subject = subjects.find(s => s.id === record.subjectId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      student?.name?.toLowerCase().includes(searchLower) ||
      student?.rollNo?.toLowerCase().includes(searchLower) ||
      subject?.name?.toLowerCase().includes(searchLower) ||
      subject?.code?.toLowerCase().includes(searchLower) ||
      record.testName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Marks Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Upload and manage student marks</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowBatchDialog(true)}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Layers className="h-4 w-4 mr-2" />
            Batch Entry
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowUploadDialog(true)}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Single
          </Button>
        </div>
      </div>
      
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by student, subject, or test..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <DataTable
        title="Marks Records"
        description={`Showing ${filteredData.length} of ${marks.length} records`}
        columns={columns}
        data={filteredData}
        actions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddMarksDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />

      <EditMarksDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        marks={selectedItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />

      <BatchMarksDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />

      <UploadMarksCSVDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />
    </div>
  );
}
