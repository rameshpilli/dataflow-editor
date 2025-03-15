
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatasetColumn, DataRow } from '@/types/adls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Calendar } from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRows: DataRow[];
  columns: DatasetColumn[];
  onApplyBulkEdit: (columnName: string, value: any, setNull: boolean) => void;
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  onOpenChange,
  selectedRows,
  columns,
  onApplyBulkEdit
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [editValue, setEditValue] = useState<any>('');
  const [setToNull, setSetToNull] = useState(false);
  const [columnType, setColumnType] = useState<string>('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedColumn('');
      setEditValue('');
      setSetToNull(false);
      setColumnType('');
    }
  }, [open]);

  // Update column type when selected column changes
  useEffect(() => {
    if (selectedColumn) {
      const column = columns.find(col => col.name === selectedColumn);
      if (column) {
        setColumnType(column.type);
        // Reset edit value when column changes
        setEditValue('');
        setSetToNull(false);
      }
    }
  }, [selectedColumn, columns]);

  const handleApply = () => {
    if (selectedColumn) {
      onApplyBulkEdit(selectedColumn, editValue, setToNull);
      onOpenChange(false);
    }
  };

  const renderValueInput = () => {
    if (setToNull) return null;

    switch (columnType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="value-input"
              checked={!!editValue}
              onCheckedChange={(checked) => setEditValue(!!checked)}
            />
            <Label htmlFor="value-input">True</Label>
          </div>
        );
      case 'integer':
      case 'decimal':
        return (
          <Input
            id="value-input"
            type="number"
            value={editValue !== '' ? editValue : ''}
            onChange={(e) => setEditValue(e.target.valueAsNumber || 0)}
            placeholder="Enter numeric value"
          />
        );
      case 'timestamp':
      case 'date':
        return (
          <div className="flex items-center">
            <Input
              id="value-input"
              type="datetime-local"
              value={editValue ? new Date(editValue).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEditValue(date.toISOString());
              }}
              placeholder="Select date/time"
              className="w-full"
            />
            <Calendar className="ml-2 h-4 w-4 text-gray-500" />
          </div>
        );
      default:
        return (
          <Input
            id="value-input"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit Selected Rows</DialogTitle>
          <DialogDescription>
            Apply the same change to all {selectedRows.length} selected rows
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="column-select">Select Column to Edit</Label>
            <Select 
              value={selectedColumn} 
              onValueChange={setSelectedColumn}
            >
              <SelectTrigger id="column-select">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map(column => (
                  <SelectItem key={column.name} value={column.name}>
                    {column.name} ({column.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedColumn && (
            <>
              <div className="flex items-center space-x-3">
                <Switch
                  id="null-toggle"
                  checked={setToNull}
                  onCheckedChange={setSetToNull}
                />
                <Label htmlFor="null-toggle">Set values to NULL</Label>
              </div>
              
              {!setToNull && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="value-input">New Value</Label>
                  {renderValueInput()}
                </div>
              )}
              
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 mt-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This will update the &ldquo;{selectedColumn}&rdquo; column for all {selectedRows.length} selected rows.
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={!selectedColumn}
          >
            Apply to {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;
