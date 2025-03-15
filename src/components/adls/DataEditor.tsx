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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
  MoveHorizontal
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  onCellUpdate: (rowId: string, columnName: string, newValue: any) => void;
  onSaveChanges: () => Promise<boolean>;
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

const DataEditor: React.FC<DataEditorProps> = ({ 
  dataset, 
  dataPreview, 
  isLoading, 
  isSaving,
  changes,
  modifiedRows,
  onCellUpdate, 
  onSaveChanges,
  onDiscardChanges,
  onLoadData,
  onGoBack
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(undefined);
  const [filters, setFilters] = useState<FilterOptions[]>([]);
  const [editCell, setEditCell] = useState<{rowId: string, columnName: string} | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterOperation, setFilterOperation] = useState<FilterOptions['operation']>('contains');
  const [filterValue, setFilterValue] = useState<string>('');
  const [showChanges, setShowChanges] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['__id']);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'comfortable' | 'compact'>('comfortable');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [lastSavedRows, setLastSavedRows] = useState<Set<string>>(new Set());
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [fullWidthTable, setFullWidthTable] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const tableRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dataPreview?.columns) {
      const initialWidths: Record<string, number> = {};
      dataPreview.columns.forEach(col => {
        if (col.type === 'boolean') {
          initialWidths[col.name] = 100;
        } else if (col.type === 'integer' || col.type === 'decimal') {
          initialWidths[col.name] = 120;
        } else if (col.type === 'timestamp' || col.type === 'date') {
          initialWidths[col.name] = 180;
        } else {
          initialWidths[col.name] = 150;
        }
      });
      setColumnWidths(prev => ({...prev, ...initialWidths}));
      setVisibleColumns(dataPreview.columns.map(col => col.name));
    }
  }, [dataPreview?.columns]);

  useEffect(() => {
    if (dataset) {
      loadData();
    }
  }, [dataset.id, page, pageSize, sortColumn, sortDirection, filters, showOnlyModified]);

  useEffect(() => {
    if (lastSavedRows.size > 0 && fadeTimeout === null) {
      const timeout = setTimeout(() => {
        setLastSavedRows(new Set());
        setFadeTimeout(null);
      }, 5000);
      setFadeTimeout(timeout);
    }

    return () => {
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [lastSavedRows, fadeTimeout]);

  const loadData = async () => {
    if (showOnlyModified) {
      return;
    }
    
    await onLoadData(dataset.id, page, pageSize, sortColumn, sortDirection, filters.length > 0 ? filters : undefined);
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

  const handleColumnSort = (columnName: string, direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      setSortColumn(undefined);
      setSortDirection(undefined);
    } else {
      setSortColumn(columnName);
      setSortDirection(direction);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const startEdit = (rowId: string, columnName: string, currentValue: any) => {
    if (!editMode) return;
    
    setEditCell({ rowId, columnName });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditCell(null);
    setEditValue(null);
  };

  const commitEdit = () => {
    if (editCell) {
      onCellUpdate(editCell.rowId, editCell.columnName, editValue);
      setEditCell(null);
      setEditValue(null);
      
      toast({
        title: "Cell updated",
        description: "Your changes have been applied but not saved yet.",
        duration: 2000
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const addFilter = () => {
    if (!filterColumn || !filterValue) return;
    
    const newFilter: FilterOptions = {
      column: filterColumn,
      operation: filterOperation,
      value: filterValue
    };
    
    setFilters(prev => [...prev, newFilter]);
    setFilterColumn('');
    setFilterValue('');
    setShowFilters(false);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalPages = () => {
    if (!dataPreview) return 1;
    return Math.ceil(dataPreview.totalRows / pageSize);
  };

  const handleVisibilityChange = (columnName: string, isVisible: boolean) => {
    if (isVisible) {
      setVisibleColumns(prev => [...prev, columnName]);
    } else {
      setVisibleColumns(prev => prev.filter(col => col !== columnName));
    }
  };

  const handleFreezeChange = (columnName: string, isFrozen: boolean) => {
    if (isFrozen) {
      setFrozenColumns(prev => [...prev, columnName]);
    } else {
      setFrozenColumns(prev => prev.filter(col => col !== columnName));
    }
  };

  const handleColumnReorder = (sourceIndex: number, destinationIndex: number) => {
    if (!dataPreview?.columns) return;
    
    const reorderedVisibleColumns = [...visibleColumns];
    const [movedColumn] = reorderedVisibleColumns.splice(
      visibleColumns.indexOf(dataPreview.columns[sourceIndex].name), 
      1
    );
    
    reorderedVisibleColumns.splice(
      visibleColumns.indexOf(dataPreview.columns[destinationIndex].name), 
      0, 
      movedColumn
    );
    
    setVisibleColumns(reorderedVisibleColumns);
  };

  const toggleRowSelection = (rowId: string) => {
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

  const toggleAllRowsSelection = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(rowsToDisplay.map(row => row.__id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkEdit = (columnName: string, value: any, setNull: boolean) => {
    const selectedRowsArray = Array.from(selectedRows);
    
    const columnInfo = dataPreview?.columns.find(col => col.name === columnName);
    const finalValue = setNull ? null : value;
    
    for (const rowId of selectedRowsArray) {
      onCellUpdate(rowId, columnName, finalValue);
    }
    
    toast({
      title: "Bulk edit applied",
      description: `Updated "${columnName}" for ${selectedRowsArray.length} row(s) to ${setNull ? 'NULL' : String(value)}`,
      duration: 3000
    });
  };

  const handleColumnEditAll = (columnName: string) => {
    setShowBulkEditDialog(true);
  };

  const handleColumnSetNull = (columnName: string, onlySelected: boolean = false) => {
    const rowIds = onlySelected 
      ? Array.from(selectedRows)
      : rowsToDisplay.map(row => row.__id);
    
    if (confirm(`Are you sure you want to set "${columnName}" to NULL for ${rowIds.length} row(s)?`)) {
      for (const rowId of rowIds) {
        onCellUpdate(rowId, columnName, null);
      }
      
      toast({
        title: "Column values updated",
        description: `Set "${columnName}" to NULL for ${rowIds.length} row(s)`,
        duration: 3000
      });
    }
  };

  const handleSaveChanges = async () => {
    const success = await onSaveChanges();
    if (success) {
      setLastSavedRows(new Set(modifiedRows));
      
      toast({
        title: "Changes saved",
        description: `Successfully saved ${changes.length} changes`,
        variant: "default"
      });
      
      setSelectedRows(new Set());
    }
  };

  const handleExportModified = () => {
    if (modifiedRows.size === 0) {
      toast({
        title: "No modified rows",
        description: "There are no modified rows to export",
        variant: "destructive"
      });
      return;
    }
    
    const modifiedRowsData = dataPreview?.rows.filter(row => modifiedRows.has(row.__id)) || [];
    
    const json = JSON.stringify(modifiedRowsData, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_modified_rows.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export complete",
      description: `Exported ${modifiedRowsData.length} modified rows to JSON`,
      duration: 3000
    });
  };

  const handleResizeColumn = (columnName: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnName]: width
    }));
  };

  const handleFitColumnsToContent = () => {
    const newWidths: Record<string, number> = {};
    dataPreview?.columns.forEach(col => {
      if (col.type === 'boolean') {
        newWidths[col.name] = 100;
      } else if (col.type === 'integer') {
        newWidths[col.name] = 120;
      } else if (col.type === 'decimal') {
        newWidths[col.name] = 140;
      } else if (col.type === 'timestamp' || col.type === 'date') {
        newWidths[col.name] = 180;
      } else {
        const maxContentLength = Math.max(
          col.name.length * 10,
          ...rowsToDisplay.map(row => {
            const value = row[col.name];
            return value ? String(value).length * 8 : 0;
          })
        );
        newWidths[col.name] = Math.min(Math.max(maxContentLength, 100), 300);
      }
    });
    
    setColumnWidths(newWidths);
    toast({
      title: "Columns resized",
      description: "Column widths have been adjusted to fit content",
      duration: 2000
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const handleFitToScreen = () => {
    setZoomLevel(100);
    if (dataPreview?.columns) {
      setVisibleColumns(dataPreview.columns.map(col => col.name));
    }
    handleFitColumnsToContent();
    toast({
      title: "View reset",
      description: "Table has been fit to screen with all columns visible",
      duration: 2000
    });
  };

  const handleFocusSelection = () => {
    if (selectedRows.size === 0) return;
    
    setZoomLevel(125);
    
    const firstSelectedRowId = Array.from(selectedRows)[0];
    const rowElement = document.getElementById(`row-${firstSelectedRowId}`);
    
    if (rowElement && tableContainerRef.current) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      rowElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        rowElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
      
      toast({
        title: "Focused on selection",
        description: `Zoomed in and centered on selected row(s)`,
        duration: 2000
      });
    }
  };

  const renderCellEditor = (rowId: string, columnName: string, value: any, columnType: string) => {
    switch (columnType) {
      case 'boolean':
        return (
          <Checkbox
            checked={!!editValue}
            onCheckedChange={(checked) => setEditValue(checked)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            autoFocus
          />
        );
      case 'integer':
      case 'decimal':
        return (
          <Input
            type="number"
            value={editValue ?? ''}
            onChange={(e) => setEditValue(e.target.valueAsNumber)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            autoFocus
            className="w-full"
          />
        );
      case 'timestamp':
      case 'date':
        return (
          <div className="flex items-center">
            <Input
              type="datetime-local"
              value={editValue ? new Date(editValue).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEditValue(date.toISOString());
              }}
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              autoFocus
              className="w-full"
            />
            <Calendar className="ml-2 h-4 w-4 text-gray-500" />
          </div>
        );
      default:
        return (
          <Input
            value={editValue ?? ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            autoFocus
            className="w-full"
          />
        );
    }
  };

  const renderCellValue = (value: any, columnType: string) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    switch (columnType) {
      case 'boolean':
        return <Checkbox checked={value} disabled />;
      case 'timestamp':
        try {
          const date = new Date(value);
          return date.toLocaleString();
        } catch {
          return value;
        }
      default:
        return String(value);
    }
  };

  const getCellClasses = (rowId: string, columnName: string) => {
    const isEditing = editCell?.rowId === rowId && editCell?.columnName === columnName;
    const isModified = modifiedRows.has(rowId);
    const isSelected = selectedRows.has(rowId);
    const isFrozen = frozenColumns.includes(columnName);
    const isRecentlySaved = lastSavedRows.has(rowId);
    
    return `
      ${editMode ? 'cursor-pointer' : ''} 
      ${isEditing ? 'bg-amber-50 dark:bg-amber-950 p-0' : ''}
      ${isModified && !isRecentlySaved ? 'bg-yellow-50 dark:bg-yellow-950' : ''}
      ${isRecentlySaved ? 'bg-green-50 dark:bg-green-950 transition-colors duration-500' : ''}
      ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}
      ${isFrozen ? 'sticky left-0 z-10 bg-white dark:bg-gray-800' : ''}
      ${viewMode === 'compact' ? 'py-1' : 'py-2'}
      ${isModified && !isRecentlySaved ? 'animate-pulse' : ''}
      transition-all duration-200
    `;
  };

  const getRowClasses = (rowId: string) => {
    const isSelected = selectedRows.has(rowId);
    const isModified = modifiedRows.has(rowId);
    const isRecentlySaved = lastSavedRows.has(rowId);
    
    let baseClass = "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";
    
    if (isSelected) {
      baseClass += " bg-blue-50 dark:bg-blue-950";
    }
    
    if (isModified && !isRecentlySaved) {
      baseClass += " border-l-4 border-yellow-400";
    }
    
    if (isRecentlySaved) {
      baseClass += " border-l-4 border-green-400 transition-colors duration-500";
    }
    
    return baseClass;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!dataPreview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No data available</CardTitle>
          <CardDescription>
            Failed to load data preview for this dataset
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const rowsToDisplay = showOnlyModified 
    ? dataPreview.rows.filter(row => modifiedRows.has(row.__id))
    : dataPreview.rows;

  const selectedRowsData = rowsToDisplay.filter(row => selectedRows.has(row.__id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onGoBack}
              className="mr-2"
            >
              <ArrowLeftCircle className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle className="text-xl">{dataset.name}</CardTitle>
            <CardDescription>{dataset.path}</CardDescription>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="flex items-center space-x-2 mr-4">
              <Switch
                id="edit-mode"
                checked={editMode}
                onCheckedChange={setEditMode}
              />
              <Label htmlFor="edit-mode">Edit Mode</Label>
            </div>
            
            <div className="flex items-center space-x-2 mr-4">
              <Switch
                id="view-modified"
                checked={showOnlyModified}
                onCheckedChange={setShowOnlyModified}
              />
              <Label htmlFor="view-modified">Show Modified Only</Label>
            </div>
            
            <div className="flex items-center space-x-2 mr-4">
              <Select
                value={viewMode}
                onValueChange={(value: 'comfortable' | 'compact') => setViewMode(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ZoomControls 
              zoomLevel={zoomLevel}
              onZoomChange={handleZoomChange}
              onFitToScreen={handleFitToScreen}
              onFocusSelection={handleFocusSelection}
              disableFocus={selectedRows.size === 0}
            />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFitColumnsToContent}
            >
              <MoveHorizontal className="mr-2 h-4 w-4" />
              Fit Columns
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowColumnManager(true)}
            >
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkEditDialog(true)}
              disabled={selectedRows.size === 0}
            >
              <Edit className="mr-2 h-4 w-4" />
              Bulk Edit ({selectedRows.size})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportModified}
              disabled={modifiedRows.size === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export Modified
            </Button>
            
            <Dialog open={showChanges} onOpenChange={setShowChanges}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={changes.length === 0}
                >
                  Changes ({changes.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Pending Changes</DialogTitle>
                  <DialogDescription>
                    Review all changes before saving
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Column</TableHead>
                        <TableHead>Old Value</TableHead>
                        <TableHead>New Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changes.map((change, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{change.rowId}</TableCell>
                          <TableCell>{change.columnName}</TableCell>
                          <TableCell>
                            {change.oldValue === null || change.oldValue === undefined 
                              ? <span className="text-gray-400 italic">null</span> 
                              : String(change.oldValue)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {change.newValue === null || change.newValue === undefined 
                              ? <span className="text-gray-400 italic">null</span> 
                              : String(change.newValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter className="sm:justify-start">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowChanges(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDiscardChanges}
              disabled={changes.length === 0}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Discard
            </Button>
            
            <Button 
              onClick={handleSaveChanges}
              disabled={changes.length === 0 || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : `Save (${changes.length})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-md"
            ref={tableContainerRef}
          >
            <ScrollArea 
              className="h-[70vh]"
              ref={tableRef}
            >
              <Table 
                zoomLevel={zoomLevel} 
                fullWidth={fullWidthTable}
                columnResizing={true}
                className="w-full"
              >
                <TableHeader className="sticky top-0 z-20 bg-white dark:bg-gray-800">
                  <TableRow>
                    <TableHead 
                      className="sticky left-0 z-30 bg-white dark:bg-gray-800"
                      minWidth={40}
                      width={40}
                    >
                      <Checkbox 
                        checked={
                          rowsToDisplay.length > 0 && 
                          selectedRows.size === rowsToDisplay.length
                        }
                        onCheckedChange={(checked) => {
                          toggleAllRowsSelection(checked === true);
                        }}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                    {dataPreview.columns
                      .filter(column => visibleColumns.includes(column.name))
                      .map((column) => (
                        <ColumnMenu
                          key={column.name}
                          column={column}
                          onSort={(direction) => handleColumnSort(column.name, direction)}
                          onEditAll={() => handleColumnEditAll(column.name)}
                          onEditSelected={() => handleColumnEditAll(column.name)}
                          onSetNull={() => handleColumnSetNull(column.name, false)}
                          onSetNullSelected={() => handleColumnSetNull(column.name, true)}
                          onHide={() => handleVisibilityChange(column.name, false)}
                          hasSelectedRows={selectedRows.size > 0}
                        >
                          <ResizableColumn
                            width={columnWidths[column.name] || 150}
                            minWidth={100}
                            onResize={(width) => handleResizeColumn(column.name, width)}
                          >
                            <TableHead 
                              className={`cursor-pointer select-none whitespace-nowrap
                                ${frozenColumns.includes(column.name) 
                                  ? 'sticky z-20 bg-white dark:bg-gray-800' : ''}
                              `}
                              style={{
                                left: frozenColumns.includes(column.name) 
                                  ? `${frozenColumns.indexOf(column.name) * 150 + 40}px` 
                                  : 'auto'
                              }}
                              onClick={() => handleSort(column.name)}
                              width={columnWidths[column.name] || 150}
                            >
                              <div className="flex items-center space-x-1">
                                <span className="truncate">{column.name}</span>
                                {sortColumn === column.name && (
                                  sortDirection === 'asc' ? (
                                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                  )
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {column.type}
                                {column.nullable && ' (nullable)'}
                              </div>
                            </TableHead>
                          </ResizableColumn>
                        </ColumnMenu>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowsToDisplay.map((row) => (
                    <TableRow 
                      key={row.__id}
                      className={getRowClasses(row.__id)}
                      id={`row-${row.__id}`}
                    >
                      <TableCell 
                        className="sticky left-0 z-10 bg-white dark:bg-gray-800"
                        onClick={() => toggleRowSelection(row.__id)}
                        width={40}
                      >
                        <Checkbox checked={selectedRows.has(row.__id)} />
                      </TableCell>
                      {dataPreview.columns
                        .filter(column => visibleColumns.includes(column.name))
                        .map((column) => {
                          const isEditing = editCell?.rowId === row.__id && editCell?.columnName === column.name;
                          
                          return (
                            <TableCell 
                              key={`${row.__id}-${column.name}`}
                              className={getCellClasses(row.__id, column.name)}
                              style={{
                                left: frozenColumns.includes(column.name) 
                                  ? `${frozenColumns.indexOf(column.name) * 150 + 40}px` 
                                  : 'auto',
                              }}
                              onClick={() => editMode && startEdit(row.__id, column.name, row[column.name])}
                              title={`${column.name}: ${row[column.name]}`}
                              width={columnWidths[column.name] || 150}
                            >
                              {isEditing ? (
                                renderCellEditor(row.__id, column.name, row[column.name], column.type)
                              ) : (
                                <div className="truncate">
                                  {renderCellValue(row[column.name], column.type)}
                                </div>
                              )}
                              {modifiedRows.has(row.__id) && lastSavedRows.has(row.__id) && (
                                <span className="absolute -right-1 -top-1 text-green-500">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </TableCell>
                          );
                      })}
                    </TableRow>
                  ))}
                  {rowsToDisplay.length === 0 && (
                    <TableRow>
                      <TableCell 
                        colSpan={visibleColumns.length + 1} 
                        className="text-center py-8"
                      >
                        No data found matching the current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">
              {rowsToDisplay.length} of {dataPreview.totalRows} rows
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
              {modifiedRows.size > 0 && ` (${modifiedRows.size} modified)`}
            </span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, page - 1))} 
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                let pageNum = page;
                if (getTotalPages() <= 5) {
                  pageNum = i + 1;
                } else {
                  const leftOffset = Math.min(2, page - 1);
                  pageNum = page - leftOffset + i;
                  
                  if (pageNum > getTotalPages()) {
                    pageNum = getTotalPages() - (4 - i);
                  }
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => handlePageChange(pageNum)}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(getTotalPages(), page + 1))} 
                  className={page >= getTotalPages() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      
      <TableColumnManager
        columns={dataPreview.columns}
        visibleColumns={visibleColumns}
        frozenColumns={frozenColumns}
        onVisibilityChange={handleVisibilityChange}
        onFreezeChange={handleFreezeChange}
        onReorder={handleColumnReorder}
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
      />
      
      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedRows={selectedRowsData}
        columns={dataPreview.columns}
        onApplyBulkEdit={handleBulkEdit}
      />
    </div>
  );
};

export default DataEditor;
