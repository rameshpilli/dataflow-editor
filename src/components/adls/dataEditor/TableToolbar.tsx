
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
import { toast } from '@/hooks/use-toast';

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
    try {
      await onSaveChanges();
      toast({
        title: "Changes saved",
        description: `Successfully saved ${changes.length} changes`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error saving changes",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  const handleDiscardChanges = () => {
    try {
      onDiscardChanges();
      toast({
        title: "Changes discarded",
        description: "All changes have been discarded",
        variant: "default",
      });
    } catch (error) {
      console.error('Error discarding changes:', error);
      toast({
        title: "Error discarding changes",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-3 px-2 border-b flex flex-wrap items-center justify-between gap-2 mb-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowColumnManager(!showColumnManager)}
                aria-label="Manage columns"
              >
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage visible columns</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Manage filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage data filters</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Edit Mode</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  checked={editMode}
                  onCheckedChange={setEditMode}
                  aria-label="Toggle edit mode"
                />
              </TooltipTrigger>
              <TooltipContent>{editMode ? "Disable edit mode" : "Enable edit mode"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                aria-label="Save changes"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {changes.length === 0 ? "No changes to save" : `Save ${changes.length} changes`}
            </TooltipContent>
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
                onClick={handleDiscardChanges}
                aria-label="Discard changes"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {changes.length === 0 ? "No changes to discard" : `Discard ${changes.length} changes`}
            </TooltipContent>
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
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;
