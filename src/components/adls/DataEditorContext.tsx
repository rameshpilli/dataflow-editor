
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dataset, DatasetPreview, DataChange, FilterOptions, DatasetColumn, DataRow } from '@/types/adls';

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
  selectedRows: Set<string>;
  visibleColumns: string[];
  columnWidths: Record<string, number>;
  frozenColumns: string[];
  isColumnResizing: boolean;
  selectedCellId: string | null;
  zoomLevel: number;
  setEditMode: (enabled: boolean) => void;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (newSize: number) => void;
  handleSortChange: (column: string) => void;
  handleFilterChange: (filters: FilterOptions[]) => void;
  handleSort: (column: string) => void;
  handleSelectAllRows: (checked: boolean) => void;
  handleSelectRow: (rowId: string) => void;
  isRowModified: (rowId: string) => boolean;
  isAllRowsSelected: () => boolean;
  toggleColumnVisibility: (columnName: string, isVisible: boolean) => void;
  setSelectedCellId: (cellId: string | null) => void;
  onCellUpdate: (rowId: string, columnName: string, newValue: any) => void;
  onSaveChanges: () => Promise<boolean>;
  onCommitChanges: () => Promise<boolean>;
  onDiscardChanges: () => void;
  onGoBack: () => void;
  getTotalPages: () => number;
  setSelectedRows: (rows: Set<string>) => void;
  getCellValue: (rowId: string, columnName: string) => any;
  setFilters: (filters: FilterOptions[]) => void;
  setPage: (page: number) => void;
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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    dataset.columns.map(col => col.name)
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [frozenColumns, setFrozenColumns] = useState<string[]>([]);
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
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

  // Alias for handleSortChange to match the interface
  const handleSort = handleSortChange;
  
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
  
  // Row selection handlers
  const handleSelectAllRows = (checked: boolean) => {
    if (checked && dataPreview?.rows) {
      const allRowIds = new Set(dataPreview.rows.map(row => row.__id));
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowId: string) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      return newSelection;
    });
  };

  const isAllRowsSelected = () => {
    if (!dataPreview?.rows || dataPreview.rows.length === 0) return false;
    return selectedRows.size === dataPreview.rows.length;
  };

  const isRowModified = (rowId: string) => {
    return modifiedRows.has(rowId);
  };

  const toggleColumnVisibility = (columnName: string, isVisible: boolean) => {
    if (isVisible) {
      setVisibleColumns(prev => [...prev, columnName]);
    } else {
      setVisibleColumns(prev => prev.filter(col => col !== columnName));
    }
  };
  
  // Get cell value with local changes applied
  const getCellValue = (rowId: string, columnName: string): any => {
    // Find the most recent change for this cell, if any
    const change = changes
      .filter(c => c.rowId === rowId && c.columnName === columnName)
      .sort((a, b) => {
        // Safely compare Date objects by converting to numbers
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      })[0];
    
    if (change) {
      return change.newValue;
    }
    
    // If no change, return the original value from dataPreview
    const row = dataPreview?.rows.find(r => r.__id === rowId);
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
    visibleColumns,
    columnWidths,
    frozenColumns,
    isColumnResizing,
    selectedCellId,
    zoomLevel,
    setEditMode,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleFilterChange,
    handleSort,
    handleSelectAllRows,
    handleSelectRow,
    isRowModified,
    isAllRowsSelected,
    toggleColumnVisibility,
    setSelectedCellId,
    onCellUpdate,
    onSaveChanges,
    onCommitChanges,
    onDiscardChanges,
    onGoBack,
    getTotalPages,
    setSelectedRows,
    getCellValue,
    setFilters,
    setPage
  };
  
  return (
    <DataEditorContext.Provider value={value}>
      {children}
    </DataEditorContext.Provider>
  );
};
