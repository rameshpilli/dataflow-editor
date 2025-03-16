
import React, { useState, useEffect } from 'react';
import { useADLSData } from '@/hooks/useADLSData';
import ConnectionForm from '@/components/adls/ConnectionForm';
import DatasetList from '@/components/adls/DatasetList';
import DataEditor from '@/components/adls/DataEditor';
import { Dataset, ADLSCredentials } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const ADLSManager: React.FC = () => {
  const {
    isLoading,
    error,
    isSaving,
    connection,
    datasets,
    selectedDataset,
    dataPreview,
    changes,
    modifiedRows,
    canCommit,
    connect,
    disconnect,
    loadDataset,
    updateCell,
    saveChanges,
    commitChanges,
    discardChanges
  } = useADLSData();
  
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log("Selected dataset:", selectedDataset ? selectedDataset.id : 'none');
    console.log("Data preview:", dataPreview ? `${dataPreview.rows.length} rows` : 'none');
  }, [selectedDataset, dataPreview]);

  const handleConnect = async (credentials: ADLSCredentials, name: string) => {
    try {
      await connect(credentials, name);
      toast({
        title: "Connected successfully",
        description: `Connected to ${name}`,
      });
    } catch (err) {
      // Error is already handled in the useADLSData hook
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowDisconnectDialog(false);
  };

  const handleSelectDataset = async (dataset: Dataset) => {
    console.log("Selecting dataset:", dataset.id);
    try {
      await loadDataset(dataset.id);
    } catch (err) {
      console.error("Error loading dataset:", err);
      toast({
        variant: "destructive",
        title: "Error loading dataset",
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  };

  const handleGoBackToDatasets = () => {
    loadDataset('');
  };

  const handleSaveChanges = async () => {
    try {
      const success = await saveChanges();
      if (success) {
        toast({
          title: "Changes saved",
          description: `Successfully saved changes to temporary storage`,
        });
      }
      return success;
    } catch (err) {
      console.error("Error saving changes:", err);
      toast({
        variant: "destructive",
        title: "Error saving changes",
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
      return false;
    }
  };

  const handleCommitChanges = async () => {
    try {
      const success = await commitChanges();
      if (success) {
        toast({
          title: "Changes committed",
          description: `Successfully committed all changes to ADLS delta table`,
        });
      }
      return success;
    } catch (err) {
      console.error("Error committing changes:", err);
      toast({
        variant: "destructive",
        title: "Error committing changes",
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
      return false;
    }
  };

  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey && e.key === 's' && selectedDataset) {
        e.preventDefault();
        handleSaveChanges();
      }

      if (e.key === '/' && !selectedDataset) {
        e.preventDefault();
        const searchInput = document.getElementById('dataset-search');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      if (e.key === 'Escape' && selectedDataset) {
        if (changes.length === 0) {
          handleGoBackToDatasets();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDataset, changes]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl water-blue-bg rounded-xl shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Data Editor</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Connect to ADLS, browse datasets, and edit data with an intuitive interface
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 shadow-sm">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
      
      {!connection && (
        <ConnectionForm 
          onConnect={handleConnect} 
          isLoading={isLoading} 
        />
      )}
      
      {connection && !selectedDataset && (
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg px-4 py-3 shadow-sm border border-blue-100 dark:border-blue-800/50">
              <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                Connected to: {connection.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {connection.credentials.useManagedIdentity 
                  ? 'Using Azure Managed Identity' 
                  : connection.credentials.connectionString 
                    ? 'Using Connection String' 
                    : 'Using Account Key'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
                    Disconnect
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect from ADLS</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to disconnect? Any unsaved changes will be lost.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="relative">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="dataset-search"
                  placeholder="Search datasets... (Press '/' to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10 border-gray-200 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-2 h-6 w-6 p-0" 
                    onClick={() => setSearchQuery('')}
                  >
                    <span className="sr-only">Clear</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                      <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DatasetList 
            datasets={filteredDatasets}
            onSelectDataset={handleSelectDataset}
            isLoading={isLoading}
          />
        </div>
      )}
      
      {connection && selectedDataset && dataPreview && (
        <DataEditor 
          dataset={selectedDataset}
          dataPreview={dataPreview}
          isLoading={isLoading}
          isSaving={isSaving}
          changes={changes}
          modifiedRows={modifiedRows}
          canCommit={canCommit}
          onCellUpdate={updateCell}
          onSaveChanges={handleSaveChanges}
          onCommitChanges={handleCommitChanges}
          onDiscardChanges={discardChanges}
          onLoadData={loadDataset}
          onGoBack={handleGoBackToDatasets}
        />
      )}
      
      {connection && selectedDataset && !dataPreview && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
          <div className="animate-pulse flex flex-col items-center justify-center">
            <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
            <h3 className="text-lg font-medium">Loading dataset...</h3>
            <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
            <div className="mt-4 h-2 w-40 bg-blue-200 dark:bg-blue-800 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADLSManager;
