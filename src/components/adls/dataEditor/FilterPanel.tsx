
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterOptions } from '@/types/adls';
import { useDataEditor } from '../DataEditorContext';

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ open, onClose }) => {
  const { 
    dataset,
    setFilters,
    setPage
  } = useDataEditor();

  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterOperation, setFilterOperation] = useState<FilterOptions['operation']>('equals');
  const [filterValue, setFilterValue] = useState<string>('');
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const handleApplyFilter = () => {
    if (filterColumn) {
      setIsApplyingFilters(true);
      const newFilter: FilterOptions = {
        column: filterColumn,
        operation: filterOperation,
        value: filterValue,
      };
      setFilters([newFilter]);
      setPage(1);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Data</DialogTitle>
          <DialogDescription>
            Create filters to show only the data you need.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="column" className="text-right">
              Column
            </Label>
            <Select 
              value={filterColumn || ''} 
              onValueChange={setFilterColumn}
              disabled={isApplyingFilters}
            >
              <SelectTrigger className="col-span-3" id="column">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="operation" className="text-right">
              Condition
            </Label>
            <Select 
              value={filterOperation} 
              onValueChange={(value) => setFilterOperation(value as FilterOptions['operation'])}
              disabled={isApplyingFilters}
            >
              <SelectTrigger className="col-span-3" id="operation">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts with</SelectItem>
                <SelectItem value="endsWith">Ends with</SelectItem>
                <SelectItem value="greaterThan">Greater than</SelectItem>
                <SelectItem value="lessThan">Less than</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              Value
            </Label>
            <Input
              id="value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="col-span-3"
              disabled={isApplyingFilters}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApplyingFilters}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilter} disabled={!filterColumn || isApplyingFilters}>
            Apply Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterPanel;
