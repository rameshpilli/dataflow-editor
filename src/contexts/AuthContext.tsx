
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  isLdapUser?: boolean;
  roles?: string[];
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, isLdapAuth?: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  users: User[];
  addUser: (user: User, password: string) => void;
  removeUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const initialUsers: User[] = [
  { username: 'user', roles: ['admin'] },
  { username: 'readonly', roles: ['viewer'] },
  { username: 'manager', roles: ['manager'] }
];

// Store passwords separately (in a real app, these would be hashed and stored securely)
const userPasswords: Record<string, string> = {
  'user': 'password',
  'readonly': 'password',
  'manager': 'password'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : initialUsers;
  });
  const navigate = useNavigate();

  // Store users in localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Check for existing user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Add a new user
  const addUser = (newUser: User, password: string) => {
    if (users.some(u => u.username === newUser.username)) {
      throw new Error('Username already exists');
    }
    
    // Add user to list
    setUsers(prev => [...prev, newUser]);
    
    // Store password (in real app, this would be hashed)
    userPasswords[newUser.username] = password;
  };

  // Remove a user
  const removeUser = (username: string) => {
    if (username === 'user') {
      throw new Error('Cannot remove the default admin user');
    }
    
    setUsers(prev => prev.filter(u => u.username !== username));
    delete userPasswords[username];
  };

  // Login function
  const login = async (username: string, password: string, isLdapAuth = false) => {
    // Short delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isLdapAuth) {
      // For LDAP auth, we trust the authentication happened at the UI level
      // In a real app, this would verify with a backend service
      const userData: User = { 
        username, 
        isLdapUser: true,
        roles: ['ldap_user'],
        displayName: username // In real LDAP, this would come from the directory
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return;
    }
    
    // For local auth, check against our user list
    const foundUser = users.find(u => u.username === username);
    
    if (foundUser && userPasswords[username] === password) {
      localStorage.setItem('user', JSON.stringify(foundUser));
      setUser(foundUser);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    users,
    addUser,
    removeUser
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
