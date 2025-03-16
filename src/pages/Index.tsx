
import React from 'react';
import Header from '@/components/Header';
import ADLSManager from '@/components/adls/ADLSManager';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-950">
      <Header />
      <main className="flex-1 p-4 md:p-6 animate-fade-in">
        <ADLSManager />
      </main>
    </div>
  );
};

export default Index;
