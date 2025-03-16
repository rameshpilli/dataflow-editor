
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
  MoveHorizontal,
  Expand
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

const STORAGE_KEY_PREFIX = 'adls-editor-';

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
  // Read initial values from localStorage or use defaults
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    
    const storedValue = localStorage.getItem(`${STORAGE_KEY_PREFIX}${dataset.id}-${key}`);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  };

  const [page, setPage] = useState(() => getInitialState('page', 1));
  const [pageSize, setPageSize] = useState(() => getInitialState('pageSize', 10));
  const [sortColumn, setSortColumn] = useState<string | undefined>(() => 
    getInitialState('sortColumn', undefined)
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(() => 
    getInitialState('sortDirection', undefined)
  );
  const [columnWidths, setColumnWidths] = useState<{ [columnName: string]: number }>(() =>
    getInitialState('columnWidths', {})
  );
  const [zoomLevel, setZoomLevel] = useState(() => getInitialState('zoomLevel', 100));
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => 
    getInitialState('visibleColumns', dataset.columns.map(col => col.name))
  );
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [alternateRowColors, setAlternateRowColors] = useState(() => 
    getInitialState('alternateRowColors', false)
  );
  const [filters, setFilters] = useState<FilterOptions[]>(() => 
    getInitialState('filters', [])
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
    getInitialState('frozenColumns', [])
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editMode, setEditMode] = useState(() => getInitialState('editMode', true));

  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (dataset.id) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-page`, JSON.stringify(page));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-pageSize`, JSON.stringify(pageSize));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-sortColumn`, JSON.stringify(sortColumn));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-sortDirection`, JSON.stringify(sortDirection));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-columnWidths`, JSON.stringify(columnWidths));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-zoomLevel`, JSON.stringify(zoomLevel));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-visibleColumns`, JSON.stringify(visibleColumns));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-alternateRowColors`, JSON.stringify(alternateRowColors));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-filters`, JSON.stringify(filters));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-frozenColumns`, JSON.stringify(frozenColumns));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${dataset.id}-editMode`, JSON.stringify(editMode));
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
    alternateRowColors,
    filters,
    frozenColumns,
    editMode
  ]);

  useEffect(() => {
    if (dataset.id) {
      loadData();
    }
  }, [dataset.id, page, pageSize, sortColumn, sortDirection, filters]);

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
    if (dataset.id) {
      await onLoadData(dataset.id, page, pageSize, sortColumn, sortDirection, filters);
    }
  }, [dataset.id, page, pageSize, sortColumn, sortDirection, filters, onLoadData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to the first page when page size changes
  };

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : undefined);
      setSortColumn(undefined);
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (columnName: string) => {
    if (sortColumn === columnName) {
      return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline-block ml-1" /> : <ChevronDown className="h-4 w-4 inline-block ml-1" />;
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
    // Implementation for fit to screen functionality
    console.log("Fit to screen");
    // This could adjust zoom level to make the table fit in the viewport
    setZoomLevel(100);
  };

  const handleFocusSelection = () => {
    // Implementation for focus on selection functionality
    console.log("Focus on selection");
    // This could scroll to and highlight the selected row(s)
    if (selectedRows.size > 0 && tableRef.current) {
      // Example implementation - find first selected row and scroll to it
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
    // Implementation for column reordering
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
        // If all rows are selected, deselect all
        setSelectedRows(new Set());
      } else {
        // Otherwise, select all rows
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
      setSortColumn(sortColumn); // Keep current column
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
  
  return (
    <Card className={cn("h-full flex flex-col", isFullscreen && "fixed inset-0 z-50")} ref={containerRef}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onGoBack} className="mr-2">
              <ArrowLeftCircle className="mr-2 h-4 w-4" />
              Back to Datasets
            </Button>
            <CardTitle>{dataset.name}</CardTitle>
          </div>
          {isFullscreen && (
            <Button variant="ghost" size="sm" onClick={handleToggleFullscreen}>
              <Expand className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
          )}
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
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setAlternateRowColors(prev => !prev)}>
              <MoveHorizontal className="mr-2 h-4 w-4" />
              Alternate Rows
            </Button>
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
              alternateRowColors={alternateRowColors}
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
                      <button 
                        onClick={() => handleSort(column.name)} 
                        className="flex items-center whitespace-nowrap"
                        style={{ width: '100%' }}
                      >
                        {column.name}
                        {getSortIndicator(column.name)}
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
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 5.5C3.5 5.22386 3.72386 5 4 5H11C11.2761 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.2761 6 11 6H4C3.72386 6 3.5 5.77614 3.5 5.5Z" fill="currentColor" />
                            <path d="M3.5 7.5C3.5 7.22386 3.72386 7 4 7H11C11.2761 7 11.5 7.22386 11.5 7.5C11.5 7.77614 11.2761 8 11 8H4C3.72386 8 3.5 7.77614 3.5 7.5Z" fill="currentColor" />
                            <path d="M3.5 9.5C3.5 9.22386 3.72386 9 4 9H11C11.2761 9 11.5 9.22386 11.5 9.5C11.5 9.77614 11.2761 10 11 10H4C3.72386 10 3.5 9.77614 3.5 9.5Z" fill="currentColor" />
                          </svg>
                        </Button>
                      </ColumnMenu>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataPreview?.rows.map(row => (
                  <TableRow key={row.__id} isHighlighted={isRowModified(row.__id)} data-row-id={row.__id}>
                    <TableCell className="w-10 sticky left-0 z-10 bg-inherit">
                      <Checkbox
                        checked={selectedRows.has(row.__id)}
                        onCheckedChange={() => handleSelectRow(row.__id)}
                      />
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
            variant="secondary"
            size="sm"
            onClick={onDiscardChanges}
            disabled={changes.length === 0 || isSaving}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Discard Changes
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSaveChanges}
            disabled={changes.length === 0 || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
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
      </CardFooter>

      {/* Column Manager Dialog */}
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

      {/* Filter Dialog */}
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

      {/* Bulk Edit Dialog */}
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
    </Card>
  );
};

export default DataEditor;
