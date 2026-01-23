
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SuperAdminLoginProps {
  onLogin: (role: 'admin', user: any) => void;
}

export default function SuperAdminLogin({ onLogin }: SuperAdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
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
        username,
        password,
        role: 'admin'
      });

      const data = await response.json();
      
      // Strict Check: Only allow if adminRole is 'super_admin'
      if (data.user.adminRole !== 'super_admin') {
        throw new Error("Access Denied: You do not have Super Admin privileges.");
      }

      toast({
        title: "Access Granted",
        description: "Welcome back, Super Admin.",
      });
      onLogin('admin', data.user);
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid credentials or unauthorized access.",
        variant: "destructive",
      });
      // Logout immediately if login succeeded but role check failed (to clear session)
      if (error.message?.includes("Access Denied")) {
        await apiRequest("POST", "/api/logout");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 sm:p-6 md:p-8">
      {/* Dark themed background for "Hidden/Secret" feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950"></div>
      
      <div className="w-full max-w-md relative z-10 fade-in">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-red-500/10 mb-4 ring-1 ring-red-500/20">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Restricted Access</h1>
          <p className="text-zinc-400">Super Admin Clearance Required</p>
        </div>

        <Card className="border-red-900/20 bg-zinc-900/50 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="space-y-1 pb-6 border-b border-white/5">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-500" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your super admin credentials to proceed
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300">Username</Label>
                <Input
                  id="username"
                  placeholder="Super Admin ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-red-500/20"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 pr-10 focus:border-red-500/50 focus:ring-red-500/20"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute! right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11 shadow-lg shadow-red-900/20 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Verifying Clearance..." : "Authenticate"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-zinc-600 mt-6">
          Unauthorized access attempts are monitored and logged.
          <br />
          System ID: KNSGP-SECURE-V1
        </p>
      </div>
    </div>
  );
}
