import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import LoginPage from "@/components/LoginPage";
import AdminDashboard from "@/components/AdminDashboard";
import StudentDashboard from "@/components/StudentDashboard";

function App() {
  const [user, setUser] = useState<{ 
    role: 'admin' | 'student' | null; 
    id: number | null;
    name: string | null;
    rollNo?: string | null;
  }>({
    role: null,
    id: null,
    name: null,
  });

  const handleLogin = (role: 'admin' | 'student', userData: any) => {
    setUser({ 
      role, 
      id: userData.id,
      name: userData.name,
      rollNo: userData.rollNo 
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser({ role: null, id: null, name: null });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!user.role ? (
          <LoginPage onLogin={handleLogin} />
        ) : user.role === 'admin' ? (
          <AdminDashboard adminName={user.name!} onLogout={handleLogout} />
        ) : (
          <StudentDashboard 
            studentName={user.name!} 
            rollNo={user.rollNo!}
            studentId={user.id!}
            onLogout={handleLogout} 
          />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
