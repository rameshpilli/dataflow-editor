
import React from 'react';
import Header from '@/components/Header';
import ADLSManager from '@/components/adls/ADLSManager';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 transition-colors duration-300">
      <Header />
      <main className="flex-1 p-4 md:p-6 animate-fade-in max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <ADLSManager />
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-blue-600/60 dark:text-blue-400/60">
        <p>Azure Data Lake Storage Explorer</p>
      </footer>
    </div>
  );
};

export default Index;
