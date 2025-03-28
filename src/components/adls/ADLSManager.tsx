import React, { useState, useEffect } from 'react';
import { useADLSData } from '@/hooks/useADLSData';
import ConnectionForm from '@/components/adls/ConnectionForm';
import DatasetList from '@/components/adls/DatasetList';
import DataEditor from '@/components/adls/DataEditor';
import ContainerBrowser from '@/components/adls/ContainerBrowser';
import { Dataset, ADLSCredentials } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, DatabaseIcon, CloudOff, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
    containers,
    selectedContainer,
    folders,
    selectedFolder,
    folderTree,
    authMethods,
    getAvailableAuthMethods,
    connect,
    disconnect,
    loadDataset,
    updateCell,
    saveChanges,
    commitChanges,
    discardChanges,
    selectContainer,
    selectFolder,
    backToContainers,
    backToFolders,
    checkFolderContainsDatasetFiles
  } = useADLSData();
  
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [datasetSelectionPending, setDatasetSelectionPending] = useState(false);
  const [loadingDatasetId, setLoadingDatasetId] = useState<string | null>(null);

  useEffect(() => {
    getAvailableAuthMethods()
      .catch(error => {
        console.log("Auth methods error:", error);
      });
  }, [getAvailableAuthMethods]);

  useEffect(() => {
    console.log("Selected dataset:", selectedDataset ? selectedDataset.id : 'none');
    console.log("Data preview:", dataPreview ? `${dataPreview.rows.length} rows` : 'none');
  }, [selectedDataset, dataPreview]);
  
  useEffect(() => {
    console.log("Folder tree:", folderTree ? 'available' : 'not available');
  }, [folderTree]);

  useEffect(() => {
    if (datasets.length === 1 && !selectedDataset && !datasetSelectionPending) {
      console.log("Auto-selecting the only dataset:", datasets[0].name);
      setTimeout(() => {
        handleSelectDataset(datasets[0]);
      }, 100);
    } else if (datasets.length > 0) {
      console.log(`Found ${datasets.length} datasets in the current folder`);
    }
  }, [datasets, selectedDataset, datasetSelectionPending]);

  const handleConnect = async (credentials: ADLSCredentials, name: string) => {
    try {
      setConnectionError(null);
      
      if (credentials.useMockBackend) {
        setUsingMockData(true);
      } else {
        setUsingMockData(false);
      }
      
      await connect(credentials, name);
      
      if (credentials.useMockBackend) {
        toast({
          title: "Connected to mock data",
          description: "Using mock data for demonstration purposes",
        });
      } else {
        toast({
          title: "Connected successfully",
          description: `Connected to ${name}`,
        });
      }
    } catch (err) {
      console.error("Connection error:", err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to connect to ADLS. Please check your credentials and try again.";
        
      setConnectionError(errorMessage);
      setShowErrorDialog(true);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowDisconnectDialog(false);
  };

  const handleSelectDataset = async (dataset: Dataset) => {
    console.log("ADLSManager - Selecting dataset:", dataset.id, dataset.name);
    setDatasetSelectionPending(true);
    setLoadingDatasetId(dataset.id);
    
    try {
      if (!dataset.id) {
        console.error("Dataset ID is missing", dataset);
        toast({
          variant: "destructive",
          title: "Error loading dataset",
          description: "Dataset ID is missing",
        });
        return;
      }

      console.log("Loading dataset with ID:", dataset.id);
      try {
        const preview = await loadDataset(dataset.id);
        console.log("Dataset loaded successfully:", dataset.id);
        console.log("Preview data:", preview ? "available" : "not available");
        
        setTimeout(() => {
          setDatasetSelectionPending(false);
          setLoadingDatasetId(null);
        }, 300);
      } catch (loadError) {
        console.error("First attempt to load dataset failed:", loadError);
        
        setTimeout(async () => {
          try {
            console.log("Retrying dataset load with ID:", dataset.id);
            const retryPreview = await loadDataset(dataset.id);
            console.log("Dataset loaded successfully on second attempt:", dataset.id);
            console.log("Preview data on retry:", retryPreview ? "available" : "not available");
          } catch (retryError) {
            console.error("Error loading dataset on retry:", retryError);
            toast({
              variant: "destructive",
              title: "Error loading dataset",
              description: retryError instanceof Error ? retryError.message : "Failed to load dataset after multiple attempts",
            });
          } finally {
            setDatasetSelectionPending(false);
            setLoadingDatasetId(null);
          }
        }, 500);
      }
    } catch (err) {
      console.error("Error in dataset selection process:", err);
      toast({
        variant: "destructive",
        title: "Error loading dataset",
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
      setDatasetSelectionPending(false);
      setLoadingDatasetId(null);
    }
  };

  const handleGoBackToDatasets = () => {
    console.log("Going back to datasets list");
    loadDataset('');
    setDatasetSelectionPending(false);
    setLoadingDatasetId(null);
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

  const handleFolderSelection = async (folderId: string) => {
    try {
      console.log("ADLSManager: Selecting folder with ID:", folderId);
      const selectedFolder = await selectFolder(folderId);
      
      if (selectedFolder) {
        console.log("ADLSManager: Successfully selected folder:", selectedFolder.name);
        console.log("ADLSManager: Has dataset files:", selectedFolder.hasDatasetFiles ? "Yes" : "No");
        console.log("ADLSManager: Available datasets:", datasets.length);
        
        if (datasets.length > 0) {
          console.log("ADLSManager: Dataset list:", 
            datasets.map(d => ({ id: d.id, name: d.name, path: d.path }))
          );
        } else {
          console.log("ADLSManager: No datasets available in this folder");
          
          if (selectedFolder.hasDatasetFiles) {
            toast({
              title: "No datasets found",
              description: "This folder should contain datasets, but none were loaded. This might be a data loading issue.",
              variant: "warning"
            });
          }
        }
      } else {
        console.error("ADLSManager: Failed to select folder or folder not found");
        toast({
          title: "Folder selection failed",
          description: "Could not select the requested folder. Please try another folder.",
          variant: "destructive"
        });
      }
      
    } catch (err) {
      console.error("ADLSManager: Error selecting folder:", err);
      toast({
        variant: "destructive",
        title: "Error selecting folder",
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  };

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

  console.log("Rendering state - selectedDataset:", selectedDataset ? "yes" : "no");
  console.log("Rendering state - dataPreview:", dataPreview ? "yes" : "no");
  console.log("Rendering state - datasetSelectionPending:", datasetSelectionPending);
  console.log("Rendering state - loadingDatasetId:", loadingDatasetId);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl water-blue-bg rounded-xl shadow-lg animate-fade-in">
      {usingMockData && (
        <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="text-amber-800 dark:text-amber-400">Using mock data</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Using simulated data for demonstration purposes. No real ADLS connection is being used.
          </AlertDescription>
        </Alert>
      )}
      
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
        <div className="space-y-6 bg-white/95 dark:bg-gray-800/95 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 animate-scale-in backdrop-blur-sm">
          <div className="flex flex-col mb-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-100/50 dark:border-blue-900/30 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Connected to: {connection.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {connection.credentials.useManagedIdentity 
                    ? connection.credentials.useUserCredentials 
                      ? 'Using Current User Identity (LDAP/AD)' 
                      : 'Using Azure Managed Identity' 
                    : connection.credentials.connectionString 
                      ? 'Using Connection String' 
                      : 'Using Account Key'}
                </p>
              </div>
              
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
            </div>
          </div>
          
          <ContainerBrowser
            containers={containers}
            selectedContainer={selectedContainer}
            folders={folders}
            selectedFolder={selectedFolder}
            isLoading={isLoading}
            onSelectContainer={selectContainer}
            onSelectFolder={handleFolderSelection}
            onBackToContainers={backToContainers}
            onBackToFolders={backToFolders}
            folderTree={folderTree}
          />
          
          {selectedFolder && datasets.length > 0 && (
            <DatasetList 
              datasets={filteredDatasets}
              onSelectDataset={handleSelectDataset}
              isLoading={isLoading || datasetSelectionPending}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              connectionInfo={
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-800/50">
                  {`Path: ${selectedContainer?.name}/${selectedFolder.name}`}
                </div>
              }
              loadingDatasetId={loadingDatasetId}
            />
          )}
          
          {selectedFolder && datasets.length === 0 && !isLoading && (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-500 mb-3" />
                <h3 className="text-lg font-medium">No datasets available</h3>
                <p className="text-gray-500 mt-2">No datasets were found in this folder.</p>
                {selectedFolder.hasDatasetFiles && (
                  <div className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-sm">
                    This folder is marked as containing datasets, but none could be loaded. 
                    This might be a data loading issue.
                  </div>
                )}
              </div>
            </div>
          )}

          {datasetSelectionPending && !selectedDataset && (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
              <div className="animate-pulse flex flex-col items-center justify-center">
                <div className="h-10 w-10 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
                <h3 className="text-lg font-medium">Loading dataset...</h3>
                <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
                <div className="mt-4 h-2 w-40 bg-blue-200 dark:bg-blue-800 rounded"></div>
              </div>
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
      
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Connection Error</DialogTitle>
            <DialogDescription>
              {connectionError || "An unknown error occurred while trying to connect to ADLS."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ADLSManager;
