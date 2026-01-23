import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCog, Building2, Eye, EyeOff, BookOpen, Users, Award, Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import LogoWithFallback from "@/components/common/LogoWithFallback";

interface LoginPageProps {
  onLogin: (role: 'admin' | 'student', user: any) => void;
  showSuperAdmin?: boolean;
  onShowSuperAdmin?: () => void;
}

export default function LoginPage({ onLogin, showSuperAdmin, onShowSuperAdmin }: LoginPageProps) {
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
        title: "Missing Information",
        description: "Please fill in all fields to continue",
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
        title: "Welcome Back!",
        description: "Successfully logged in as administrator",
        duration: 3000,
      });
      onLogin('admin', data.user);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentRollNo || !studentPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue",
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
        title: "Welcome Back!",
        description: "Successfully logged in as student",
        duration: 3000,
      });
      onLogin('student', data.user);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Subtle background decoration to ensure white-on-white visibility */}
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
      
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 lg:gap-12 items-center relative z-10">
        {/* Left Side - Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex flex-col items-center justify-center space-y-8 p-8"
        >
          <div className="relative hover-lift">
            <div className="absolute inset-0 bg-linear-to-r from-primary/30 via-purple-500/20 to-pink-500/30 blur-3xl rounded-full animate-pulse"></div>
            <LogoWithFallback
              src="/logo.jpeg?v=1"
              alt="KNSGP College Logo"
              className="relative h-40 w-40 lg:h-56 lg:w-56 object-contain rounded-3xl shadow-2xl border-2 border-primary/20 smooth-transition bg-white/80 backdrop-blur-sm"
              width={224}
              height={224}
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
            <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground bg-white/60 px-3 py-1.5 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Government Institution</span>
            </div>
            <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground bg-white/60 px-3 py-1.5 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
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
                <LogoWithFallback
                  src="/logo.jpeg?v=1"
                  alt="KNSGP College Logo"
                  className="relative h-28 w-28 object-contain rounded-2xl shadow-xl border-2 border-primary/20 smooth-transition bg-white/80 backdrop-blur-sm"
                  width={112}
                  height={112}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">KNSGP College Portal</h1>
            <p className="text-base text-muted-foreground smooth-transition">Student Management System</p>
          </div>

          <Card className="border border-gray-200 shadow-2xl bg-white hover:shadow-3xl transition-all duration-300 overflow-hidden relative z-10 ring-1 ring-gray-900/5">
              <div className="h-1 bg-linear-to-r from-primary via-purple-600 to-pink-600"></div>
              
              <CardHeader className="space-y-3 pb-6 text-center md:text-left">
              <CardTitle className="text-3xl font-bold smooth-transition text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-base smooth-transition text-gray-600">Sign in to access your portal dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-gray-100 rounded-xl">
                  <TabsTrigger value="student" data-testid="tab-student" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all rounded-lg text-gray-700 data-[state=active]:text-gray-900">
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="admin" data-testid="tab-admin" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all rounded-lg text-gray-700 data-[state=active]:text-gray-900">
                    <UserCog className="h-4 w-4" />
                    Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="space-y-6 mt-0">
                  <motion.form 
                    onSubmit={handleStudentLogin} 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="student-rollno" className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Roll Number
                      </Label>
                      <Input
                        id="student-rollno"
                        placeholder="e.g., 2023-CSE-01"
                        value={studentRollNo}
                        onChange={(e) => setStudentRollNo(e.target.value)}
                        disabled={isLoading}
                        className="h-12 bg-gray-50 border-gray-200 focus:ring-primary/20 transition-all text-base text-gray-900 placeholder:text-gray-400"
                        autoComplete="username"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="student-password" className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Password
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showStudentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </Label>
                      <Input
                        id="student-password"
                        type={showStudentPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 bg-gray-50 border-gray-200 focus:ring-primary/20 transition-all text-base text-gray-900 placeholder:text-gray-400"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Login as Student
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                </TabsContent>
                <TabsContent value="admin" className="space-y-6 mt-0">
                  <motion.form 
                    onSubmit={handleAdminLogin} 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="admin-username" className="text-sm font-medium flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Username
                      </Label>
                      <Input
                        id="admin-username"
                        placeholder="Enter admin username"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        disabled={isLoading}
                        className="h-12 bg-gray-50 border-gray-200 focus:ring-primary/20 transition-all text-base text-gray-900 placeholder:text-gray-400"
                        autoComplete="username"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-password" className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Password
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </Label>
                      <Input
                        id="admin-password"
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 bg-gray-50 border-gray-200 focus:ring-primary/20 transition-all text-base text-gray-900 placeholder:text-gray-400"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Login as Admin
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                  <p className="text-xs text-center text-muted-foreground">
                    Admin access only • Contact administrator for credentials
                  </p>
                </TabsContent>

                {/* Security Indicator */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Secure & Encrypted Connection</span>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
