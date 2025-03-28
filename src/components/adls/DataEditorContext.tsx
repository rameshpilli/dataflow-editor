
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dataset, DatasetPreview, DataChange, FilterOptions, Column, DataRow } from '@/types/adls';

interface DataEditorContextType {
  dataset: Dataset;
  dataPreview: DatasetPreview | null;
  isLoading: boolean;
  isSaving: boolean;
  page: number;
  pageSize: number;
  sortColumn: string | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  filters: FilterOptions[];
  editMode: boolean;
  changes: DataChange[];
  modifiedRows: Set<string>;
  canCommit: boolean;
  isFullscreen: boolean;
  selectedRows: DataRow[];
  setEditMode: (enabled: boolean) => void;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (newSize: number) => void;
  handleSortChange: (column: string) => void;
  handleFilterChange: (filters: FilterOptions[]) => void;
  onCellUpdate: (rowId: string, columnName: string, newValue: any) => void;
  onSaveChanges: () => Promise<boolean>;
  onCommitChanges: () => Promise<boolean>;
  onDiscardChanges: () => void;
  onGoBack: () => void;
  getTotalPages: () => number;
  setSelectedRows: (rows: DataRow[]) => void;
  getCellValue: (rowId: string, columnName: string) => any;
}

const DataEditorContext = createContext<DataEditorContextType | undefined>(undefined);

export const useDataEditor = (): DataEditorContextType => {
  const context = useContext(DataEditorContext);
  if (!context) {
    throw new Error('useDataEditor must be used within a DataEditorProvider');
  }
  return context;
};

interface DataEditorProviderProps {
  dataset: Dataset;
  dataPreview: DatasetPreview | null;
  isLoading: boolean;
  isSaving: boolean;
  changes: DataChange[];
  modifiedRows: Set<string>;
  canCommit: boolean;
  onCellUpdate: (rowId: string, columnName: string, newValue: any) => void;
  onSaveChanges: () => Promise<boolean>;
  onCommitChanges: () => Promise<boolean>;
  onDiscardChanges: () => void;
  onLoadData: (
    datasetId: string, 
    page: number, 
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: FilterOptions[]
  ) => Promise<DatasetPreview | undefined>;
  onGoBack: () => void;
  children: React.ReactNode;
}

export const DataEditorProvider: React.FC<DataEditorProviderProps> = ({ 
  dataset,
  dataPreview,
  isLoading,
  isSaving,
  changes,
  modifiedRows,
  canCommit,
  onCellUpdate,
  onSaveChanges,
  onCommitChanges,
  onDiscardChanges,
  onLoadData,
  onGoBack,
  children
}) => {
  console.log("DataEditorProvider - Initializing with dataset:", dataset?.id);
  console.log("DataEditorProvider - Has dataPreview:", !!dataPreview);

  const [page, setPage] = useState(dataPreview?.page || 1);
  const [pageSize, setPageSize] = useState(dataPreview?.pageSize || 20);
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(undefined);
  const [filters, setFilters] = useState<FilterOptions[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<DataRow[]>([]);
  
  useEffect(() => {
    if (dataPreview) {
      setPage(dataPreview.page);
      setPageSize(dataPreview.pageSize);
    }
  }, [dataPreview]);
  
  // Get the total number of pages based on dataPreview
  const getTotalPages = () => {
    if (!dataPreview || !dataPreview.totalRows) return 0;
    return Math.ceil(dataPreview.totalRows / pageSize);
  };
  
  // Handle page change
  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    try {
      await onLoadData(dataset.id, newPage, pageSize, sortColumn, sortDirection, filters);
    } catch (err) {
      console.error("Error loading data for page", newPage, err);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = async (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
    try {
      await onLoadData(dataset.id, 1, newSize, sortColumn, sortDirection, filters);
    } catch (err) {
      console.error("Error loading data with new page size", newSize, err);
    }
  };
  
  // Handle sort change
  const handleSortChange = async (column: string) => {
    let newDirection: 'asc' | 'desc' | undefined;
    
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = undefined;
      } else {
        newDirection = 'asc';
      }
    } else {
      newDirection = 'asc';
    }
    
    setSortColumn(newDirection ? column : undefined);
    setSortDirection(newDirection);
    
    try {
      await onLoadData(dataset.id, page, pageSize, newDirection ? column : undefined, newDirection, filters);
    } catch (err) {
      console.error("Error loading data with new sort", column, newDirection, err);
    }
  };
  
  // Handle filter change
  const handleFilterChange = async (newFilters: FilterOptions[]) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when changing filters
    
    try {
      await onLoadData(dataset.id, 1, pageSize, sortColumn, sortDirection, newFilters);
    } catch (err) {
      console.error("Error loading data with new filters", newFilters, err);
    }
  };
  
  // Get cell value with local changes applied
  const getCellValue = (rowId: string, columnName: string): any => {
    // Find the most recent change for this cell, if any
    const change = changes
      .filter(c => c.rowId === rowId && c.columnName === columnName)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (change) {
      return change.newValue;
    }
    
    // If no change, return the original value from dataPreview
    const row = dataPreview?.rows.find(r => r.id === rowId);
    return row ? row[columnName] : null;
  };
  
  const value: DataEditorContextType = {
    dataset,
    dataPreview,
    isLoading,
    isSaving,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    filters,
    editMode,
    changes,
    modifiedRows,
    canCommit,
    isFullscreen,
    selectedRows,
    setEditMode,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleFilterChange,
    onCellUpdate,
    onSaveChanges,
    onCommitChanges,
    onDiscardChanges,
    onGoBack,
    getTotalPages,
    setSelectedRows,
    getCellValue
  };
  
  return (
    <DataEditorContext.Provider value={value}>
      {children}
    </DataEditorContext.Provider>
  );
};
