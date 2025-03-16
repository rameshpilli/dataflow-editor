
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  Columns, 
  Filter, 
  Download, 
  Upload, 
  Undo2, 
  SlidersHorizontal, 
  Save
} from 'lucide-react';
import { useDataEditor } from '../DataEditorContext';
import { Toggle } from '@/components/ui/toggle';

interface TableToolbarProps {
  showColumnManager: boolean;
  setShowColumnManager: (show: boolean) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  showColumnManager,
  setShowColumnManager,
  showFilters,
  setShowFilters
}) => {
  const { 
    editMode, 
    setEditMode, 
    changes,
    onSaveChanges,
    onDiscardChanges
  } = useDataEditor();

  const handleSaveChanges = async () => {
    await onSaveChanges();
  };

  return (
    <div className="py-3 px-2 border-b flex flex-wrap items-center justify-between gap-2 mb-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setShowColumnManager(!showColumnManager)}
        >
          <Columns className="h-4 w-4 mr-2" />
          Columns
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Toggle
          pressed={editMode}
          onPressedChange={setEditMode}
          aria-label="Toggle edit mode"
          className="h-8 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800 dark:data-[state=on]:bg-blue-900 dark:data-[state=on]:text-blue-50"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Edit Mode
        </Toggle>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 hover:bg-slate-100 dark:hover:bg-slate-700"
          disabled={changes.length === 0}
          onClick={handleSaveChanges}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 hover:bg-slate-100 dark:hover:bg-slate-700"
          disabled={changes.length === 0}
          onClick={onDiscardChanges}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Discard
        </Button>
      </div>
    </div>
  );
};

export default TableToolbar;
