import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCog, Building2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface LoginPageProps {
  onLogin: (role: 'admin' | 'student', user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [studentRollNo, setStudentRollNo] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 lg:gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex flex-col items-center justify-center space-y-8 p-8"
        >
          <div className="relative hover-lift">
            <div className="absolute inset-0 bg-linear-to-r from-primary/30 via-purple-500/20 to-pink-500/30 blur-3xl rounded-full animate-pulse"></div>
            <img
            src="/logo.jpeg?v=1"
            alt="KNSGP College Logo"
            className="relative h-40 w-40 lg:h-56 lg:w-56 object-contain rounded-3xl shadow-2xl border-2 border-primary/20 smooth-transition bg-white/50 backdrop-blur-sm"
            data-testid="img-college-logo"
          />
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold gradient-text">
              KNSGP College
            </h1>
            <p className="text-xl lg:text-2xl font-semibold text-foreground smooth-transition">Student Management System</p>
            <p className="text-muted-foreground max-w-md text-base lg:text-lg smooth-transition">
              Kameshwar Narayan Singh Govt Polytechnic College
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground bg-white/40 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Government Institution</span>
            </div>
            <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground bg-white/40 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Excellence in Education</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative hover-lift">
                <div className="absolute inset-0 bg-linear-to-r from-primary/30 to-purple-500/30 blur-2xl rounded-full animate-pulse"></div>
                <img
                  src="/logo.jpeg?v=1"
                  alt="KNSGP College Logo"
                  className="relative h-28 w-28 object-contain rounded-2xl shadow-xl border-2 border-primary/20 smooth-transition bg-white/50 backdrop-blur-sm"
                  data-testid="img-college-logo-mobile"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">KNSGP College Portal</h1>
            <p className="text-base text-muted-foreground smooth-transition">Student Management System</p>
          </div>

          <Card className="border-2 border-primary/10 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 hover:shadow-primary/5 transition-all duration-500">
            <CardHeader className="space-y-2 pb-6 text-center md:text-left">
              <CardTitle className="text-3xl font-bold smooth-transition">Welcome Back</CardTitle>
              <CardDescription className="text-base smooth-transition">Sign in to access your portal dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-slate-100/50 dark:bg-slate-800/50">
                  <TabsTrigger value="student" data-testid="tab-student" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-md transition-all">
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="admin" data-testid="tab-admin" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-md transition-all">
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
                        placeholder="e.g., 2023-CSE-01"
                        value={studentRollNo}
                        onChange={(e) => setStudentRollNo(e.target.value)}
                        disabled={isLoading}
                        className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20 transition-all"
                        autoComplete="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="student-password"
                          type={showStudentPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          disabled={isLoading}
                          className="h-11 pr-10 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20 transition-all"
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                        >
                          {showStudentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login as Student"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4 mt-0">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-username" className="text-sm font-medium">Username</Label>
                      <Input
                        id="admin-username"
                        placeholder="Enter admin username"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        disabled={isLoading}
                        className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20 transition-all"
                        autoComplete="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="admin-password"
                          type={showAdminPassword ? "text" : "password"}
                          placeholder="Enter admin password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          disabled={isLoading}
                          className="h-11 pr-10 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20 transition-all"
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                        >
                          {showAdminPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login as Admin"}
                    </Button>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">
                    Admin access only • Contact administrator for credentials
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
