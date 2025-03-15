
import { useState, useCallback } from 'react';
import { adlsService } from '@/services/adlsService';
import { 
  ADLSConnection, 
  ADLSCredentials, 
  Dataset, 
  DatasetPreview, 
  DataRow, 
  FilterOptions,
  DataChange
} from '@/types/adls';
import { toast } from '@/hooks/use-toast';

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

  // Connect to ADLS
  const connect = useCallback(async (credentials: ADLSCredentials, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newConnection = await adlsService.connect(credentials, name);
      setConnection(newConnection);
      
      // Fetch available datasets
      const availableDatasets = await adlsService.listDatasets(newConnection.id);
      setDatasets(availableDatasets);
      
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

  // Disconnect from ADLS
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

  // Load dataset preview
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
    
    setIsLoading(true);
    setError(null);
    
    try {
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
      
      // Find and set the selected dataset
      const dataset = datasets.find(d => d.id === datasetId) || null;
      setSelectedDataset(dataset);
      
      // Reset any existing changes when loading a new dataset
      setChanges([]);
      setModifiedRows(new Set());
      
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dataset';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to load dataset",
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, datasets]);

  // Update a cell value
  const updateCell = useCallback((rowId: string, columnName: string, newValue: any) => {
    if (!dataPreview) return;
    
    // Find the row in the current preview
    const rowIndex = dataPreview.rows.findIndex(r => r.__id === rowId);
    if (rowIndex === -1) return;
    
    const row = dataPreview.rows[rowIndex];
    const oldValue = row[columnName];
    
    // Don't record changes if the value didn't actually change
    if (oldValue === newValue) return;
    
    // Record the change
    const change: DataChange = {
      rowId,
      columnName,
      oldValue,
      newValue,
      timestamp: new Date()
    };
    
    setChanges(prev => [...prev, change]);
    
    // Mark the row as modified
    setModifiedRows(prev => {
      const updated = new Set(prev);
      updated.add(rowId);
      return updated;
    });
    
    // Update the preview data
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

  // Save changes to the dataset
  const saveChanges = useCallback(async () => {
    if (!connection || !selectedDataset || !dataPreview || changes.length === 0) {
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Get modified rows
      const modifiedRowsArray = dataPreview.rows.filter(row => modifiedRows.has(row.__id));
      
      // Save changes to the data lake
      await adlsService.saveChanges(connection.id, selectedDataset.id, modifiedRowsArray);
      
      // Clear changes after successful save
      setChanges([]);
      setModifiedRows(new Set());
      
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

  // Discard all changes
  const discardChanges = useCallback(() => {
    if (!connection || !selectedDataset) {
      return;
    }
    
    // Reload the current dataset to discard changes
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
    connect,
    disconnect,
    loadDataset,
    updateCell,
    saveChanges,
    discardChanges
  };
}
