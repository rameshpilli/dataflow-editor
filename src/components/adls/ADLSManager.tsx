
import React, { useState } from 'react';
import { useADLSData } from '@/hooks/useADLSData';
import ConnectionForm from '@/components/adls/ConnectionForm';
import DatasetList from '@/components/adls/DatasetList';
import DataEditor from '@/components/adls/DataEditor';
import { Dataset, ADLSCredentials } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut } from 'lucide-react';
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
    connect,
    disconnect,
    loadDataset,
    updateCell,
    saveChanges,
    discardChanges
  } = useADLSData();
  
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

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
    await loadDataset(dataset.id);
  };

  const handleGoBackToDatasets = () => {
    // Clear the selected dataset by passing empty string to the loadDataset function
    loadDataset('');
  };

  const handleSaveChanges = async () => {
    const success = await saveChanges();
    if (success) {
      toast({
        title: "Changes saved",
        description: `Successfully saved ${changes.length} changes to the dataset`,
      });
    }
    return success;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Azure Data Lake Storage Manager</h1>
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
          
          <DatasetList 
            datasets={datasets}
            onSelectDataset={handleSelectDataset}
            isLoading={isLoading}
          />
        </div>
      )}
      
      {connection && selectedDataset && (
        <DataEditor 
          dataset={selectedDataset}
          dataPreview={dataPreview}
          isLoading={isLoading}
          isSaving={isSaving}
          changes={changes}
          modifiedRows={modifiedRows}
          onCellUpdate={updateCell}
          onSaveChanges={handleSaveChanges}
          onDiscardChanges={discardChanges}
          onLoadData={loadDataset}
          onGoBack={handleGoBackToDatasets}
        />
      )}
    </div>
  );
};

export default ADLSManager;
