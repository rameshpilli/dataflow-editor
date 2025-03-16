
import React from 'react';
import Header from '@/components/Header';
import ADLSManager from '@/components/adls/ADLSManager';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 transition-colors duration-500">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-5 bg-[radial-gradient(circle_800px_at_top_left,hsl(var(--primary-foreground)/10),transparent)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full opacity-10 dark:opacity-5 bg-[radial-gradient(circle_800px_at_bottom_right,hsl(var(--primary-foreground)/10),transparent)]"></div>
      </div>
      
      <Header />
      <main className="flex-1 p-4 md:p-6 animate-fade-in max-w-full overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto w-full">
          <ADLSManager />
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-blue-600/60 dark:text-blue-400/60 transition-colors duration-300 relative z-10">
        <p>Azure Data Lake Storage Explorer <span className="text-xs font-semibold">v1.2.3</span></p>
      </footer>
    </div>
  );
};

export default Index;
