
import React from 'react';
import Header from '@/components/Header';
import ADLSManager from '@/components/adls/ADLSManager';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { APP_VERSION } from '@/constants/appInfo';

const Index = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 transition-colors duration-500">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-5 bg-[radial-gradient(circle_800px_at_top_left,hsl(var(--primary-foreground)/15),transparent)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full opacity-10 dark:opacity-5 bg-[radial-gradient(circle_800px_at_bottom_right,hsl(var(--primary-foreground)/15),transparent)]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] dark:opacity-[0.035] mix-blend-overlay"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2] dark:opacity-[0.1]"></div>
      </div>
      
      <Header />
      
      <main className="flex-1 p-4 md:p-6 animate-fade-in max-w-full overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-800 dark:text-blue-300 mb-2">
              Azure Data Lake Storage Explorer
            </h1>
            <p className="text-blue-600/80 dark:text-blue-400/80 max-w-3xl mx-auto">
              Connect, browse, and manage your Azure Data Lake Storage data assets
            </p>
          </div>
          <ADLSManager />
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-blue-600/60 dark:text-blue-400/60 transition-colors duration-300 relative z-10 border-t border-blue-100/20 dark:border-blue-900/20 mt-8">
        <p>Azure Data Lake Storage Explorer <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-blue-700 dark:text-blue-300">{APP_VERSION}</span></p>
        <p className="text-xs mt-1 text-blue-500/50 dark:text-blue-400/50">A React application for browsing and managing ADLS data</p>
      </footer>
    </div>
  );
};

export default Index;
