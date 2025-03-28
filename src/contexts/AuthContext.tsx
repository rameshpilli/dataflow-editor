import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface User {
  username: string;
  role?: string;
  groups?: string[];
  authMethod?: 'local' | 'ldap';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, authMethod?: 'local' | 'ldap') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  addUser: (username: string, password: string, role?: string) => Promise<void>;
  removeUser: (username: string) => Promise<void>;
  getUsers: () => User[];
  isAuthorized: (requiredGroups?: string[]) => boolean;
}

const MOCK_USERS = [
  { username: 'user', password: 'password', role: 'user', groups: ['Users'] },
  { username: 'admin', password: 'admin123', role: 'admin', groups: ['Administrators', 'Users'] }
];

let users = [...MOCK_USERS];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string, authMethod: 'local' | 'ldap' = 'local') => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (authMethod === 'ldap') {
      if (username.startsWith('ldap_')) {
        const userData = { 
          username, 
          role: 'user', 
          groups: ['LDAPUsers'], 
          authMethod: 'ldap' 
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return;
      }
      
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        const userData = { 
          username, 
          role: foundUser.role, 
          groups: foundUser.groups,
          authMethod: 'ldap'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return;
      }
      
      throw new Error('LDAP authentication failed');
    } else {
      const foundUser = users.find(u => u.username === username && u.password === password);
      
      if (!foundUser) {
        throw new Error('Invalid credentials');
      }
      
      const userData = { 
        username, 
        role: foundUser.role, 
        groups: foundUser.groups,
        authMethod: 'local'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const addUser = async (username: string, password: string, role: string = 'user') => {
    if (users.some(u => u.username === username)) {
      throw new Error('User already exists');
    }
    
    const newUser = { 
      username, 
      password, 
      role, 
      groups: role === 'admin' ? ['Administrators', 'Users'] : ['Users'] 
    };
    
    users.push(newUser);
    toast({
      title: "User added",
      description: `User ${username} has been added with role: ${role}`,
    });
    
    return;
  };

  const removeUser = async (username: string) => {
    const userExists = users.some(u => u.username === username);
    if (!userExists) {
      throw new Error('User does not exist');
    }
    
    users = users.filter(u => u.username !== username);
    toast({
      title: "User removed",
      description: `User ${username} has been removed from the system`,
    });
    
    return;
  };

  const getUsers = () => {
    return users.map(({ username, role, groups }) => ({ username, role, groups }));
  };

  const isAuthorized = (requiredGroups: string[] = []) => {
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    if (requiredGroups.length === 0) return true;
    
    return user.groups ? requiredGroups.some(group => user.groups?.includes(group)) : false;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    addUser,
    removeUser,
    getUsers,
    isAuthorized
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
