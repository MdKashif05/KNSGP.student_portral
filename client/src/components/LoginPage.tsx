import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCog, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import collegeLogo from "@assets/WhatsApp Image 2025-10-11 at 23.32.21_1760206203929.jpeg";

interface LoginPageProps {
  onLogin: (role: 'admin' | 'student', user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [studentRollNo, setStudentRollNo] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminUsername || !adminPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", {
        username: adminUsername,
        password: adminPassword,
        role: 'admin'
      });

      const data = await response.json();

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      onLogin('admin', data.user);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentRollNo || !studentPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", {
        username: studentRollNo,
        password: studentPassword,
        role: 'student'
      });

      const data = await response.json();

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      onLogin('student', data.user);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <img 
              src={collegeLogo} 
              alt="KNSGP College Logo" 
              className="relative h-48 w-48 object-contain rounded-2xl shadow-2xl"
              data-testid="img-college-logo"
            />
          </div>
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              KNSGP College
            </h1>
            <p className="text-xl font-semibold text-foreground">Computer Science & Engineering</p>
            <p className="text-muted-foreground max-w-md">
              Kameshwar Narayan Singh Govt Polytechnic College Student Portal
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Government Institution</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>Excellence in Education</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src={collegeLogo} 
                alt="KNSGP College Logo" 
                className="h-24 w-24 object-contain rounded-xl shadow-lg"
                data-testid="img-college-logo-mobile"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">KNSGP College Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Computer Science & Engineering</p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your portal dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="student" data-testid="tab-student" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="admin" data-testid="tab-admin" className="gap-2">
                    <UserCog className="h-4 w-4" />
                    Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="space-y-4 mt-0">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-rollno" className="text-sm font-medium">Roll Number</Label>
                      <Input
                        id="student-rollno"
                        data-testid="input-student-rollno"
                        placeholder="e.g., 2023-CSE-01"
                        value={studentRollNo}
                        onChange={(e) => setStudentRollNo(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        autoComplete="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="student-password"
                        data-testid="input-student-password"
                        type="password"
                        placeholder="Enter your name"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-medium" 
                      data-testid="button-student-login" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login as Student"}
                    </Button>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">
                    Use your roll number and name as password to access your dashboard
                  </p>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4 mt-0">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-username" className="text-sm font-medium">Username</Label>
                      <Input
                        id="admin-username"
                        data-testid="input-admin-username"
                        placeholder="Enter admin username"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        autoComplete="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="admin-password"
                        data-testid="input-admin-password"
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-medium" 
                      data-testid="button-admin-login" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login as Admin"}
                    </Button>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">
                    Admin access only - Contact administrator for credentials
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
