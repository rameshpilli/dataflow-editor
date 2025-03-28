
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronRight, Database, Lock, User, Sparkles, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'local' | 'ldap'>('local');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

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
      if (loginMethod === 'ldap') {
        // LDAP authentication flow
        await login(username, password, 'ldap');
        toast({
          title: "LDAP login successful",
          description: `Welcome ${username}`,
        });
        navigate('/');
      } else {
        // Simple hardcoded authentication for testing
        if (username === 'user' && password === 'password') {
          await login(username, password, 'local');
          
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
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: loginMethod === 'ldap' 
          ? "LDAP authentication failed. Please check your credentials."
          : "Please use username: user and password: password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-900 dark:via-indigo-950/40 dark:to-purple-950/60 p-4 transition-colors duration-500">
      {/* Background patterns and decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30 mix-blend-multiply dark:mix-blend-soft-light">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-200/40 to-blue-300/30 dark:from-blue-800/10 dark:to-blue-700/5 blur-3xl transform rotate-12"></div>
          <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-purple-200/40 to-indigo-200/30 dark:from-purple-900/10 dark:to-indigo-900/5 blur-3xl transform -rotate-12"></div>
        </div>
        
        {/* Animated geometric shapes */}
        <div className="absolute top-20 right-20 opacity-40 dark:opacity-20">
          <div className="relative w-6 h-6 rounded-full bg-blue-400 dark:bg-blue-500 animate-bounce-subtle"></div>
        </div>
        <div className="absolute bottom-32 left-32 opacity-40 dark:opacity-20">
          <div className="relative w-8 h-8 rounded-md bg-indigo-400 dark:bg-indigo-500 animate-pulse-subtle"></div>
        </div>
        <div className="absolute top-1/2 left-[15%] opacity-40 dark:opacity-20">
          <div className="relative w-4 h-4 rounded-full bg-purple-400 dark:bg-purple-500 animate-bounce-subtle" style={{animationDelay: '0.5s'}}></div>
        </div>
      </div>

      {/* Theme toggle button */}
      <div className="absolute top-4 right-4 z-50">
        <Toggle 
          pressed={theme === 'dark'} 
          onPressedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
          className="bg-white/10 backdrop-blur-sm border border-blue-100/20 dark:border-blue-900/30 hover:bg-white/20 dark:hover:bg-slate-800/40"
        >
          {theme === 'dark' ? 
            <Sun className="h-4 w-4 text-blue-100" /> : 
            <Moon className="h-4 w-4 text-blue-600" />}
        </Toggle>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="relative inline-block group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-400/10 dark:from-blue-400/5 dark:to-indigo-400/5 blur-xl group-hover:blur-lg transition-all duration-700"></div>
            <div className="relative p-4 bg-white dark:bg-slate-800 shadow-lg rounded-full mb-4 animate-scale-in transition-all duration-300 hover:shadow-xl group-hover:scale-105 border border-blue-100/80 dark:border-blue-900/30">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 opacity-80"></div>
              <Database className="relative h-12 w-12 text-blue-600 dark:text-blue-400" />
              <div className="absolute -right-1 -top-1 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-md border border-blue-100 dark:border-blue-900/40">
                <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white transition-colors duration-300 tracking-tight">Data Editor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors duration-300">Internal data management platform</p>
        </div>
        
        <Card className="overflow-hidden border-opacity-30 dark:border-opacity-20 dark:bg-slate-800/90 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl animate-scale-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-50 transition-colors duration-300">Sign In</CardTitle>
            <CardDescription className="transition-colors duration-300">
              Use your internal credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4 rounded-md overflow-hidden border border-blue-100 dark:border-blue-900/50">
              <Button
                type="button"
                variant="ghost"
                className={`flex-1 rounded-none py-2 ${loginMethod === 'local' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                onClick={() => setLoginMethod('local')}
              >
                Local Login
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={`flex-1 rounded-none py-2 ${loginMethod === 'ldap' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                onClick={() => setLoginMethod('ldap')}
              >
                LDAP Login
              </Button>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="username" className="transition-colors duration-300 text-blue-900/80 dark:text-blue-100/80">Username</Label>
                <div className="relative transition-all duration-200 group-focus-within:scale-[1.01]">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-blue-400 dark:text-blue-500 transition-colors duration-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="transition-colors duration-300 text-blue-900/80 dark:text-blue-100/80">Password</Label>
                </div>
                <div className="relative transition-all duration-200 group-focus-within:scale-[1.01]">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-blue-400 dark:text-blue-500 transition-colors duration-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
                
                {loginMethod === 'local' && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 transition-colors duration-200"
                    />
                    <label 
                      htmlFor="remember" 
                      className="text-sm text-blue-700 dark:text-blue-300 transition-colors duration-300 cursor-pointer select-none"
                    >
                      Remember username
                    </label>
                  </div>
                )}
                
                {loginMethod === 'local' && (
                  <p className="text-xs text-blue-500/70 dark:text-blue-400/70 italic mt-1 transition-colors duration-300">For testing: username is "user" and password is "password"</p>
                )}
                {loginMethod === 'ldap' && (
                  <p className="text-xs text-blue-500/70 dark:text-blue-400/70 italic mt-1 transition-colors duration-300">Use your corporate AD credentials</p>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="pb-6">
            <Button 
              className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50" 
              type="submit" 
              onClick={handleLogin}
              disabled={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center">
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
                    Sign In with {loginMethod === 'ldap' ? 'LDAP' : 'Local Account'}
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </span>
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
