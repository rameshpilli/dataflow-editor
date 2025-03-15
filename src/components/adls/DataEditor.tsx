
import React, { useState, useEffect, useRef } from 'react';
import { Dataset, DatasetPreview, DataRow, FilterOptions, DataChange } from '@/types/adls';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Filter, Save, Undo2, ArrowLeftCircle, Columns, Calendar, Copy } from 'lucide-react';
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
  
  const tableRef = useRef<HTMLDivElement>(null);

  // Set visible columns when dataset changes
  useEffect(() => {
    if (dataPreview?.columns) {
      setVisibleColumns(dataPreview.columns.map(col => col.name));
    }
  }, [dataPreview?.columns]);

  // Load data when component parameters change
  useEffect(() => {
    if (dataset) {
      loadData();
    }
  }, [dataset.id, page, pageSize, sortColumn, sortDirection, filters, showOnlyModified]);

  const loadData = async () => {
    // If we're only showing modified rows, we don't need to make a server call
    if (showOnlyModified) {
      // Client-side filtering - we'd actually want to implement this on the server
      // but for this demo we'll just filter client-side
      return;
    }
    
    await onLoadData(dataset.id, page, pageSize, sortColumn, sortDirection, filters.length > 0 ? filters : undefined);
  };

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      // Toggle direction if already sorting by this column
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        // Reset sorting
        setSortColumn(undefined);
        setSortDirection(undefined);
      }
    } else {
      // Start sorting by this column
      setSortColumn(columnName);
      setSortDirection('asc');
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
      
      // Show visual feedback
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

  const handleSaveChanges = async () => {
    const success = await onSaveChanges();
    if (success) {
      toast({
        title: "Changes saved",
        description: `Successfully saved ${changes.length} changes`,
        variant: "default"
      });
      
      // Clear selected rows after save
      setSelectedRows(new Set());
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

  // Generate CSS classes for cells based on their state
  const getCellClasses = (rowId: string, columnName: string) => {
    const isEditing = editCell?.rowId === rowId && editCell?.columnName === columnName;
    const isModified = modifiedRows.has(rowId);
    const isSelected = selectedRows.has(rowId);
    const isFrozen = frozenColumns.includes(columnName);
    
    return `
      ${editMode ? 'cursor-pointer' : ''} 
      ${isEditing ? 'bg-amber-50 dark:bg-amber-950 p-0' : ''}
      ${isModified ? 'bg-green-50 dark:bg-green-950' : ''}
      ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}
      ${isFrozen ? 'sticky left-0 z-10 bg-white dark:bg-gray-800' : ''}
      ${viewMode === 'compact' ? 'py-1' : 'py-2'}
      transition-all duration-200
    `;
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

  // Only show rows that are in the modifiedRows set when showOnlyModified is true
  const rowsToDisplay = showOnlyModified 
    ? dataPreview.rows.filter(row => modifiedRows.has(row.__id))
    : dataPreview.rows;

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
          <div className="flex items-center space-x-2">
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
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(
                  Array.from(modifiedRows).map(rowId => 
                    dataPreview.rows.find(row => row.__id === rowId)
                  )
                ));
                toast({
                  title: "Copied to clipboard",
                  description: `${modifiedRows.size} modified rows copied to clipboard`,
                });
              }}
              disabled={modifiedRows.size === 0}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Modified
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
            
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Data</DialogTitle>
                  <DialogDescription>
                    Add filters to narrow down the displayed data
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="filter-column">Column</Label>
                    <Select value={filterColumn} onValueChange={setFilterColumn}>
                      <SelectTrigger id="filter-column">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataset.columns.map(column => (
                          <SelectItem key={column.name} value={column.name}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="filter-operation">Operation</Label>
                    <Select value={filterOperation} onValueChange={(val: any) => setFilterOperation(val)}>
                      <SelectTrigger id="filter-operation">
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
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="filter-value">Value</Label>
                    <Input
                      id="filter-value"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Filter value"
                    />
                  </div>
                </div>
                {filters.length > 0 && (
                  <div className="border rounded-md p-4 mb-4">
                    <h4 className="font-medium mb-2">Active Filters</h4>
                    <div className="space-y-2">
                      {filters.map((filter, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>
                            {filter.column} {filter.operation} "{filter.value}"
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFilter(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" onClick={addFilter}>
                    Add Filter
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setFilters([])}>
                    Clear All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
          <div className="border rounded-md overflow-hidden">
            <div 
              className="overflow-x-auto" 
              style={{ maxHeight: '70vh' }}
              ref={tableRef}
            >
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-white dark:bg-gray-800">
                  <TableRow>
                    <TableHead 
                      className="sticky left-0 z-30 bg-white dark:bg-gray-800 w-10"
                    >
                      <Checkbox 
                        checked={
                          rowsToDisplay.length > 0 && 
                          selectedRows.size === rowsToDisplay.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows(new Set(rowsToDisplay.map(row => row.__id)));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    {dataPreview.columns
                      .filter(column => visibleColumns.includes(column.name))
                      .map((column) => (
                        <TableHead 
                          key={column.name}
                          className={`cursor-pointer select-none whitespace-nowrap
                            ${frozenColumns.includes(column.name) 
                              ? 'sticky z-20 bg-white dark:bg-gray-800' : ''}
                          `}
                          style={{
                            left: frozenColumns.includes(column.name) 
                              ? `${frozenColumns.indexOf(column.name) * 150}px` 
                              : 'auto',
                            minWidth: '150px'
                          }}
                          onClick={() => handleSort(column.name)}
                        >
                          <div className="flex items-center">
                            {column.name}
                            {sortColumn === column.name && (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              )
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {column.type}
                            {column.nullable && ' (nullable)'}
                          </div>
                        </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowsToDisplay.map((row) => (
                    <TableRow 
                      key={row.__id}
                      className={`${
                        selectedRows.has(row.__id) ? 'bg-blue-50 dark:bg-blue-950' : ''
                      } ${
                        modifiedRows.has(row.__id) ? 'animate-[pulse_2s_ease-in-out]' : ''
                      } hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                    >
                      <TableCell 
                        className="sticky left-0 z-10 bg-white dark:bg-gray-800 w-10"
                        onClick={() => toggleRowSelection(row.__id)}
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
                                  ? `${frozenColumns.indexOf(column.name) * 150}px` 
                                  : 'auto'
                              }}
                              onClick={() => editMode && startEdit(row.__id, column.name, row[column.name])}
                              title={`Original value: ${row[column.name]}`}
                            >
                              {isEditing ? (
                                renderCellEditor(row.__id, column.name, row[column.name], column.type)
                              ) : (
                                renderCellValue(row[column.name], column.type)
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
            </div>
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
                  // Calculate page numbers for pagination
                  const leftOffset = Math.min(2, page - 1);
                  pageNum = page - leftOffset + i;
                  
                  // Ensure we don't exceed total pages
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
    </div>
  );
};

export default DataEditor;
