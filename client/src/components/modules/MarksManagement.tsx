import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Layers, Loader2, Calendar, Award, Upload, Infinity as InfinityIcon } from "lucide-react";
import DataTable from "../common/DataTable";
import AddMarksDialog from "../dialogs/AddMarksDialog";
import EditMarksDialog from "../dialogs/EditMarksDialog";
import BatchMarksDialog from "../dialogs/BatchMarksDialog";
import UploadMarksCSVDialog from "../dialogs/UploadMarksCSVDialog";
import DeleteConfirmDialog from "../dialogs/DeleteConfirmDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MarksManagement({ department, branchId }: { department?: string, branchId?: number }) {
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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedMarksIds, setSelectedMarksIds] = useState<number[]>([]);
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
  
  const { data: marksResponse, isLoading } = useQuery<any>({ 
    queryKey: [`/api/marks?page=${page}&limit=${limit}&search=${debouncedSearch}${branchId ? `&branchId=${branchId}` : department ? `&department=${department}` : ""}`],
    staleTime: 0,
  });
  
  const marks = marksResponse?.data || [];
  const total = marksResponse?.pagination?.total || 0;
  const totalPages = marksResponse?.pagination?.totalPages || 1;

  // Use server-side filtered data directly
  const filteredData = marks;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/marks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/marks")) });
      toast({ title: "Success", description: "Marks record deleted successfully" });
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
      title: "Delete Marks Record",
      description: "Are you sure you want to delete this marks record? This action cannot be undone.",
      action: () => deleteMutation.mutate(item.id)
    });
    setShowDeleteConfirm(true);
  };

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await apiRequest("DELETE", `/api/marks/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/marks")) });
      toast({ title: "Success", description: "Selected marks records deleted successfully" });
      setSelectedMarksIds([]);
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

  // Client-side filtering removed in favor of server-side search
  // const filteredData = marks.filter(...) 

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Marks Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Upload and manage student marks</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedMarksIds.length === 0) return;
              setDeleteConfig({
                title: "Delete Selected Marks",
                description: `Are you sure you want to delete ${selectedMarksIds.length} selected marks records? This action cannot be undone.`,
                action: () => batchDeleteMutation.mutate(selectedMarksIds)
              });
              setShowDeleteConfirm(true);
            }}
            disabled={selectedMarksIds.length === 0 || batchDeleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            Delete Selected
          </Button>
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
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end flex-shrink-0">
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
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-9 px-4 flex items-center gap-2">
               <InfinityIcon className="h-4 w-4" />
               <span>Infinity Mode Active</span>
            </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          title="Marks Records"
          description={`Showing all ${filteredData.length} records`}
          columns={columns}
          data={filteredData}
          actions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectableRows={true}
          selectedRowIds={selectedMarksIds}
          getRowId={(row: any) => row.id}
          onToggleRow={(row: any) => {
            setSelectedMarksIds((prev) =>
              prev.includes(row.id)
                ? prev.filter((id) => id !== row.id)
                : [...prev, row.id]
            );
          }}
          onToggleAll={() => {
            const allIds = filteredData.map((record: any) => record.id);
            const allSelected = allIds.every((id: number) => selectedMarksIds.includes(id));
            setSelectedMarksIds(allSelected ? [] : allIds);
          }}
          enableVirtualization={true}
        />
      </div>

      <AddMarksDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        branchId={branchId}
        department={department}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/marks")) });
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/students")) });
        }}
      />

      <EditMarksDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        marks={selectedItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/marks")) });
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/students")) });
        }}
      />

      <BatchMarksDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        branchId={branchId}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/marks")) });
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/students")) });
        }}
      />

      <UploadMarksCSVDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ predicate: (query) => query.queryKey.some(k => typeof k === 'string' && k.includes("/api/marks")) });
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
