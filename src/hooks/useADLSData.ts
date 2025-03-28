import { useState, useCallback } from 'react';
import { adlsService } from '@/services/adlsService';
import { 
  ADLSConnection, 
  ADLSCredentials, 
  Dataset, 
  DatasetPreview, 
  DataRow, 
  FilterOptions,
  DataChange,
  TempStorage,
  Comment,
  ValidationResult,
  DatasetColumn,
  Container,
  Folder,
  FolderTree
} from '@/types/adls';
import { toast } from '@/hooks/use-toast';
import { validateData } from '@/utils/schemaValidation';

export function useADLSData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ADLSConnection | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [dataPreview, setDataPreview] = useState<DatasetPreview | null>(null);
  const [changes, setChanges] = useState<DataChange[]>([]);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [tempStorage, setTempStorage] = useState<TempStorage | null>(null);
  const [canCommit, setCanCommit] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderTree, setFolderTree] = useState<FolderTree | null>(null);
  const [authMethods, setAuthMethods] = useState<{
    supportsManagedIdentity: boolean;
    supportsConnectionString: boolean;
    supportsAccountKey: boolean;
    recommendedMethod: 'managedIdentity' | 'connectionString' | 'accountKey' | null;
    environmentInfo: {
      isAzureEnvironment: boolean;
      isDevEnvironment: boolean;
      hasSystemManagedIdentity: boolean;
      hasUserManagedIdentity: boolean;
    }
  } | null>(null);

  const getAvailableAuthMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const methods = await adlsService.getAvailableAuthMethods();
      setAuthMethods(methods);
      return methods;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get authentication methods';
      setError(errorMessage);
      
      console.error("Auth methods error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async (credentials: ADLSCredentials, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newConnection = await adlsService.connect(credentials, name);
      setConnection(newConnection);
      
      const availableContainers = await adlsService.listContainers(newConnection.id, credentials.containerFilter);
      setContainers(availableContainers);
      
      try {
        const tree = await adlsService.getFolderTree(newConnection.id);
        setFolderTree(tree);
      } catch (err) {
        console.error("Error fetching folder tree:", err);
      }
      
      toast({
        title: "Connection successful",
        description: `Connected to ${name}`,
      });
      
      return newConnection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to ADLS';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!connection) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await adlsService.disconnect(connection.id);
      setConnection(null);
      setDatasets([]);
      setSelectedDataset(null);
      setDataPreview(null);
      setChanges([]);
      setModifiedRows(new Set());
      setContainers([]);
      setSelectedContainer(null);
      setFolders([]);
      setSelectedFolder(null);
      setFolderTree(null);
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from ADLS",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Disconnect failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  const selectContainer = useCallback(async (containerId: string) => {
    if (!connection) {
      setError('Not connected to ADLS');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('Container not found');
      }
      
      setSelectedContainer(container);
      setSelectedFolder(null);
      
      const containerFolders = await adlsService.listFolders(connection.id, containerId);
      setFolders(containerFolders);
      
      setDatasets([]);
      setSelectedDataset(null);
      
      return container;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select container';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to select container",
        description: errorMessage,
      });
      
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [connection, containers]);

  const selectFolder = useCallback(async (folderId: string) => {
    if (!connection || !selectedContainer) {
      setError('Not connected to ADLS or no container selected');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Looking for folder with ID: ${folderId} in ${folders.length} folders`);
      console.log(`Available folders:`, JSON.stringify(folders.map(f => ({ id: f.id, name: f.name, path: f.path }))));
      
      const folder = folders.find(f => f.id === folderId);
      if (!folder) {
        console.error(`Folder with ID ${folderId} not found in current container`);
        throw new Error(`Folder with ID ${folderId} not found in current container`);
      }
      
      setSelectedFolder(folder);
      console.log(`Selected folder: ${folder.name} (${folder.id})`);
      
      if (folder.hasDatasetFiles) {
        console.log(`Folder ${folder.name} has dataset files, retrieving them...`);
        try {
          const folderDatasets = await adlsService.getDatasetsByFolder(connection.id, folderId);
          console.log(`Retrieved ${folderDatasets.length} datasets for folder ${folder.name}`);
          console.log(`Dataset details:`, JSON.stringify(folderDatasets.map(d => ({ id: d.id, name: d.name, path: d.path }))));
          setDatasets(folderDatasets);
        } catch (datasetErr) {
          console.error(`Error fetching datasets for folder ${folder.name}:`, datasetErr);
          toast({
            variant: "destructive",
            title: "Error loading datasets",
            description: datasetErr instanceof Error ? datasetErr.message : "Failed to load datasets for this folder",
          });
          setDatasets([]);
        }
      } else {
        console.log(`Folder ${folder.name} doesn't contain dataset files, clearing datasets`);
        setDatasets([]);
      }
      
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select folder';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to select folder",
        description: errorMessage,
      });
      
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [connection, selectedContainer, folders, toast]);

  const checkFolderContainsDatasetFiles = useCallback(async (
    containerId: string,
    folderPath: string
  ) => {
    if (!connection) {
      setError('Not connected to ADLS');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('Container not found');
      }
      
      const result = await adlsService.checkFolderContainsDatasetFiles(
        connection.id,
        container.name,
        folderPath
      );
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check folder contents';
      setError(errorMessage);
      
      console.error("Error checking folder contents:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection, containers]);

  const backToContainers = useCallback(() => {
    setSelectedContainer(null);
    setSelectedFolder(null);
    setFolders([]);
    setDatasets([]);
  }, []);

  const backToFolders = useCallback(() => {
    if (selectedContainer) {
      setSelectedFolder(null);
      setDatasets([]);
      selectContainer(selectedContainer.id);
    }
  }, [selectedContainer, selectContainer]);

  const loadDataset = useCallback(async (
    datasetId: string, 
    page: number = 1, 
    pageSize: number = 10,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: FilterOptions[]
  ) => {
    if (!connection) {
      setError('Not connected to ADLS');
      return;
    }
    
    if (!datasetId) {
      setSelectedDataset(null);
      setDataPreview(null);
      setChanges([]);
      setModifiedRows(new Set());
      setTempStorage(null);
      setCanCommit(false);
      setComments([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const dataset = datasets.find(d => d.id === datasetId);
      if (!dataset) {
        throw new Error('Dataset not found');
      }
      
      setSelectedDataset(dataset);
      
      const storageInfo = adlsService.getTempStorage(datasetId);
      setTempStorage(storageInfo || null);
      
      if (storageInfo && storageInfo.repairedCount >= (dataset.rowCount || 0)) {
        setCanCommit(true);
      } else {
        setCanCommit(false);
      }
      
      const preview = await adlsService.getDatasetPreview(
        connection.id,
        datasetId,
        page,
        pageSize,
        sortColumn,
        sortDirection,
        filters
      );
      
      setDataPreview(preview);
      
      if (storageInfo) {
        const modifiedRowIds = new Set<string>(
          Array.from(storageInfo.modifiedRows.keys()).map(key => String(key))
        );
        setModifiedRows(modifiedRowIds);
      } else {
        setChanges([]);
        setModifiedRows(new Set<string>());
      }
      
      const datasetComments = await adlsService.getComments(datasetId);
      setComments(datasetComments);
      
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dataset';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to load dataset",
        description: errorMessage,
      });
      
      console.error("Dataset loading error:", err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [connection, datasets]);

  const updateCell = useCallback((rowId: string, columnName: string, newValue: any) => {
    if (!dataPreview) return;
    
    const rowIndex = dataPreview.rows.findIndex(r => r.__id === rowId);
    if (rowIndex === -1) return;
    
    const row = dataPreview.rows[rowIndex];
    const oldValue = row[columnName];
    
    if (oldValue === newValue) return;
    
    const change: DataChange = {
      rowId,
      columnName,
      oldValue,
      newValue,
      timestamp: new Date()
    };
    
    setChanges(prev => [...prev, change]);
    
    setModifiedRows(prev => {
      const updated = new Set(prev);
      updated.add(rowId);
      return updated;
    });
    
    setDataPreview(prev => {
      if (!prev) return null;
      
      const updatedRows = [...prev.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [columnName]: newValue,
        __modified: true
      };
      
      return {
        ...prev,
        rows: updatedRows
      };
    });
  }, [dataPreview]);

  const saveChanges = useCallback(async () => {
    if (!connection || !selectedDataset || !dataPreview || changes.length === 0) {
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const modifiedRowsArray = dataPreview.rows.filter(row => modifiedRows.has(row.__id));
      
      await adlsService.saveChangesToTemp(connection.id, selectedDataset.id, modifiedRowsArray);
      
      setChanges([]);
      
      const updatedStorage = adlsService.getTempStorage(selectedDataset.id);
      setTempStorage(updatedStorage || null);
      
      if (updatedStorage && updatedStorage.repairedCount >= (selectedDataset.rowCount || 0)) {
        setCanCommit(true);
      }
      
      const updatedDatasets = await adlsService.listDatasets(connection.id);
      setDatasets(updatedDatasets);
      
      const updatedSelectedDataset = updatedDatasets.find(d => d.id === selectedDataset.id);
      if (updatedSelectedDataset) {
        setSelectedDataset(updatedSelectedDataset);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to save changes",
        description: errorMessage,
      });
      
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [connection, selectedDataset, dataPreview, changes, modifiedRows]);

  const commitChanges = useCallback(async () => {
    if (!connection || !selectedDataset) {
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await adlsService.commitChangesToADLS(connection.id, selectedDataset.id);
      
      setChanges([]);
      setModifiedRows(new Set());
      setTempStorage(null);
      setCanCommit(false);
      
      const updatedDatasets = await adlsService.listDatasets(connection.id);
      setDatasets(updatedDatasets);
      
      const updatedSelectedDataset = updatedDatasets.find(d => d.id === selectedDataset.id);
      if (updatedSelectedDataset) {
        setSelectedDataset(updatedSelectedDataset);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to commit changes';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to commit changes",
        description: errorMessage,
      });
      
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [connection, selectedDataset]);

  const discardChanges = useCallback(() => {
    if (!connection || !selectedDataset) {
      return;
    }
    
    loadDataset(
      selectedDataset.id,
      dataPreview?.page || 1,
      dataPreview?.pageSize || 10
    );
    
    toast({
      title: "Changes discarded",
      description: "All modifications have been discarded",
    });
  }, [connection, selectedDataset, dataPreview, loadDataset]);

  const addComment = useCallback(async (text: string, rowId?: string, columnName?: string) => {
    if (!connection || !selectedDataset) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newComment = await adlsService.addComment(
        selectedDataset.id,
        text,
        rowId,
        columnName
      );
      
      setComments(prev => [...prev, newComment]);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to add comment",
        description: errorMessage,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [connection, selectedDataset]);

  const resolveComment = useCallback(async (commentId: string) => {
    if (!connection || !selectedDataset) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedComment = await adlsService.resolveComment(
        selectedDataset.id,
        commentId
      );
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      
      toast({
        title: "Comment resolved",
        description: "The comment has been marked as resolved",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve comment';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to resolve comment",
        description: errorMessage,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [connection, selectedDataset]);

  const validateDataset = useCallback(() => {
    if (!dataPreview || !dataPreview.columns) {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: "No data available to validate",
      });
      return;
    }
    
    const result = validateData(dataPreview.rows, dataPreview.columns);
    setValidationResult(result);
    
    if (result.isValid) {
      toast({
        title: "Validation successful",
        description: "All data passed validation rules",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: `Found ${result.errors.length} validation issues`,
      });
    }
    
    return result;
  }, [dataPreview]);

  const updateColumnValidation = useCallback(async (updatedColumn: DatasetColumn) => {
    if (!connection || !selectedDataset) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDataset = await adlsService.updateColumn(
        connection.id,
        selectedDataset.id,
        updatedColumn
      );
      
      setSelectedDataset(updatedDataset);
      
      setDatasets(prev => 
        prev.map(dataset => 
          dataset.id === updatedDataset.id ? updatedDataset : dataset
        )
      );
      
      if (dataPreview) {
        setDataPreview({
          ...dataPreview,
          columns: dataPreview.columns.map(column => 
            column.name === updatedColumn.name ? updatedColumn : column
          )
        });
      }
      
      toast({
        title: "Column updated",
        description: `Validation rules for ${updatedColumn.name} have been updated`,
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update column';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to update column",
        description: errorMessage,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [connection, selectedDataset, dataPreview]);

  return {
    isLoading,
    error,
    isSaving,
    connection,
    datasets,
    selectedDataset,
    dataPreview,
    changes,
    modifiedRows,
    tempStorage,
    canCommit,
    comments,
    validationResult,
    containers,
    selectedContainer,
    folders,
    selectedFolder,
    folderTree,
    authMethods,
    getAvailableAuthMethods,
    selectContainer,
    selectFolder,
    checkFolderContainsDatasetFiles,
    backToContainers,
    backToFolders,
    connect,
    disconnect,
    loadDataset,
    updateCell,
    saveChanges,
    commitChanges,
    discardChanges,
    addComment,
    resolveComment,
    validateDataset,
    updateColumnValidation
  };
}
