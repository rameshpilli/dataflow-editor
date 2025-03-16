
import ADLSManager from '@/components/adls/ADLSManager';
import Header from '@/components/Header';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4">
        <ADLSManager />
      </main>
    </div>
  );
};

export default Index;
