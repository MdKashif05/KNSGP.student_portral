import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Calendar as CalendarIcon, Loader2, Check, X, BookOpen, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AttendanceManagement({ department, branchId, batchId }: { department?: string, branchId?: number, batchId?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [date, setDate] = useState<Date>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({}); // studentId -> status
  const [isModified, setIsModified] = useState(false);

  // Fetch Subjects
  const { data: subjects = [] } = useQuery<any[]>({ 
    queryKey: [`/api/subjects${branchId ? `?branchId=${branchId}` : department ? `?department=${department}` : "?"}${batchId ? `&batchId=${batchId}` : ""}`] 
  });

  // Fetch Students (All active students for this branch)
  const { data: studentsResponse, isLoading: isLoadingStudents } = useQuery<any>({ 
    queryKey: [`/api/students?limit=1000${branchId ? `&branchId=${branchId}` : department ? `&department=${department}` : ""}${batchId ? `&batchId=${batchId}` : ""}`],
    staleTime: 5 * 60 * 1000, // 5 minutes stale time to avoid constant refetches
    refetchOnWindowFocus: false // Disable window focus refetching to prevent state resets
  });
  const students = studentsResponse?.data || [];

  // Fetch Existing Attendance for Date + Subject
  const { data: existingAttendance = [], isLoading: isLoadingAttendance, refetch: refetchAttendance, isFetching: isFetchingAttendance } = useQuery<any[]>({
    queryKey: [`/api/attendance/daily?date=${format(date, 'yyyy-MM-dd')}&subjectId=${selectedSubject}`],
    enabled: !!selectedSubject && !!date,
  });

  // Clear attendance map when date or subject changes to avoid showing stale data
  useEffect(() => {
    setAttendanceMap({});
    setIsModified(false);
  }, [date, selectedSubject]);

  // Sync existing attendance to local state
  useEffect(() => {
    // Only update state if we have students and haven't modified local state
    // We wait for loading to finish to avoid overwriting with defaults
    if (isLoadingAttendance || isFetchingAttendance) return;

    if (students.length > 0 && !isModified && selectedSubject) {
      const newMap: Record<number, string> = {};
      const formattedDate = format(date, 'yyyy-MM-dd');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = formattedDate === todayStr;
      
      students.forEach((student: any) => {
        const sId = Number(student.id);
        // existingAttendance might be empty if no records, that's fine.
        const record = existingAttendance?.find((r: any) => Number(r.studentId) === sId);
        
        if (record) {
          newMap[sId] = record.status;
        }
        // For past dates with no record, we leave it undefined (Not Marked)
      });
      setAttendanceMap(newMap);
    }
  }, [existingAttendance, students, date, isModified, isLoadingAttendance, isFetchingAttendance]);

  // Mutation to Save
  const saveMutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await apiRequest("POST", "/api/attendance/daily", { records });
      return res.json();
    },
    onSuccess: (savedRecords) => {
      // Manually update the cache to prevent race conditions and ensure UI updates immediately
      const queryKey = [`/api/attendance/daily?date=${format(date, 'yyyy-MM-dd')}&subjectId=${selectedSubject}`];
      queryClient.setQueryData(queryKey, savedRecords);
      
      toast({ title: "Success", description: "Attendance saved successfully" });
      setIsModified(false);
      // We don't need to refetch immediately because we updated the cache, 
      // but invalidating ensures eventual consistency
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (studentId: number, status: string) => {
    // Only allow editing for Today
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    
    if (selectedDateStr !== todayStr) {
       toast({ title: "Read Only", description: "You can only edit attendance for today.", variant: "destructive" });
       return;
    }

    setAttendanceMap(prev => ({
      ...prev,
      [Number(studentId)]: status
    }));
    setIsModified(true);
  };

  const handleSave = () => {
    if (!selectedSubject) {
      toast({ title: "Error", description: "Please select a subject first", variant: "destructive" });
      return;
    }

    const records = students.map((student: any) => {
      const sId = Number(student.id);
      const currentStatus = attendanceMap[sId];
      
      // CRITICAL FIX: Ensure 'absent' status is preserved and not overwritten by default 'present'
      // If the student is in the map, use that status.
      // If NOT in the map (unlikely if fetched correctly, but possible for new students), default to 'present'.
      // const finalStatus = currentStatus !== undefined ? currentStatus : 'present';
      
      if (!currentStatus) return null;

      return {
        studentId: sId,
        subjectId: parseInt(selectedSubject),
        date: format(date, 'yyyy-MM-dd'),
        status: currentStatus
      };
    }).filter(Boolean);

    if (records.length === 0) {
      toast({ title: "Warning", description: "No attendance marked to save", variant: "destructive" });
      return;
    }

    // Debug: Log what we are saving
    const absentCount = records.filter((r: any) => r.status === 'absent').length;
    console.log("Saving records:", { total: records.length, absent: absentCount });

    saveMutation.mutate(records);
  };

  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Calculate stats
  const totalPresent = Object.values(attendanceMap).filter(s => s === 'present').length;
  const totalAbsent = Object.values(attendanceMap).filter(s => s === 'absent').length;

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Daily Attendance</h2>
          <p className="text-sm text-muted-foreground">Mark attendance by date and subject</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
           {/* Date Picker */}
           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-50 justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Subject Selector */}
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-62.5">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((sub: any) => (
                <SelectItem key={sub.id} value={sub.id.toString()}>
                  {sub.name} ({sub.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col min-h-0 border-t-4 border-t-primary/20">
        <CardHeader className="pb-3 border-b">
           <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
               <CardTitle className="text-lg">
                {selectedSubject ? subjects.find((s: any) => s.id.toString() === selectedSubject)?.name : "Select a Subject"}
              </CardTitle>
              {students.length > 0 && selectedSubject && (
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Present: {totalPresent}</Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">Absent: {totalAbsent}</Badge>
                </div>
              )}
            </div>
             
             <div className="flex items-center gap-3">
               <div className="relative w-64">
                 <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search students..." 
                   className="pl-8 h-9" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               
               <Button 
                onClick={handleSave} 
                disabled={!selectedSubject || !isToday || saveMutation.isPending || !isModified}
                className={cn("gap-2 transition-all duration-300", isModified && "shadow-lg scale-105")}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Attendance
              </Button>
             </div>
           </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-0">
          {!selectedSubject ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-20" />
              <p>Please select a subject to view/mark attendance</p>
            </div>
          ) : isLoadingStudents || isLoadingAttendance ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <User className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No students found</p>
              <p className="max-w-xs mt-2 text-sm">
                If you expected students here, check if you selected the correct <strong>Batch</strong> in the dashboard.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/90 backdrop-blur sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium sticky left-0 z-30 bg-muted/90 backdrop-blur border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Roll No</th>
                  <th className="px-6 py-3 font-medium">Student Name</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student: any) => {
                  const status = attendanceMap[student.id];
                  const isPresent = status === 'present';
                  
                  return (
                    <tr 
                      key={student.id} 
                      className={cn(
                        "hover:bg-muted/50 transition-colors group",
                        !isPresent && "bg-red-50/50 dark:bg-red-900/10"
                      )}
                    >
                      <td className={cn(
                        "px-6 py-4 font-mono sticky left-0 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors",
                        !isPresent ? "bg-red-50 dark:bg-red-900/20" : "bg-background",
                        "group-hover:bg-muted/50"
                      )}>{student.rollNo}</td>
                      <td className="px-6 py-4 font-medium">{student.name}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant={status === 'present' ? "default" : "outline"}
                            className={cn(
                              "w-24 gap-2",
                              status === 'present' ? "bg-green-600 hover:bg-green-700" : "text-muted-foreground hover:text-green-600 border-green-200"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(student.id, 'present');
                            }}
                            disabled={!isToday}
                          >
                            <Check className="h-4 w-4" /> Present
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={status === 'absent' ? "destructive" : "outline"}
                            className={cn(
                              "w-24 gap-2",
                              status === 'absent' ? "bg-red-600 hover:bg-red-700" : "text-muted-foreground hover:text-red-600 border-red-200"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(student.id, 'absent');
                            }}
                            disabled={!isToday}
                          >
                            <X className="h-4 w-4" /> Absent
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
