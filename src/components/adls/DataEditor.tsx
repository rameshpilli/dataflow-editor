
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dataset, DatasetPreview, DataRow, FilterOptions, DataChange, DatasetColumn } from '@/types/adls';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ResizableColumn } from '@/components/ui/resizable-column';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  Save, 
  Undo2, 
  ArrowLeftCircle, 
  Columns, 
  Calendar, 
  Copy, 
  Edit, 
  FileDown, 
  Check, 
  MoveHorizontal,
  Expand,
  ListFilter,
  ShieldCheck,
  PenLine,
  Download,
  FileText,
  SearchIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import TableColumnManager from './TableColumnManager';
import ColumnMenu from './ColumnMenu';
import BulkEditDialog from './BulkEditDialog';
import ZoomControls from './ZoomControls';
import { toast } from '@/hooks/use-toast';

interface DataEditorProps {
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

// Helper function to safely store in localStorage
const safeLocalStorageSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving to localStorage for key ${key}:`, error);
  }
};

// Helper function to safely get from localStorage
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

// Function to export data as CSV
const exportToCSV = (data: DataRow[], columns: DatasetColumn[], filename: string) => {
  if (!data || !data.length) {
    toast({
      title: "Export failed",
      description: "No data available to export",
      variant: "destructive"
    });
    return;
  }

  const visibleColumns = columns.map(col => col.name);
  
  // Create CSV header
  const header = visibleColumns.join(',');
  
  // Create CSV rows
  const csvRows = data.map(row => {
    return visibleColumns.map(colName => {
      const value = row[colName];
      // Handle null, undefined, and escape commas and quotes
      if (value === null || value === undefined) return '';
      const valueStr = String(value);
      return valueStr.includes(',') || valueStr.includes('"') 
        ? `"${valueStr.replace(/"/g, '""')}"` 
        : valueStr;
    }).join(',');
  });
  
  // Combine header and rows
  const csvContent = [header, ...csvRows].join('\n');
  
  // Create a blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast({
    title: "Export successful",
    description: `Dataset exported as ${filename}.csv`,
  });
};

// Function to export data as JSON
const exportToJSON = (data: DataRow[], columns: DatasetColumn[], filename: string) => {
  if (!data || !data.length) {
    toast({
      title: "Export failed",
      description: "No data available to export",
      variant: "destructive"
    });
    return;
  }
  
  const visibleColumns = columns.map(col => col.name);
  
  // Filter data to only include visible columns
  const filteredData = data.map(row => {
    const filteredRow: Record<string, any> = {};
    visibleColumns.forEach(colName => {
      filteredRow[colName] = row[colName];
    });
    return filteredRow;
  });
  
  // Create a blob and download
  const jsonContent = JSON.stringify(filteredData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast({
    title: "Export successful",
    description: `Dataset exported as ${filename}.json`,
  });
};

const DataEditor: React.FC<DataEditorProps> = ({ 
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
  onGoBack
}) => {
  const [page, setPage] = useState(() => safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-page`, 1));
  const [pageSize, setPageSize] = useState(() => safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-pageSize`, 10));
  const [sortColumn, setSortColumn] = useState<string | undefined>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-sortColumn`, undefined)
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-sortDirection`, undefined)
  );
  const [columnWidths, setColumnWidths] = useState<{ [columnName: string]: number }>(() =>
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-columnWidths`, {})
  );
  const [zoomLevel, setZoomLevel] = useState(() => safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-zoomLevel`, 100));
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-visibleColumns`, dataset.columns.map(col => col.name))
  );
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions[]>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-filters`, [])
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterOperation, setFilterOperation] = useState<FilterOptions['operation']>('equals');
  const [filterValue, setFilterValue] = useState<string>('');
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditColumn, setBulkEditColumn] = useState<string | null>(null);
  const [bulkEditValue, setBulkEditValue] = useState<string>('');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [frozenColumns, setFrozenColumns] = useState<string[]>(() => 
    safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-frozenColumns`, [])
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editMode, setEditMode] = useState(() => safeLocalStorageGet(`${STORAGE_KEY_PREFIX}${dataset.id}-editMode`, false));
  const [repairedCount, setRepairedCount] = useState(0);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [columnFilters, setColumnFilters] = useState<{[key: string]: {value: string, active: boolean}}>({});

  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dataset.id) {
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
      loadData();
    }
  }, [dataset, page, pageSize, sortColumn, sortDirection, filters]);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen]);

  const loadData = useCallback(async () => {
    if (dataset && dataset.id) {
      await onLoadData(dataset.id, page, pageSize, sortColumn, sortDirection, filters);
    }
  }, [dataset, page, pageSize, sortColumn, sortDirection, filters, onLoadData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    toast({
      title: "Page size updated",
      description: `Showing ${newSize} items per page`,
    });
  };

  const handleSort = (columnName: string) => {
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

  const getSortIndicator = (columnName: string) => {
    if (sortColumn === columnName) {
      return sortDirection === 'asc' 
        ? <ChevronUp className="h-4 w-4 inline-block ml-1 text-blue-600 dark:text-blue-400" /> 
        : <ChevronDown className="h-4 w-4 inline-block ml-1 text-blue-600 dark:text-blue-400" />;
    }
    return null;
  };

  const handleColumnResize = (columnName: string, newWidth: number) => {
    setColumnWidths(prevWidths => ({ ...prevWidths, [columnName]: newWidth }));
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleFitToScreen = () => {
    setZoomLevel(100);
  };

  const handleFocusSelection = () => {
    if (selectedRows.size > 0 && tableRef.current) {
      const firstSelectedRow = Array.from(selectedRows)[0];
      const rowElement = tableRef.current.querySelector(`[data-row-id="${firstSelectedRow}"]`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
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
  
  const handleReorderColumns = (sourceIndex: number, destinationIndex: number) => {
    console.log(`Reorder column from ${sourceIndex} to ${destinationIndex}`);
  };

  const handleApplyFilter = () => {
    if (filterColumn) {
      setIsApplyingFilters(true);
      const newFilter: FilterOptions = {
        column: filterColumn,
        operation: filterOperation,
        value: filterValue,
      };
      setFilters([newFilter]);
      setShowFilters(false);
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    setFilters([]);
    setFilterColumn(null);
    setFilterValue('');
    setFilterOperation('equals');
    setPage(1);
    setColumnFilters({});
  };

  const handleColumnFilter = (columnName: string, value: string) => {
    const newColumnFilters = { ...columnFilters };
    
    if (value === '') {
      // Remove filter if value is empty
      delete newColumnFilters[columnName];
    } else {
      newColumnFilters[columnName] = { 
        value, 
        active: true 
      };
    }
    
    setColumnFilters(newColumnFilters);
    
    // Apply the filters to the main filter state
    const newFilters = Object.entries(newColumnFilters)
      .filter(([_, filter]) => filter.active)
      .map(([column, filter]) => ({
        column,
        operation: 'contains' as FilterOptions['operation'],
        value: filter.value
      }));
    
    setFilters(newFilters);
    setPage(1);
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

  const handleOpenBulkEditDialog = (columnName: string) => {
    setBulkEditColumn(columnName);
    setIsBulkEditDialogOpen(true);
  };

  const handleCloseBulkEditDialog = () => {
    setIsBulkEditDialogOpen(false);
    setBulkEditColumn(null);
    setBulkEditValue('');
  };

  const handleBulkEditApply = () => {
    if (bulkEditColumn && dataPreview) {
      selectedRows.forEach(rowId => {
        onCellUpdate(rowId, bulkEditColumn, bulkEditValue);
      });
      handleCloseBulkEditDialog();
      toast({
        title: "Bulk edit applied",
        description: `Updated ${selectedRows.size} rows for column ${bulkEditColumn}`,
      });
    }
  };

  const handleColumnMenuSort = (direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      setSortColumn(undefined);
      setSortDirection(undefined);
    } else {
      setSortColumn(sortColumn);
      setSortDirection(direction);
    }
  };

  const handleToggleEditMode = () => {
    setEditMode(prev => !prev);
    toast({
      title: editMode ? "Edit mode disabled" : "Edit mode enabled",
      description: editMode 
        ? "Cells are now read-only" 
        : "You can now edit cells by clicking on them",
    });
  };

  const handleCellClick = (rowId: string, columnName: string) => {
    setSelectedCellId(`${rowId}-${columnName}`);
  };

  const handleBackClick = () => {
    if (changes.length > 0) {
      setShowBackConfirmation(true);
    } else {
      onGoBack();
    }
  };

  const handleConfirmDiscardAndGoBack = () => {
    onDiscardChanges();
    onGoBack();
    setShowBackConfirmation(false);
  };

  const handleSaveAndGoBack = async () => {
    const saveSuccessful = await onSaveChanges();
    if (saveSuccessful) {
      onGoBack();
    }
    setShowBackConfirmation(false);
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleExportData = () => {
    if (!dataPreview || !dataset) return;
    
    const filename = `${dataset.name}-export-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'csv') {
      exportToCSV(dataPreview.rows, dataset.columns.filter(col => visibleColumns.includes(col.name)), filename);
    } else {
      exportToJSON(dataPreview.rows, dataset.columns.filter(col => visibleColumns.includes(col.name)), filename);
    }
    
    setShowExportDialog(false);
  };

  return (
    <Card className={cn("h-full flex flex-col", isFullscreen && "fixed inset-0 z-50")} ref={containerRef}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackClick} 
              className="mr-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 border-blue-200 dark:border-blue-800 transition-all duration-200 font-medium"
            >
              <ArrowLeftCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              Back
            </Button>
            <CardTitle>{dataset.name}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg px-4 py-2 shadow-sm border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Repair Progress</div>
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={dataset.rowCount ? (repairedCount / dataset.rowCount) * 100 : 0} 
                      className="h-2 w-24 bg-blue-100 dark:bg-blue-900/50"
                    />
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-white dark:bg-gray-800 text-xs font-semibold py-0 h-5 border-blue-200 dark:border-blue-800">
                        <span className="text-indigo-600 dark:text-indigo-400">{repairedCount}</span>
                        <span className="text-gray-500 dark:text-gray-400">/</span>
                        <span className="text-gray-600 dark:text-gray-300">{dataset.rowCount || 0}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isFullscreen && (
              <Button variant="ghost" size="sm" onClick={handleToggleFullscreen}>
                <Expand className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {dataPreview ? `Displaying ${dataPreview.rows.length} of ${dataPreview.totalRows} rows` : 'Loading data...'}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(
        "overflow-hidden h-full flex-grow pb-4",
        isFullscreen ? "h-[calc(100vh-170px)]" : "h-[calc(100vh-300px)]"
      )}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowColumnManager(true)}>
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear Filters
                <Badge variant="outline" className="ml-2 bg-blue-50 dark:bg-blue-900/20">{filters.length}</Badge>
              </Button>
            )}
          </div>
          <ZoomControls 
            zoomLevel={zoomLevel} 
            onZoomChange={handleZoomChange}
            onFitToScreen={handleFitToScreen}
            onFocusSelection={handleFocusSelection}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            disableFocus={selectedRows.size === 0}
            editMode={editMode}
            onToggleEditMode={handleToggleEditMode}
          />
        </div>

        <ScrollArea className={cn(
          isFullscreen ? "h-[calc(100vh-210px)]" : "h-[calc(100vh-340px)]"
        )}>
          <div className="relative">
            <Table 
              fullWidth
              zoomLevel={zoomLevel}
              columnResizing={isColumnResizing}
              alternateRowColors={false}
              ref={tableRef}
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sticky left-0 z-20">
                    <Checkbox
                      checked={isAllRowsSelected()}
                      onCheckedChange={handleSelectAllRows}
                    />
                  </TableHead>
                  {dataset.columns.filter(col => visibleColumns.includes(col.name)).map((column, index) => (
                    <TableHead 
                      key={column.name}
                      width={columnWidths[column.name] || 150}
                      className={cn(
                        frozenColumns.includes(column.name) && "sticky left-10 z-20",
                        index === 0 && !frozenColumns.includes(column.name) && "pl-4"
                      )}
                    >
                      <div className="flex flex-col space-y-1 w-full">
                        <div className="flex items-center justify-between w-full">
                          <button 
                            onClick={() => handleSort(column.name)} 
                            className="flex items-center whitespace-nowrap font-medium"
                            title={`Sort by ${column.name}`}
                          >
                            <span className={cn(
                              "transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                              sortColumn === column.name ? "text-blue-600 dark:text-blue-400" : ""
                            )}>
                              {column.name}
                            </span>
                            <div className="w-6 h-4 flex items-center justify-center">
                              {getSortIndicator(column.name)}
                            </div>
                          </button>
                          <ColumnMenu 
                            column={column} 
                            onSort={handleColumnMenuSort}
                            onEditAll={() => handleOpenBulkEditDialog(column.name)}
                            onEditSelected={selectedRows.size > 0 ? () => handleOpenBulkEditDialog(column.name) : undefined}
                            onSetNull={() => {/* Implementation */}}
                            onSetNullSelected={selectedRows.size > 0 ? () => {/* Implementation */} : undefined}
                            onHide={() => toggleColumnVisibility(column.name, false)}
                            hasSelectedRows={selectedRows.size > 0}
                          >
                            <Button variant="ghost" size="sm" className="p-0 h-6 w-6 opacity-60 hover:opacity-100 transition-opacity">
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.5 5.5C3.5 5.22386 3.72386 5 4 5H11C11.2761 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.2761 6 11 6H4C3.72386 6 3.5 5.77614 3.5 5.5Z" fill="currentColor" />
                                <path d="M3.5 7.5C3.5 7.22386 3.72386 7 4 7H11C11.2761 7 11.5 7.22386 11.5 7.5C11.5 7.77614 11.2761 8 11 8H4C3.72386 8 3.5 7.77614 3.5 7.5Z" fill="currentColor" />
                                <path d="M3.5 9.5C3.5 9.22386 3.72386 9 4 9H11C11.2761 9 11.5 9.22386 11.5 9.5C11.5 9.77614 11.2761 10 11 10H4C3.72386 10 3.5 9.77614 3.5 9.5Z" fill="currentColor" />
                              </svg>
                            </Button>
                          </ColumnMenu>
                        </div>
                        
                        {/* Column filter input */}
                        <div className="relative w-full flex items-center">
                          <SearchIcon className="absolute left-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <Input
                            placeholder={`Filter...`}
                            value={columnFilters[column.name]?.value || ''}
                            onChange={(e) => handleColumnFilter(column.name, e.target.value)}
                            className="h-6 text-xs pl-5 py-1 border-gray-200 focus:border-blue-300 dark:border-gray-700 dark:focus:border-blue-600"
                          />
                          {columnFilters[column.name]?.value && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleColumnFilter(column.name, '')}
                              className="absolute right-0 top-0 h-6 w-6 p-0"
                            >
                              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataPreview?.rows.map(row => (
                  <TableRow key={row.__id} isHighlighted={isRowModified(row.__id)} data-row-id={row.__id}>
                    <TableCell className="w-10 sticky left-0 z-10 bg-inherit">
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedRows.has(row.__id)}
                          onCheckedChange={() => handleSelectRow(row.__id)}
                        />
                        {isRowModified(row.__id) && (
                          <PenLine className="ml-2 h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    {dataset.columns.filter(col => visibleColumns.includes(col.name)).map((column, index) => (
                      <TableCell 
                        key={`${row.__id}-${column.name}`}
                        width={columnWidths[column.name]}
                        className={cn(
                          selectedCellId === `${row.__id}-${column.name}` ? "bg-blue-100 dark:bg-blue-900" : "",
                          frozenColumns.includes(column.name) && "sticky left-10 z-10 bg-inherit",
                          index === 0 && !frozenColumns.includes(column.name) && "pl-4"
                        )}
                        onClick={() => handleCellClick(row.__id, column.name)}
                      >
                        {editMode ? (
                          <Input
                            type="text"
                            value={row[column.name] || ''}
                            className="w-full h-8 rounded-none border-0 shadow-none focus:ring-0 p-0"
                            onChange={(e) => onCellUpdate(row.__id, column.name, e.target.value)}
                          />
                        ) : (
                          <div className="w-full h-8 p-1 overflow-hidden text-ellipsis">
                            {row[column.name] || ''}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onDiscardChanges}
            disabled={changes.length === 0 || isSaving}
            title="Discard changes"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={onSaveChanges}
            disabled={changes.length === 0 || isSaving}
            title="Save changes"
          >
            <Save className="h-4 w-4" />
          </Button>
          {canCommit && (
            <Button
              variant="default"
              size="sm"
              onClick={onCommitChanges}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Commit to ADLS
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <ListFilter className="mr-2 h-4 w-4" />
                {pageSize} per page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Page Size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePageSizeChange(10)} className={pageSize === 10 ? "bg-accent" : ""}>
                10 rows
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePageSizeChange(50)} className={pageSize === 50 ? "bg-accent" : ""}>
                50 rows
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePageSizeChange(100)} className={pageSize === 100 ? "bg-accent" : ""}>
                100 rows
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={cn(page === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive>{page}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={cn(
                    (!dataPreview || page * pageSize >= dataPreview.totalRows) && 
                    "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardFooter>

      <Dialog open={showColumnManager} onOpenChange={setShowColumnManager}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Columns</DialogTitle>
            <DialogDescription>
              Select which columns to display in the table.
            </DialogDescription>
          </DialogHeader>
          <TableColumnManager
            columns={dataset.columns}
            visibleColumns={visibleColumns}
            frozenColumns={frozenColumns}
            onVisibilityChange={toggleColumnVisibility}
            onFreezeChange={handleFreezeChange}
            onReorder={handleReorderColumns}
            open={showColumnManager}
            onOpenChange={setShowColumnManager}
          />
          <DialogFooter>
            <Button onClick={() => setShowColumnManager(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Filter</DialogTitle>
            <DialogDescription>
              Filter data based on column values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="column" className="text-right">
                Column
              </Label>
              <Select value={filterColumn || ''} onValueChange={setFilterColumn}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {dataset.columns.map(column => (
                    <SelectItem key={column.name} value={column.name}>{column.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operation" className="text-right">
                Operation
              </Label>
              <Select 
                value={filterOperation} 
                onValueChange={(value) => setFilterOperation(value as FilterOptions['operation'])}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="startsWith">Starts With</SelectItem>
                  <SelectItem value="endsWith">Ends With</SelectItem>
                  <SelectItem value="greaterThan">Greater Than</SelectItem>
                  <SelectItem value="lessThan">Less Than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Value
              </Label>
              <Input id="value" className="col-span-3" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleApplyFilter} disabled={!filterColumn || isApplyingFilters}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Choose an export format for your dataset.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'json')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Export Options</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Only visible columns will be exported</li>
                    <li>• Current sorting will be applied</li>
                    <li>• Current page data only ({dataPreview?.rows.length || 0} rows)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExportData} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as {exportFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkEditDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        selectedRows={dataPreview?.rows.filter(row => selectedRows.has(row.__id)) || []}
        columns={dataset.columns}
        onApplyBulkEdit={(columnName, value, setNull) => {
          selectedRows.forEach(rowId => {
            onCellUpdate(rowId, columnName, setNull ? null : value);
          });
          handleCloseBulkEditDialog();
        }}
      />

      <AlertDialog open={showBackConfirmation} onOpenChange={setShowBackConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save or discard these changes before going back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex justify-between w-full">
              <AlertDialogCancel onClick={() => setShowBackConfirmation(false)}>
                Cancel
              </AlertDialogCancel>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleConfirmDiscardAndGoBack}
                  className="border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Undo2 className="h-4 w-4 mr-2 text-red-500" />
                  Discard
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleSaveAndGoBack}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DataEditor;
