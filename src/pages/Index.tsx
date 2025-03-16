
import React from 'react';
import Header from '@/components/Header';
import ADLSManager from '@/components/adls/ADLSManager';
import WelcomeDashboard from '@/components/WelcomeDashboard';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="flex-1">
        <WelcomeDashboard username={user?.username} />
        <ADLSManager />
      </main>
    </div>
  );
};

export default Index;
