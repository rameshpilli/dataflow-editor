
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
  Maximize2,
  AlertTriangle
} from 'lucide-react';
import { useDataEditor } from '../DataEditorContext';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
    modifiedRows,
    onSaveChanges,
    onDiscardChanges
  } = useDataEditor();

  console.log("TableToolbar - Edit mode:", editMode);
  console.log("TableToolbar - Changes count:", changes.length);
  console.log("TableToolbar - Modified rows count:", modifiedRows.size);

  const handleSaveChanges = async () => {
    console.log("Attempting to save changes");
    try {
      await onSaveChanges();
      toast({
        title: "Changes saved",
        description: `Successfully saved changes to ${modifiedRows.size} rows`,
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
    console.log("Attempting to discard changes");
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

  const handleToggleEditMode = (checked: boolean) => {
    console.log("Toggling edit mode to:", checked);
    setEditMode(checked);
    
    if (checked) {
      toast({
        title: "Edit mode enabled",
        description: "You can now edit cells in the table",
        variant: "default",
      });
    } else {
      if (changes.length > 0) {
        toast({
          title: "Edit mode disabled",
          description: `You have unsaved changes to ${modifiedRows.size} rows`,
          variant: "default",
        });
      } else {
        toast({
          title: "Edit mode disabled",
          variant: "default",
        });
      }
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
          <span className={`text-sm font-medium ${editMode ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            Edit Mode
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
              {editMode ? 'ON' : 'OFF'}
            </span>
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`p-0.5 rounded-md transition-colors ${editMode ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                  <Switch
                    checked={editMode}
                    onCheckedChange={handleToggleEditMode}
                    aria-label="Toggle edit mode"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>{editMode ? "Disable edit mode" : "Enable edit mode"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {changes.length > 0 && (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center px-2.5">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
            <span className="text-xs">
              {modifiedRows.size} {modifiedRows.size === 1 ? 'row' : 'rows'} with unsaved changes
            </span>
          </Badge>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={changes.length > 0 ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${changes.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                disabled={changes.length === 0}
                onClick={handleSaveChanges}
                aria-label="Save changes"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {changes.length === 0 ? "No changes to save" : `Save changes to ${modifiedRows.size} rows`}
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
              {changes.length === 0 ? "No changes to discard" : `Discard changes to ${modifiedRows.size} rows`}
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
