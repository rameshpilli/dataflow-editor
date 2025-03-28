
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Database, LogOut, Moon, Sun, User, ChevronDown, Settings, UserPlus, Users } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { APP_VERSION, APP_NAME } from '@/constants/appInfo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const { user, logout, addUser, getUsers, isAuthorized } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [usersList, setUsersList] = useState<Array<{username: string, role?: string}>>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Get users on load
  useEffect(() => {
    setUsersList(getUsers());
  }, [getUsers]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update time every minute
    
    return () => clearInterval(timer);
  }, []);

  const handleAddUser = async () => {
    try {
      await addUser(newUsername, newPassword, newRole);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setIsUserDialogOpen(false);
      setUsersList(getUsers());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <header className="w-full bg-background border-b shadow-sm px-6 py-3 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Data Editor</h1>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <div className="text-sm text-muted-foreground hidden md:block">
            {currentTime.toLocaleDateString()} | {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className="mr-2"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {user && isAuthorized(['Administrators']) && (
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mr-2">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Add User</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for the Data Editor platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <select
                      id="role"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleAddUser}>
                    Add User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline ml-1 mr-1">{user?.username}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <Badge className="ml-auto" variant="outline">
                  {user?.role || 'User'}
                </Badge>
              </DropdownMenuItem>
              
              {user && isAuthorized(['Administrators']) && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Users className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuLabel>System Users</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {usersList.map((usr) => (
                        <DropdownMenuItem key={usr.username}>
                          <span>{usr.username}</span>
                          <Badge className="ml-auto" variant="outline">
                            {usr.role}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
              
              <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 font-mono px-2 py-0.5">
                  {APP_VERSION}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
