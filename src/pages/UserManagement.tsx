
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/utils/permissions';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2, ShieldAlert, UserCheck, UserX, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const UserManagement = () => {
  const { user, getUsers, addUser, removeUser } = useAuth();
  const { can, isAdmin } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<Array<{username: string, role?: string, groups?: string[]}>>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [selectedGroups, setSelectedGroups] = useState<{[key: string]: boolean}>({
    'Users': true,
    'DataEditors': false,
    'ADLSUsers': false,
    'Administrators': false
  });

  // Check permissions
  useEffect(() => {
    if (!can('manage_users')) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to manage users",
      });
      navigate('/');
    }
  }, [can, navigate, toast]);

  // Load users
  useEffect(() => {
    setUsers(getUsers());
  }, [getUsers]);

  const handleAddUser = async () => {
    try {
      // Create groups array from selectedGroups
      const groups = Object.entries(selectedGroups)
        .filter(([_, isSelected]) => isSelected)
        .map(([group]) => group);
      
      await addUser(newUsername, newPassword, newRole);
      
      // Reset form
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setSelectedGroups({
        'Users': true,
        'DataEditors': false,
        'ADLSUsers': false,
        'Administrators': false
      });
      
      setIsAddDialogOpen(false);
      setUsers(getUsers());
      
      toast({
        title: "User added",
        description: `User ${newUsername} has been added successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleRemoveUser = async (username: string) => {
    try {
      if (username === user?.username) {
        toast({
          variant: "destructive",
          title: "Cannot remove yourself",
          description: "You cannot remove your own user account",
        });
        return;
      }
      
      await removeUser(username);
      setUsers(getUsers());
      
      toast({
        title: "User removed",
        description: `User ${username} has been removed successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 transition-colors duration-500">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">
              User Management
            </h1>
            <p className="text-blue-600/80 dark:text-blue-400/80 max-w-3xl">
              Manage users and permissions for the Data Editor platform
            </p>
          </div>
          
          <Card className="mb-6 border-blue-100/50 dark:border-blue-900/30">
            <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-medium text-blue-800 dark:text-blue-200">
                  User Accounts
                </CardTitle>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      
                      <div className="col-span-4 mt-2">
                        <Label className="text-sm font-medium mb-2 block">Groups</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(selectedGroups).map(([group, isSelected]) => (
                            <div key={group} className="flex items-center space-x-2">
                              <Switch
                                id={`group-${group}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setSelectedGroups(prev => ({
                                    ...prev,
                                    [group]: checked
                                  }));
                                }}
                              />
                              <Label htmlFor={`group-${group}`}>{group}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" onClick={handleAddUser}>
                        Add User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Manage user accounts and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-0 [&_th]:bg-background">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((usr) => (
                    <TableRow key={usr.username}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {usr.username === user?.username && (
                            <Badge variant="outline" className="mr-2 bg-blue-50 dark:bg-blue-900/20">You</Badge>
                          )}
                          {usr.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        {usr.role === 'admin' ? (
                          <div className="flex items-center">
                            <ShieldAlert className="h-4 w-4 mr-1.5 text-amber-500" />
                            <span>Administrator</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-1.5 text-blue-500" />
                            <span>User</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {usr.groups?.map(group => (
                            <Badge key={group} variant="outline" className="bg-gray-50 dark:bg-gray-800/80">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleRemoveUser(usr.username)}
                          disabled={usr.username === user?.username}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100/50 dark:border-blue-900/30">
            <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardTitle className="text-xl font-medium text-blue-800 dark:text-blue-200">
                Permission Groups
              </CardTitle>
              <CardDescription>
                Description of user groups and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                <div className="flex items-start space-x-4">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Users</h3>
                    <p className="text-sm text-muted-foreground">
                      Basic access to view data and reports
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">DataEditors</h3>
                    <p className="text-sm text-muted-foreground">
                      Can edit and repair data in addition to viewing
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">ADLSUsers</h3>
                    <p className="text-sm text-muted-foreground">
                      Can connect to Azure Data Lake Storage resources
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Administrators</h3>
                    <p className="text-sm text-muted-foreground">
                      Full access to all features including user management
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
