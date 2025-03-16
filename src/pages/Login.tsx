
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronRight, Database, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Checkbox } from '@/components/ui/checkbox';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Check for stored username in localStorage
    const storedUser = localStorage.getItem('rememberedUser');
    if (storedUser) {
      setUsername(storedUser);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simple hardcoded authentication for testing
      if (username === 'user' && password === 'password') {
        await login(username, password);
        
        // Store username if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedUser', username);
        } else {
          localStorage.removeItem('rememberedUser');
        }
        
        toast({
          title: "Login successful",
          description: `Welcome ${username}`,
        });
        
        navigate('/');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please use username: user and password: password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 p-4 transition-colors duration-500">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 dark:opacity-10 bg-[radial-gradient(circle_500px_at_top_left,hsl(var(--primary-foreground)/15),transparent)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full opacity-20 dark:opacity-10 bg-[radial-gradient(circle_500px_at_bottom_right,hsl(var(--primary-foreground)/15),transparent)]"></div>
        
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-200/20 dark:bg-blue-500/5 blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-300/20 dark:bg-indigo-600/5 blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-full shadow-md mb-4 animate-scale-in transition-all duration-300 hover:shadow-lg">
            <Database className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white transition-colors duration-300">Data Editor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors duration-300">Internal data management platform</p>
        </div>
        
        <Card className="shadow-xl border-opacity-30 dark:border-opacity-20 dark:bg-slate-800/90 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl animate-scale-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight transition-colors duration-300">Sign In</CardTitle>
            <CardDescription className="transition-colors duration-300">
              Use your internal credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="username" className="transition-colors duration-300">Username</Label>
                <div className="relative transition-all duration-200 group-focus-within:scale-[1.01]">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="transition-colors duration-300">Password</Label>
                </div>
                <div className="relative transition-all duration-200 group-focus-within:scale-[1.01]">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 transition-colors duration-200"
                  />
                  <label 
                    htmlFor="remember" 
                    className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300 cursor-pointer select-none"
                  >
                    Remember username
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 transition-colors duration-300">For testing: username is "user" and password is "password"</p>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]" 
              type="submit" 
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Version number in footer */}
        <footer className="text-center mt-6 text-xs text-blue-600/60 dark:text-blue-400/60 transition-colors duration-300">
          <p>Data Editor <span className="font-semibold">v1.2.3</span> &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
