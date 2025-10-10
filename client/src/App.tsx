import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import LoginPage from "@/components/LoginPage";
import AdminDashboard from "@/components/AdminDashboard";
import StudentDashboard from "@/components/StudentDashboard";

function App() {
  const [user, setUser] = useState<{ role: 'admin' | 'student' | null; username: string | null }>({
    role: null,
    username: null
  });

  const handleLogin = (role: 'admin' | 'student', username: string) => {
    setUser({ role, username });
  };

  const handleLogout = () => {
    setUser({ role: null, username: null });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!user.role ? (
          <LoginPage onLogin={handleLogin} />
        ) : user.role === 'admin' ? (
          <AdminDashboard adminName={user.username!} onLogout={handleLogout} />
        ) : (
          <StudentDashboard 
            studentName={user.username!} 
            rollNo={user.username!}
            onLogout={handleLogout} 
          />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
