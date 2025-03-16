
import React, { useRef } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronUp, 
  ChevronDown,
  PenLine,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ColumnMenu from '../ColumnMenu';
import { useDataEditor } from '../DataEditorContext';

interface DataTableProps {
  setBulkEditColumn: (column: string | null) => void;
  setIsBulkEditDialogOpen: (open: boolean) => void;
}

const DataTable: React.FC<DataTableProps> = ({ setBulkEditColumn, setIsBulkEditDialogOpen }) => {
  const { 
    dataset,
    dataPreview,
    sortColumn, 
    sortDirection,
    visibleColumns,
    columnWidths,
    frozenColumns,
    isColumnResizing,
    selectedRows,
    selectedCellId,
    editMode,
    zoomLevel,
    handleSelectAllRows,
    handleSelectRow,
    onCellUpdate,
    handleSort,
    isRowModified,
    isAllRowsSelected,
    toggleColumnVisibility,
    setSelectedCellId
  } = useDataEditor();

  const tableRef = useRef<HTMLTableElement>(null);

  const getSortIndicator = (columnName: string) => {
    if (sortColumn === columnName) {
      return sortDirection === 'asc' 
        ? <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" /> 
        : <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
    return <ArrowUpDown className="h-4 w-4 opacity-20 group-hover:opacity-60" />;
  };

  const handleOpenBulkEditDialog = (columnName: string) => {
    setBulkEditColumn(columnName);
    setIsBulkEditDialogOpen(true);
  };

  const handleColumnMenuSort = (direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      // Reset sorting
    } else {
      // Sort by direction
    }
  };

  const handleCellClick = (rowId: string, columnName: string) => {
    setSelectedCellId(`${rowId}-${columnName}`);
  };

  return (
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
                  index === 0 && !frozenColumns.includes(column.name) && "pl-4",
                  sortColumn === column.name ? "bg-blue-50 dark:bg-blue-900/30" : ""
                )}
                isSorted={sortColumn === column.name}
                sortDirection={sortColumn === column.name ? sortDirection : undefined}
              >
                <div className="flex items-center justify-between w-full">
                  <button 
                    onClick={() => handleSort(column.name)} 
                    className="flex items-center whitespace-nowrap font-medium group"
                    title={`Sort by ${column.name}`}
                  >
                    <span className={cn(
                      "transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                      sortColumn === column.name ? "text-blue-600 dark:text-blue-400" : ""
                    )}>
                      {column.name}
                    </span>
                    <div className="w-6 h-4 flex items-center justify-center ml-1">
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
                    <button className="p-0 h-6 w-6 opacity-60 hover:opacity-100 transition-opacity">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 5.5C3.5 5.22386 3.72386 5 4 5H11C11.2761 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.2761 6 11 6H4C3.72386 6 3.5 5.77614 3.5 5.5Z" fill="currentColor" />
                        <path d="M3.5 7.5C3.5 7.22386 3.72386 7 4 7H11C11.2761 7 11.5 7.22386 11.5 7.5C11.5 7.77614 11.2761 8 11 8H4C3.72386 8 3.5 7.77614 3.5 7.5Z" fill="currentColor" />
                        <path d="M3.5 9.5C3.5 9.22386 3.72386 9 4 9H11C11.2761 9 11.5 9.22386 11.5 9.5C11.5 9.77614 11.2761 10 11 10H4C3.72386 10 3.5 9.77614 3.5 9.5Z" fill="currentColor" />
                      </svg>
                    </button>
                  </ColumnMenu>
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
              {dataset.columns.filter(col => visibleColumns.includes(col.name)).map(column => (
                <TableCell 
                  key={`${row.__id}-${column.name}`}
                  className={cn(
                    frozenColumns.includes(column.name) && "sticky left-10 z-10",
                    "transition-colors",
                    column.type === 'number' ? "text-right font-mono tabular-nums" : "",
                    selectedCellId === `${row.__id}-${column.name}` && "bg-blue-100 dark:bg-blue-900/40",
                  )}
                  onClick={() => handleCellClick(row.__id, column.name)}
                >
                  {editMode ? (
                    <Input
                      value={row[column.name] !== null ? String(row[column.name]) : ''}
                      onChange={e => onCellUpdate(row.__id, column.name, e.target.value)}
                      className="h-8 bg-transparent border-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <>{row[column.name] !== null ? String(row[column.name]) : ''}</>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
