
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, FileText, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface WelcomeDashboardProps {
  username?: string;
}

const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ username }) => {
  const [showDashboard, setShowDashboard] = useState(true);
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    // Simulate getting last login time from local storage
    const storedTime = localStorage.getItem('lastLoginTime');
    if (storedTime) {
      setLastLoginTime(storedTime);
    }
    
    // Set current login time
    const currentTime = new Date().toLocaleString();
    localStorage.setItem('lastLoginTime', currentTime);
  }, []);

  if (!showDashboard) {
    return (
      <div className="container mx-auto mb-4 px-4">
        <Button 
          variant="ghost" 
          className="text-blue-600 dark:text-blue-400 -ml-2" 
          onClick={() => setShowDashboard(true)}
        >
          <ChevronDown className="h-4 w-4 mr-1" />
          Show welcome dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 transition-all duration-300 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
          Welcome back, <span className="text-blue-600 dark:text-blue-400">{username || 'User'}</span>
        </h2>
        <Button 
          variant="ghost" 
          className="text-slate-500" 
          onClick={() => setShowDashboard(false)}
        >
          <ChevronUp className="h-4 w-4 mr-1" />
          Hide dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Recent Datasets</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Continue your work on recently accessed datasets
                </p>
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  {lastLoginTime ? (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-slate-400" />
                      <span>Last login: {lastLoginTime}</span>
                    </div>
                  ) : (
                    <span>First time here? Start by connecting to ADLS</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="bg-emerald-100 dark:bg-emerald-800/50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Data Insights</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Data quality metrics and validation statistics
                </p>
                <Button variant="link" className="text-emerald-600 dark:text-emerald-400 p-0 h-auto mt-3 text-sm">
                  View data reports →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-100 dark:border-amber-800/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="bg-amber-100 dark:bg-amber-800/50 p-3 rounded-full">
                <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Quick Tips</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Use keyboard shortcuts for faster editing
                </p>
                <div className="mt-3 text-sm">
                  <div className="flex items-center mb-1 text-slate-600 dark:text-slate-300">
                    <span className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-xs mr-2">Ctrl+Z</span>
                    <span>Undo changes</span>
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <span className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-xs mr-2">Ctrl+S</span>
                    <span>Save changes</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeDashboard;
