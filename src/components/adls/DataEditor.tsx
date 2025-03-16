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
  const [columnWidths, setColumnWidths] = useState<{ [columnName: string]: number }>({});
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(dataset.columns.map(col => col.name));
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [alternateRowColors, setAlternateRowColors] = useState(false);
  const [filters, setFilters] = useState<FilterOptions[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterOperation, setFilterOperation] = useState<FilterOptions['operation']>('equals');
  const [filterValue, setFilterValue] = useState<string>('');
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditColumn, setBulkEditColumn] = useState<string | null>(null);
  const [bulkEditValue, setBulkEditValue] = useState<string>('');

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (dataset.id) {
      loadData();
    }
  }, [dataset.id, page, pageSize, sortColumn, sortDirection, filters]);

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

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns(prevColumns => {
      if (prevColumns.includes(columnName)) {
        return prevColumns.filter(col => col !== columnName);
      } else {
        return [...prevColumns, columnName];
      }
    });
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
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onGoBack} className="mr-2">
            <ArrowLeftCircle className="mr-2 h-4 w-4" />
            Back to Datasets
          </Button>
          <CardTitle>{dataset.name}</CardTitle>
        </div>
        <CardDescription>
          {dataPreview ? `Displaying ${dataPreview.rows.length} of ${dataPreview.totalRows} rows` : 'Loading data...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto h-full flex-grow pb-4">
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
          <ZoomControls zoomLevel={zoomLevel} onZoomChange={handleZoomChange} />
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <Table 
            fullWidth
            zoomLevel={zoomLevel}
            columnResizing={isColumnResizing}
            alternateRowColors={alternateRowColors}
            ref={tableRef}
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllRowsSelected()}
                    onCheckedChange={handleSelectAllRows}
                  />
                </TableHead>
                {dataset.columns.filter(col => visibleColumns.includes(col.name)).map(column => (
                  <ResizableColumn key={column.name} column={column} onResize={handleColumnResize}>
                    <TableHead 
                      width={columnWidths[column.name]}
                      minWidth={100}
                    >
                      <div className="flex items-center">
                        <button onClick={() => handleSort(column.name)} className="flex items-center">
                          {column.name}
                          {getSortIndicator(column.name)}
                        </button>
                        <ColumnMenu column={column} onOpenBulkEditDialog={handleOpenBulkEditDialog} />
                      </div>
                    </TableHead>
                  </ResizableColumn>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataPreview?.rows.map(row => (
                <TableRow key={row.__id} isHighlighted={isRowModified(row.__id)}>
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedRows.has(row.__id)}
                      onCheckedChange={() => handleSelectRow(row.__id)}
                    />
                  </TableCell>
                  {dataset.columns.filter(col => visibleColumns.includes(col.name)).map(column => (
                    <TableCell 
                      key={`${row.__id}-${column.name}`}
                      width={columnWidths[column.name]}
                    >
                      <Input
                        type="text"
                        value={row[column.name] || ''}
                        className="w-full h-8"
                        onChange={(e) => onCellUpdate(row.__id, column.name, e.target.value)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            variant="primary"
            size="sm"
            onClick={onSaveChanges}
            disabled={changes.length === 0 || isSaving}
            isLoading={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              href="#"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            />
            <PaginationItem>
              <PaginationLink href="#">{page}</PaginationLink>
            </PaginationItem>
            <PaginationNext
              href="#"
              onClick={() => handlePageChange(page + 1)}
              disabled={dataPreview ? page * pageSize >= dataPreview.totalRows : true}
            />
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
            onToggleColumn={toggleColumnVisibility}
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
              <Select value={filterOperation} onValueChange={setFilterOperation}>
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
        isOpen={isBulkEditDialogOpen}
        onClose={handleCloseBulkEditDialog}
        columnName={bulkEditColumn}
        value={bulkEditValue}
        onValueChange={(e) => setBulkEditValue(e.target.value)}
        onApply={handleBulkEditApply}
      />
    </Card>
  );
};

export default DataEditor;
