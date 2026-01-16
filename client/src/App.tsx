import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import Chatbot from "@/components/layout/Chatbot";

function App() {
  const [user, setUser] = useState<{ 
    role: 'admin' | 'student' | null; 
    id: number | null;
    name: string | null;
    rollNo?: string | null;
    branchId?: number | null;
    adminRole?: 'admin' | 'super_admin' | null;
  }>({
    role: null,
    id: null,
    name: null,
    adminRole: null
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser({
            role: data.role,
            id: data.id,
            name: data.name,
            rollNo: data.rollNo || null,
            branchId: data.branchId || null,
            adminRole: data.adminRole || null,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (role: 'admin' | 'student', userData: any) => {
    setUser({ 
      role, 
      id: userData.id,
      name: userData.name,
      rollNo: userData.rollNo,
      branchId: userData.branchId,
      adminRole: userData.adminRole || null,
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser({ role: null, id: null, name: null, adminRole: null });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!user.role ? (
          <LoginPage onLogin={handleLogin} />
        ) : user.role === 'admin' ? (
          <AdminDashboard adminName={user.name!} adminRole={user.adminRole} onLogout={handleLogout} />
        ) : (
          <StudentDashboard 
            studentName={user.name!} 
            rollNo={user.rollNo!}
            studentId={user.id!}
            branchId={user.branchId}
            onLogout={handleLogout} 
          />
        )}
        
        {/* Chatbot - Always at root level for proper mobile positioning */}
        {user.role && <Chatbot />}
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
