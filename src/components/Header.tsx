
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Database, LogOut, Moon, Sun, User } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from '@/hooks/useTheme';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="w-full bg-background border-b shadow-sm px-6 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">ADLS Manager</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Toggle 
            pressed={theme === 'dark'} 
            onPressedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className="mr-2"
          >
            {theme === 'dark' ? 
              <Sun className="h-4 w-4" /> : 
              <Moon className="h-4 w-4" />}
          </Toggle>
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            {user?.username}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
