
import React from 'react';
import Header from '@/components/Header';
import ADLSManager from '@/components/adls/ADLSManager';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

const APP_VERSION = "v1.2.3";

const Index = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 transition-colors duration-500">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-5 bg-[radial-gradient(circle_800px_at_top_left,hsl(var(--primary-foreground)/10),transparent)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full opacity-10 dark:opacity-5 bg-[radial-gradient(circle_800px_at_bottom_right,hsl(var(--primary-foreground)/10),transparent)]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay"></div>
      </div>
      
      <Header />
      
      {user && (
        <div className="flex justify-end px-6 -mt-2 mb-2">
          <Badge variant="outline" className="text-xs bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 font-mono">
            {APP_VERSION}
          </Badge>
        </div>
      )}
      
      <main className="flex-1 p-4 md:p-6 animate-fade-in max-w-full overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto w-full">
          <ADLSManager />
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-blue-600/60 dark:text-blue-400/60 transition-colors duration-300 relative z-10">
        <p>Azure Data Lake Storage Explorer <span className="text-xs font-semibold">{APP_VERSION}</span></p>
      </footer>
    </div>
  );
};

export default Index;
