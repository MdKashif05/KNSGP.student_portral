import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCog } from "lucide-react";

interface LoginPageProps {
  onLogin: (role: 'admin' | 'student', username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [studentRollNo, setStudentRollNo] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!adminUsername || !adminPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    console.log("Admin login:", adminUsername);
    onLogin('admin', adminUsername);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!studentRollNo || !studentPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    console.log("Student login:", studentRollNo);
    onLogin('student', studentRollNo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">CSE Student Portal</h1>
          <p className="text-muted-foreground mt-2">Kameshwar Narayan Singh Govt Polytechnic College</p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student" data-testid="tab-student">
              <GraduationCap className="h-4 w-4 mr-2" />
              Student
            </TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admin">
              <UserCog className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Login</CardTitle>
                <CardDescription>Enter your roll number and name to access your portal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-rollno">Roll Number</Label>
                    <Input
                      id="student-rollno"
                      data-testid="input-student-rollno"
                      placeholder="e.g., 2023-CSE-01"
                      value={studentRollNo}
                      onChange={(e) => setStudentRollNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password (Your Name)</Label>
                    <Input
                      id="student-password"
                      data-testid="input-student-password"
                      type="password"
                      placeholder="Enter your name"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-error" data-testid="text-error">{error}</p>}
                  <Button type="submit" className="w-full" data-testid="button-student-login">
                    Login as Student
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Enter your credentials to access the admin panel</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      data-testid="input-admin-username"
                      placeholder="Enter your name"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      data-testid="input-admin-password"
                      type="password"
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-error" data-testid="text-error">{error}</p>}
                  <Button type="submit" className="w-full" data-testid="button-admin-login">
                    Login as Admin
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
