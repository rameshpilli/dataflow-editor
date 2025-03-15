
import React, { useState } from 'react';
import { DatasetColumn } from '@/types/adls';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, EyeOff, Eye } from 'lucide-react';

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    // Only allow reordering visible columns
    if (!visibleColumns.includes(columns[index].name)) return;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    // Only allow reordering visible columns
    if (!visibleColumns.includes(columns[index].name)) return;
    
    onReorder(draggedIndex, index);
    setDraggedIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] overflow-y-auto pr-4">
          <div className="space-y-2">
            {columns.map((column, index) => (
              <div 
                key={column.name}
                className={`flex items-center justify-between p-2 rounded-md ${
                  visibleColumns.includes(column.name) 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                } ${
                  draggedIndex === index ? 'border-2 border-primary' : 'border border-gray-200'
                }`}
                draggable={visibleColumns.includes(column.name)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="flex items-center space-x-4">
                  {visibleColumns.includes(column.name) && (
                    <div className="cursor-move">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{column.name}</span>
                    <span className="text-xs text-gray-500">{column.type}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {visibleColumns.includes(column.name) && (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`freeze-${column.name}`}
                        checked={frozenColumns.includes(column.name)}
                        onCheckedChange={(checked) => 
                          onFreezeChange(column.name, checked === true)
                        }
                      />
                      <Label htmlFor={`freeze-${column.name}`} className="text-xs">
                        Freeze
                      </Label>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVisibilityChange(
                      column.name, 
                      !visibleColumns.includes(column.name)
                    )}
                  >
                    {visibleColumns.includes(column.name) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableColumnManager;
