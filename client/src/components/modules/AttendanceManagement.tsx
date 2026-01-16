import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Layers, Loader2, Calendar, User, BookOpen, Infinity as InfinityIcon } from "lucide-react";
import DataTable from "../common/DataTable";
import AddAttendanceDialog from "../dialogs/AddAttendanceDialog";
import EditAttendanceDialog from "../dialogs/EditAttendanceDialog";
import BatchAttendanceDialog from "../dialogs/BatchAttendanceDialog";
import DeleteConfirmDialog from "../dialogs/DeleteConfirmDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AttendanceManagement({ department, branchId }: { department?: string, branchId?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({
    title: "",
    description: "",
    action: () => {}
  });

  const { data: studentsResponse } = useQuery<any>({ 
    queryKey: [`/api/students?limit=1000${branchId ? `&branchId=${branchId}` : department ? `&department=${department}` : ""}`] 
  });
  const studentsRaw = studentsResponse?.data;
  const students = Array.isArray(studentsRaw) ? studentsRaw : [];
  
  const { data: subjectsRaw = [] } = useQuery<any[]>({ 
    queryKey: [`/api/subjects${branchId ? `?branchId=${branchId}` : department ? `?department=${department}` : ""}`] 
  });
  const subjects = Array.isArray(subjectsRaw) ? subjectsRaw : [];
  
  const { data: attendanceResponse, isLoading } = useQuery<any>({ 
    queryKey: [`/api/attendance?page=${page}&limit=${limit}&search=${debouncedSearch}${branchId ? `&branchId=${branchId}` : department ? `&department=${department}` : ""}`],
    placeholderData: (previousData: any) => previousData,
    staleTime: 0,
  });
 
  const attendance = attendanceResponse?.data || [];
  const total = attendanceResponse?.pagination?.total || 0;
  const totalPages = attendanceResponse?.pagination?.totalPages || 1;

  // Use server-side filtered data directly
  const filteredData = attendance;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/attendance")) });
      toast({ title: "Success", description: "Attendance record deleted successfully" });
      setShowDeleteConfirm(false);
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
    setDeleteConfig({
      title: "Delete Attendance Record",
      description: "Are you sure you want to delete this attendance record? This action cannot be undone.",
      action: () => deleteMutation.mutate(item.id)
    });
    setShowDeleteConfirm(true);
  };

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await apiRequest("DELETE", `/api/attendance/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/attendance")) });
      toast({ title: "Success", description: "Selected attendance records deleted successfully" });
      setSelectedAttendanceIds([]);
      setShowDeleteConfirm(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const columns = [
    { 
      key: 'studentInfo', 
      label: 'Student',
      render: (_: any, row: any) => {
        const student = row.student || students.find((s: any) => s.id === row.studentId);
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

  // Client-side filtering removed in favor of server-side search
  // const filteredData = attendance.filter(...) 

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Attendance Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track and manage monthly attendance records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedAttendanceIds.length === 0) return;
              setDeleteConfig({
                title: "Delete Selected Attendance",
                description: `Are you sure you want to delete ${selectedAttendanceIds.length} selected attendance records? This action cannot be undone.`,
                action: () => batchDeleteMutation.mutate(selectedAttendanceIds)
              });
              setShowDeleteConfirm(true);
            }}
            disabled={selectedAttendanceIds.length === 0 || batchDeleteMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            Delete Selected
          </Button>
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
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end flex-shrink-0">
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
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-9 px-4 flex items-center gap-2">
              <InfinityIcon className="h-4 w-4" />
              <span>Infinity Mode Active</span>
           </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          title="Attendance Records"
          description={`Showing all ${filteredData.length} records`}
          columns={columns}
          data={filteredData}
          actions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectableRows={true}
          selectedRowIds={selectedAttendanceIds}
          getRowId={(row: any) => row.id}
          onToggleRow={(row: any) => {
            setSelectedAttendanceIds((prev) =>
              prev.includes(row.id)
                ? prev.filter((id) => id !== row.id)
                : [...prev, row.id]
            );
          }}
          onToggleAll={() => {
            const allIds = filteredData.map((record: any) => record.id);
            const allSelected = allIds.every((id: number) => selectedAttendanceIds.includes(id));
            
            if (allSelected) {
              setSelectedAttendanceIds(prev => prev.filter(id => !allIds.includes(id)));
            } else {
              setSelectedAttendanceIds(prev => Array.from(new Set([...prev, ...allIds])));
            }
          }}
          enableVirtualization={true}
        />
      </div>

      <AddAttendanceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        branchId={branchId}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/attendance")) });
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/students")) });
        }}
      />

      <EditAttendanceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        attendance={selectedItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/attendance")) });
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/students")) });
        }}
      />

      <BatchAttendanceDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        branchId={branchId}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/attendance")) });
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/students")) });
        }}
      />

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => {
          deleteConfig.action();
        }}
        title={deleteConfig.title}
        description={deleteConfig.description}
        isLoading={deleteMutation.isPending || batchDeleteMutation.isPending}
      />
    </div>
  );
}
