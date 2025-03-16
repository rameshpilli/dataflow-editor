import React, { useState, useEffect } from 'react';
import { useADLSData } from '@/hooks/useADLSData';
import ConnectionForm from '@/components/adls/ConnectionForm';
import DatasetList from '@/components/adls/DatasetList';
import DataEditor from '@/components/adls/DataEditor';
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog';
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Editor</h1>
        <p className="text-gray-600">
          Connect to ADLS, browse datasets, and edit data with an intuitive interface
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                Connected to: {connection.name}
              </h2>
              <p className="text-sm text-gray-500">
                {connection.credentials.useManagedIdentity 
                  ? 'Using Azure Managed Identity' 
                  : connection.credentials.connectionString 
                    ? 'Using Connection String' 
                    : 'Using Account Key'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <KeyboardShortcutsDialog />
              
              <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
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
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="dataset-search"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 mb-4"
            />
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
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Loading dataset...</h3>
          <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
        </div>
      )}
    </div>
  );
};

export default ADLSManager;
