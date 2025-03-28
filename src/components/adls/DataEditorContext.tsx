import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dataset, DatasetPreview, FilterOptions, DataChange } from '@/types/adls';
import { toast } from '@/hooks/use-toast';

interface DataEditorContextType {
  dataset: Dataset;
  dataPreview: DatasetPreview | null;
  isLoading: boolean;
  isSaving: boolean;
  changes: DataChange[];
  modifiedRows: Set<string>;
  canCommit: boolean;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sortColumn: string | undefined;
  setSortColumn: (column: string | undefined) => void;
  sortDirection: 'asc' | 'desc' | undefined;
  setSortDirection: (direction: 'asc' | 'desc' | undefined) => void;
  columnWidths: { [columnName: string]: number };
  setColumnWidths: React.Dispatch<React.SetStateAction<{ [columnName: string]: number }>>;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
  isColumnResizing: boolean;
  setIsColumnResizing: (resizing: boolean) => void;
  filters: FilterOptions[];
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions[]>>;
  frozenColumns: string[];
  setFrozenColumns: React.Dispatch<React.SetStateAction<string[]>>;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  selectedRows: Set<string>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedCellId: string | null;
  setSelectedCellId: (id: string | null) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  columnFilters: {[key: string]: {value: string, active: boolean}};
  setColumnFilters: React.Dispatch<React.SetStateAction<{[key: string]: {value: string, active: boolean}}>>;
  repairedCount: number;
  getTotalPages: () => number;
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
  handleSelectRow: (rowId: string) => void;
  handleSelectAllRows: () => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
  handleSort: (columnName: string) => void;
  handleColumnResize: (columnName: string, newWidth: number) => void;
  toggleColumnVisibility: (columnName: string, isVisible: boolean) => void;
  handleFreezeChange: (columnName: string, isFrozen: boolean) => void;
  isRowModified: (rowId: string) => boolean;
  isAllRowsSelected: () => boolean;
}

const DataEditorContext = createContext<DataEditorContextType | undefined>(undefined);

export const useDataEditor = () => {
  const context = useContext(DataEditorContext);
  if (context === undefined) {
    throw new Error('useDataEditor must be used within a DataEditorProvider');
  }
  return context;
};

interface DataEditorProviderProps {
  children: React.ReactNode;
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
}

const STORAGE_KEY_PREFIX = 'adls-editor-';

const safeLocalStorageSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving to localStorage for key ${key}:`, error);
  }
};

const safeLocalStorageGet = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;
    return JSON.parse(storedValue);
  } catch (error) {
    console.warn(`Error parsing localStorage for key ${key}:`, error);
    return defaultValue;
  }
};

export const DataEditorProvider: React.FC<DataEditorProviderProps> = ({ 
  children,
  dataset,
  dataPreview,
  isLoading,
  isSaving,
  changes: initialChanges,
  modifiedRows,
  canCommit,
  onCellUpdate,
  onSaveChanges,
  onCommitChanges,
  onDiscardChanges,
  onLoadData,
  onGoBack
}) => {
  console.log("DataEditorProvider - Initializing with dataset:", dataset?.id);
  console.log("DataEditorProvider - Has dataPreview:", !!dataPreview);

  // We're tracking changes by row+column rather than individual keystrokes
  const [changes, setChanges] = useState<DataChange[]>(() => {
    // Group the initial changes by row and column
    const groupedChanges = new Map<string, DataChange>();
    
    initialChanges.forEach(change => {
      const key = `${change.rowId}-${change.columnName}`;
      // Only keep the most recent change for each row/column combo
      groupedChanges.set(key, change);
    });
    
    // Convert the map back to an array
    return Array.from(groupedChanges.values());
  });

  const [page, setPage] = useState(() => {
    const savedPage = safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-page`, 1);
    console.log("Restored page from storage:", savedPage);
    return savedPage;
  });
  
  const [pageSize, setPageSize] = useState(() => {
    const savedPageSize = safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-pageSize`, 10);
    console.log("Restored pageSize from storage:", savedPageSize);
    return savedPageSize;
  });
  
  const [sortColumn, setSortColumn] = useState<string | undefined>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-sortColumn`, undefined)
  );
  
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-sortDirection`, undefined)
  );
  
  const [columnWidths, setColumnWidths] = useState<{ [columnName: string]: number }>(() =>
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-columnWidths`, {})
  );
  
  const [zoomLevel, setZoomLevel] = useState(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-zoomLevel`, 100)
  );
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-visibleColumns`, dataset.columns.map(col => col.name))
  );
  
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions[]>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-filters`, [])
  );
  
  const [frozenColumns, setFrozenColumns] = useState<string[]>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-frozenColumns`, [])
  );
  
  const [editMode, setEditMode] = useState(() => {
    const savedEditMode = safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-editMode`, false);
    console.log("Restored editMode from storage:", savedEditMode);
    return savedEditMode;
  });
  
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: {value: string, active: boolean}}>({});
  const [repairedCount, setRepairedCount] = useState(0);

  // Override the onCellUpdate function to manage changes more effectively
  const handleCellUpdate = (rowId: string, columnName: string, newValue: any) => {
    // Create a unique key for this row/column combination
    const changeKey = `${rowId}-${columnName}`;
    
    // Call the original onCellUpdate function
    onCellUpdate(rowId, columnName, newValue);
    
    // Update our local changes state
    setChanges(prevChanges => {
      // Filter out any previous changes to this same cell
      const filteredChanges = prevChanges.filter(change => 
        !(change.rowId === rowId && change.columnName === columnName)
      );
      
      // Find if there's an existing change for this row/column
      const existingChange = prevChanges.find(change => 
        change.rowId === rowId && change.columnName === columnName
      );
      
      // If we have an existing change, use its original oldValue
      const oldValue = existingChange ? existingChange.oldValue : 
                      (dataPreview?.rows.find(r => r.__id === rowId)?.[columnName]);
      
      // Add the new change
      return [...filteredChanges, {
        rowId,
        columnName,
        oldValue,
        newValue,
        timestamp: new Date()
      }];
    });
  };

  // Log important state changes
  useEffect(() => {
    console.log("DataEditorContext - Edit mode changed to:", editMode);
  }, [editMode]);

  useEffect(() => {
    console.log("DataEditorContext - Page changed to:", page);
  }, [page]);

  useEffect(() => {
    if (dataset.id) {
      console.log("Saving state to localStorage for dataset:", dataset.id);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-page`, page);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-pageSize`, pageSize);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-sortColumn`, sortColumn);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-sortDirection`, sortDirection);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-columnWidths`, columnWidths);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-zoomLevel`, zoomLevel);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-visibleColumns`, visibleColumns);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-filters`, filters);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-frozenColumns`, frozenColumns);
      safeLocalStorageSet(`${STORAGE_KEY_PREFIX}${dataset.id}-editMode`, editMode);
    }
  }, [
    dataset.id, 
    page, 
    pageSize, 
    sortColumn, 
    sortDirection, 
    columnWidths, 
    zoomLevel,
    visibleColumns,
    filters,
    frozenColumns,
    editMode
  ]);

  useEffect(() => {
    setRepairedCount(modifiedRows.size);
  }, [modifiedRows]);

  useEffect(() => {
    if (dataset && dataset.id) {
      console.log("Loading data for dataset:", dataset.id);
      loadData();
    }
  }, [dataset.id]);

  // Separate effect for pagination and sorting changes
  useEffect(() => {
    if (dataset && dataset.id && dataPreview) {
      console.log("Reloading data due to page/sort/filter change");
      loadData();
    }
  }, [page, pageSize, sortColumn, sortDirection, filters]);

  const loadData = async () => {
    if (dataset && dataset.id) {
      console.log("Loading data with params:", {
        datasetId: dataset.id,
        page,
        pageSize,
        sortColumn,
        sortDirection,
        filterCount: filters.length
      });
      
      try {
        const preview = await onLoadData(dataset.id, page, pageSize, sortColumn, sortDirection, filters);
        console.log("Data loaded successfully:", preview ? "yes" : "no");
        return preview;
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to load data",
        });
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    console.log("Changing page to:", newPage);
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    console.log("Changing page size to:", newSize);
    setPageSize(newSize);
    setPage(1);
    
    if (isFullscreen) {
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 10);
    }
  };

  const handleSort = (columnName: string) => {
    console.log("Handling sort for column:", columnName);
    if (sortColumn === columnName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(undefined);
        setSortDirection(undefined);
      }
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const handleColumnResize = (columnName: string, newWidth: number) => {
    setColumnWidths(prevWidths => ({ ...prevWidths, [columnName]: newWidth }));
  };

  const toggleColumnVisibility = (columnName: string, isVisible: boolean) => {
    setVisibleColumns(prevColumns => {
      if (isVisible) {
        return [...prevColumns, columnName];
      } else {
        return prevColumns.filter(col => col !== columnName);
      }
    });
  };

  const handleFreezeChange = (columnName: string, isFrozen: boolean) => {
    setFrozenColumns(prev => {
      if (isFrozen) {
        return [...prev, columnName];
      } else {
        return prev.filter(col => col !== columnName);
      }
    });
  };

  const isRowModified = (rowId: string) => {
    return modifiedRows.has(rowId);
  };

  const handleSelectRow = (rowId: string) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(rowId)) {
        newSelectedRows.delete(rowId);
      } else {
        newSelectedRows.add(rowId);
      }
      return newSelectedRows;
    });
  };

  const handleSelectAllRows = () => {
    if (dataPreview) {
      if (selectedRows.size === dataPreview.rows.length) {
        setSelectedRows(new Set());
      } else {
        const allRowIds = dataPreview.rows.map(row => row.__id);
        setSelectedRows(new Set(allRowIds));
      }
    }
  };

  const isAllRowsSelected = () => {
    return dataPreview ? selectedRows.size === dataPreview.rows.length : false;
  };

  const getTotalPages = () => {
    if (!dataPreview) return 0;
    if (dataPreview.totalPages !== undefined) return dataPreview.totalPages;
    return dataPreview.totalRows ? Math.ceil(dataPreview.totalRows / dataPreview.pageSize) : 0;
  };

  // Custom save changes wrapper
  const handleSaveChanges = async () => {
    console.log(`Saving ${changes.length} changes`);
    const result = await onSaveChanges();
    if (result) {
      // Clear our changes list after saving
      setChanges([]);
    }
    return result;
  };

  const value = {
    dataset,
    dataPreview,
    isLoading,
    isSaving,
    changes,
    modifiedRows,
    canCommit,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
    columnWidths,
    setColumnWidths,
    zoomLevel,
    setZoomLevel,
    visibleColumns,
    setVisibleColumns,
    isColumnResizing,
    setIsColumnResizing,
    filters,
    setFilters,
    frozenColumns,
    setFrozenColumns,
    editMode,
    setEditMode,
    selectedRows,
    setSelectedRows,
    selectedCellId,
    setSelectedCellId,
    isFullscreen,
    setIsFullscreen,
    columnFilters,
    setColumnFilters,
    repairedCount,
    getTotalPages,
    onCellUpdate: handleCellUpdate,
    onSaveChanges: handleSaveChanges,
    onCommitChanges,
    onDiscardChanges,
    onLoadData,
    onGoBack,
    handleSelectRow,
    handleSelectAllRows,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleColumnResize,
    toggleColumnVisibility,
    handleFreezeChange,
    isRowModified,
    isAllRowsSelected
  };

  return (
    <DataEditorContext.Provider value={value}>
      {children}
    </DataEditorContext.Provider>
  );
};
