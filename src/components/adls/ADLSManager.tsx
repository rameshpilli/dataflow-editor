import React, { useState, useEffect } from 'react';
import { useADLSData } from '@/hooks/useADLSData';
import ConnectionForm from '@/components/adls/ConnectionForm';
import DatasetList from '@/components/adls/DatasetList';
import DataEditor from '@/components/adls/DataEditor';
import { Dataset, ADLSCredentials } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, DatabaseIcon, CloudOff, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    <div className="container mx-auto py-8 px-4 max-w-7xl water-blue-bg rounded-xl shadow-lg animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 shadow-sm animate-scale-in">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      )}
      
      {!connection && (
        <ConnectionForm 
          onConnect={handleConnect} 
          isLoading={isLoading} 
        />
      )}
      
      {connection && !selectedDataset && (
        <div className="space-y-6 bg-white dark:bg-gray-800/90 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 animate-scale-in">
          {filteredDatasets.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg px-4 py-3 shadow-sm border border-blue-100 dark:border-blue-800/50 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center">
                    <DatabaseIcon className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                    <div>
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
                  </div>
                </div>
              </div>
              
              <DatasetList 
                datasets={filteredDatasets}
                onSelectDataset={handleSelectDataset}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                disconnectButton={
                  <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors btn-feedback"
                        aria-label="Disconnect from ADLS"
                      >
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
                        <Button 
                          variant="destructive" 
                          onClick={handleDisconnect}
                          className="btn-feedback"
                        >
                          Disconnect
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              />
            </>
          ) : (
            <div className="empty-state animate-fade-in" role="status">
              {searchQuery ? (
                <>
                  <CloudOff className="h-10 w-10 mb-2 text-gray-400 animate-bounce-subtle" />
                  <h3 className="text-lg font-medium mb-1">No datasets found</h3>
                  <p className="text-sm">No datasets match your search criteria "{searchQuery}"</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <CloudOff className="h-10 w-10 mb-2 text-gray-400 animate-bounce-subtle" />
                  <h3 className="text-lg font-medium mb-1">No datasets available</h3>
                  <p className="text-sm">Connect to a data source with datasets to get started</p>
                </>
              )}
            </div>
          )}
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
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 animate-pulse-subtle">
          <div className="animate-pulse flex flex-col items-center justify-center">
            <div className="h-10 w-10 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
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
