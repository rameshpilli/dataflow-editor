import React, { useState, useRef } from 'react';
import { DatasetColumn } from '@/types/adls';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, EyeOff, Eye, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableColumnManagerProps {
  columns: DatasetColumn[];
  visibleColumns: string[];
  frozenColumns: string[];
  onVisibilityChange: (columnName: string, isVisible: boolean) => void;
  onFreezeChange: (columnName: string, isFrozen: boolean) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TableColumnManager: React.FC<TableColumnManagerProps> = ({
  columns,
  visibleColumns,
  frozenColumns,
  onVisibilityChange,
  onFreezeChange,
  onReorder,
  open,
  onOpenChange
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const draggedItemRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    if (!visibleColumns.includes(columns[index].name)) return;
    
    setDraggedIndex(index);
    setIsDragging(true);
    
    // Set the drag image to the current item
    if (e.dataTransfer && draggedItemRef.current) {
      // Create a clone for the drag image
      const clone = draggedItemRef.current.cloneNode(true) as HTMLDivElement;
      clone.style.width = `${draggedItemRef.current.offsetWidth}px`;
      clone.style.opacity = '0.6';
      clone.style.position = 'absolute';
      clone.style.top = '-1000px';
      document.body.appendChild(clone);
      
      e.dataTransfer.setDragImage(clone, 20, 20);
      
      // Clean up after drag operation ends
      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    // Only allow reordering visible columns
    if (!visibleColumns.includes(columns[index].name)) {
      setDropIndicatorIndex(null);
      return;
    }
    
    setDropIndicatorIndex(index);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    // Only allow reordering visible columns
    if (!visibleColumns.includes(columns[index].name)) {
      setDropIndicatorIndex(null);
      return;
    }
    
    setDropIndicatorIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Keep the indicator if we're still in a valid drop area
    // This makes it less "flickery"
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDropIndicatorIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    // Only allow reordering visible columns
    if (!visibleColumns.includes(columns[index].name)) return;
    
    onReorder(draggedIndex, index);
    setDraggedIndex(null);
    setDropIndicatorIndex(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropIndicatorIndex(null);
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2">Manage Columns</span>
            <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Drag to reorder, click icons to toggle visibility
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] overflow-y-auto pr-4">
          <div className="space-y-1 py-1 relative">
            {columns.map((column, index) => (
              <React.Fragment key={column.name}>
                {dropIndicatorIndex === index && draggedIndex !== index && (
                  <div className="h-1 bg-blue-500 rounded-full my-1 transform scale-y-50 animate-pulse" />
                )}
                <div 
                  ref={draggedIndex === index ? draggedItemRef : null}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md transition-all duration-150",
                    visibleColumns.includes(column.name) 
                      ? 'bg-white dark:bg-gray-800 shadow-sm' 
                      : 'bg-gray-100 dark:bg-gray-700/70 opacity-60',
                    draggedIndex === index 
                      ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-[1.02] shadow-md' 
                      : 'border border-gray-200 dark:border-gray-700',
                    isDragging && dropIndicatorIndex === index && draggedIndex !== index
                      ? 'border-t-2 border-t-blue-500'
                      : ''
                  )}
                  draggable={visibleColumns.includes(column.name)}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  aria-label={`Column: ${column.name}`}
                >
                  <div className="flex items-center space-x-3">
                    {visibleColumns.includes(column.name) && (
                      <div className="cursor-move h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">{column.name}</span>
                      <span className="text-xs text-gray-500">{column.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {visibleColumns.includes(column.name) && (
                      <div className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6",
                            frozenColumns.includes(column.name) ? "text-blue-500" : "text-gray-400"
                          )}
                          onClick={() => onFreezeChange(column.name, !frozenColumns.includes(column.name))}
                          aria-label={frozenColumns.includes(column.name) ? "Unfreeze column" : "Freeze column"}
                        >
                          {frozenColumns.includes(column.name) ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6", 
                        visibleColumns.includes(column.name) ? "text-blue-500" : "text-gray-400"
                      )}
                      onClick={() => onVisibilityChange(
                        column.name, 
                        !visibleColumns.includes(column.name)
                      )}
                      aria-label={visibleColumns.includes(column.name) ? "Hide column" : "Show column"}
                    >
                      {visibleColumns.includes(column.name) ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {visibleColumns.length} of {columns.length} columns visible
          </div>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableColumnManager;
