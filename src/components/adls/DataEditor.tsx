import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import TableColumnManager from './TableColumnManager';
import BulkEditDialog from './BulkEditDialog';
import { Dataset, DatasetPreview, DataRow, FilterOptions, DataChange } from '@/types/adls';
import { toast } from '@/hooks/use-toast';
import { DataEditorProvider } from './DataEditorContext';
import DataHeader from './dataEditor/DataHeader';
import TableToolbar from './dataEditor/TableToolbar';
import DataTable from './dataEditor/DataTable';
import PaginationControls from './dataEditor/PaginationControls';
import FilterPanel from './dataEditor/FilterPanel';
import ZoomControls from './ZoomControls';

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

const DataEditor: React.FC<DataEditorProps> = (props) => {
  const { 
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
  } = props;

  console.log("DataEditor - Rendering with dataset:", dataset?.id);
  console.log("DataEditor - Data preview available:", !!dataPreview);
  console.log("DataEditor - Is loading:", isLoading);
  console.log("DataEditor - Dataset details:", {
    name: dataset?.name,
    rowCount: dataset?.rowCount,
    columnCount: dataset?.columns?.length
  });

  if (dataPreview) {
    console.log("DataEditor - Preview details:", {
      rowCount: dataPreview.rows.length,
      totalRows: dataPreview.totalRows,
      page: dataPreview.page,
      pageSize: dataPreview.pageSize
    });
  }

  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditColumn, setBulkEditColumn] = useState<string | null>(null);
  const [bulkEditValue, setBulkEditValue] = useState<string>('');
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    dataset.columns.map(col => col.name)
  );
  const [frozenColumns, setFrozenColumns] = useState<string[]>([]);
  
  const [selectedRows, setSelectedRows] = useState<DataRow[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleToggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen]);

  useEffect(() => {
    console.log("DataEditor - Changes:", changes.length);
    console.log("DataEditor - Modified rows:", modifiedRows.size);
  }, [changes, modifiedRows]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => {
      const newState = !prev;
      
      if (newState) {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
        }
      }
      
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        
        if (scrollAreaRef.current) {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }

        if (!newState && mainContentRef.current) {
          mainContentRef.current.style.display = 'flex';
          mainContentRef.current.style.flexDirection = 'column';
          mainContentRef.current.style.flexGrow = '1';
        }
        
        if (footerRef.current) {
          footerRef.current.style.display = 'flex';
          footerRef.current.style.visibility = 'visible';
        }
      }, 100);
      
      return newState;
    });
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
    console.log('Reordering columns', sourceIndex, destinationIndex);
  };

  const handleBulkEditApply = (columnName: string, value: any, setNull: boolean) => {
    console.log('Applying bulk edit', { columnName, value, setNull });
  };

  return (
    <DataEditorProvider {...props}>
      <Card 
        className={cn(
          "h-full flex flex-col relative transition-all duration-300 ease-in-out",
          isFullscreen 
            ? "fixed inset-0 z-50 rounded-none border-none shadow-2xl animate-fullscreen-enter" 
            : "animate-fullscreen-exit"
        )} 
        ref={containerRef}
      >
        <DataHeader 
          onBackConfirmation={showBackConfirmation}
          setShowBackConfirmation={setShowBackConfirmation}
        />

        <div className="absolute right-4 top-4 z-50">
          <ZoomControls 
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>

        <CardContent 
          className={cn(
            "overflow-hidden flex-grow pb-1 transition-all duration-300 ease-in-out",
            isFullscreen ? "h-[calc(100vh-190px)]" : "h-[calc(100vh-350px)]"
          )}
          ref={mainContentRef}
        >
          <TableToolbar 
            showColumnManager={showColumnManager}
            setShowColumnManager={setShowColumnManager}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          <ScrollArea 
            className={cn(
              "transition-all duration-300 ease-in-out",
              isFullscreen ? "h-[calc(100vh-190px)]" : "h-[calc(100vh-350px)]"
            )}
            ref={scrollAreaRef}
          >
            <DataTable 
              setBulkEditColumn={setBulkEditColumn}
              setIsBulkEditDialogOpen={setIsBulkEditDialogOpen}
            />
          </ScrollArea>
        </CardContent>

        <CardFooter 
          className={cn(
            "pt-4 pb-6 flex-col gap-4", 
            isFullscreen && "z-50 bg-white dark:bg-gray-900 border-t"
          )} 
          ref={footerRef}
        >
          <PaginationControls />
        </CardFooter>
      </Card>

      <TableColumnManager 
        open={showColumnManager} 
        onOpenChange={() => setShowColumnManager(false)}
        columns={dataset.columns}
        visibleColumns={visibleColumns}
        frozenColumns={frozenColumns}
        onVisibilityChange={handleVisibilityChange}
        onFreezeChange={handleFreezeChange}
        onReorder={handleColumnReorder}
      />

      <FilterPanel 
        open={showFilters}
        onClose={() => setShowFilters(false)}
      />

      <BulkEditDialog 
        open={isBulkEditDialogOpen}
        onOpenChange={() => {
          setIsBulkEditDialogOpen(false);
          setBulkEditColumn(null);
          setBulkEditValue('');
        }}
        columns={dataset.columns}
        selectedRows={selectedRows}
        onApplyBulkEdit={handleBulkEditApply}
      />
    </DataEditorProvider>
  );
};

export default DataEditor;
