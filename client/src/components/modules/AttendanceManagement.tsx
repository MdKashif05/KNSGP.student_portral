import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Layers, Loader2, Calendar, User, BookOpen } from "lucide-react";
import DataTable from "../common/DataTable";
import AddAttendanceDialog from "../dialogs/AddAttendanceDialog";
import EditAttendanceDialog from "../dialogs/EditAttendanceDialog";
import BatchAttendanceDialog from "../dialogs/BatchAttendanceDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function AttendanceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: students = [] } = useQuery<any[]>({ queryKey: ['/api/students'] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['/api/subjects'] });
  const { data: attendance = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/attendance'] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Success", description: "Attendance record deleted successfully" });
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
      key: 'month', 
      label: 'Month',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      )
    },
    { 
      key: 'stats', 
      label: 'Stats',
      render: (_: any, row: any) => (
        <div className="flex flex-col text-sm">
          <span>{row.presentDays} / {row.totalDays} days</span>
        </div>
      )
    },
    { 
      key: 'percentage', 
      label: 'Status',
      render: (value: number) => {
        const status = value >= 75 ? 'Good' : value >= 60 ? 'Average' : 'Low';
        const variant = value >= 75 ? 'default' : value >= 60 ? 'secondary' : 'destructive';
        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant}>{value.toFixed(1)}%</Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">({status})</span>
          </div>
        );
      }
    },
  ];

  const filteredData = attendance.filter((record: any) => {
    if (!searchTerm.trim()) return true;
    
    const student = students.find(s => s.id === record.studentId);
    const subject = subjects.find(s => s.id === record.subjectId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      student?.name?.toLowerCase().includes(searchLower) ||
      student?.rollNo?.toLowerCase().includes(searchLower) ||
      subject?.name?.toLowerCase().includes(searchLower) ||
      subject?.code?.toLowerCase().includes(searchLower) ||
      record.month?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Attendance Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track and manage monthly attendance records</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowBatchDialog(true)}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <Layers className="h-4 w-4 mr-2" />
            Batch Entry
          </Button>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="flex-1 sm:flex-none"
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
          placeholder="Search by student, subject, or month..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <DataTable
        title="Attendance Records"
        description={`Showing ${filteredData.length} of ${attendance.length} records`}
        columns={columns}
        data={filteredData}
        actions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddAttendanceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />

      <EditAttendanceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        attendance={selectedItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />

      <BatchAttendanceDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        }}
      />
    </div>
  );
}
