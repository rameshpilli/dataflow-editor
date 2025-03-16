
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
  Save,
  Maximize2
} from 'lucide-react';
import { useDataEditor } from '../DataEditorContext';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableToolbarProps {
  showColumnManager: boolean;
  setShowColumnManager: (show: boolean) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  showColumnManager,
  setShowColumnManager,
  showFilters,
  setShowFilters,
  isFullscreen,
  onToggleFullscreen
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Edit Mode</span>
          <Switch
            checked={editMode}
            onCheckedChange={setEditMode}
            aria-label="Toggle edit mode"
          />
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                disabled={changes.length === 0}
                onClick={handleSaveChanges}
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Changes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                disabled={changes.length === 0}
                onClick={onDiscardChanges}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Discard Changes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {onToggleFullscreen && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={onToggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;
