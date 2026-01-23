import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, ArrowRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface SuperAdminLoginProps {
  onLogin: (role: 'admin', user: any) => void;
  onBack: () => void;
}

export default function SuperAdminLogin({ onLogin, onBack }: SuperAdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
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
        username: username.trim(),
        password: password.trim(),
        role: 'admin'
      });

      const data = await response.json();

      // Check if the user is actually a super_admin
      if (data.user?.adminRole !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "You don't have super admin privileges",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      toast({
        title: "Welcome Super Admin!",
        description: "Successfully logged in with elevated privileges",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/20 shadow-2xl backdrop-blur-xl bg-slate-950/90 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"></div>
          
          <CardHeader className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Super Admin Access
                </CardTitle>
                <CardDescription className="text-purple-200/70">
                  Elevated privileges required
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-sm text-amber-200">
                This area is restricted to authorized super administrators only
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <motion.form 
              onSubmit={handleSuperAdminLogin} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-2">
                <Label htmlFor="superadmin-username" className="text-sm font-medium flex items-center gap-2 text-purple-200">
                  <Shield className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="superadmin-username"
                  placeholder="Enter super admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-slate-800/50 border-slate-700 focus:ring-purple-500/50 transition-all text-base text-white placeholder:text-slate-400"
                  autoComplete="username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="superadmin-password" className="text-sm font-medium flex items-center justify-between text-purple-200">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Label>
                <Input
                  id="superadmin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter super admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-slate-800/50 border-slate-700 focus:ring-purple-500/50 transition-all text-base text-white placeholder:text-slate-400"
                  autoComplete="current-password"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  Back to Login
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Access Portal
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>All connections are encrypted and monitored</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}