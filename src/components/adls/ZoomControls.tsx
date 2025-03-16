
import React from 'react';
import { Button } from '@/components/ui/button';
import { Expand, PencilLine } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ZoomControlsProps {
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onFitToScreen?: () => void;
  onFocusSelection?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  disableFocus?: boolean;
  editMode?: boolean;
  onToggleEditMode?: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  onFocusSelection,
  onToggleFullscreen,
  isFullscreen = false,
  disableFocus = false,
  editMode = false,
  onToggleEditMode
}) => {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-md border shadow-sm">
      <TooltipProvider>
        {onToggleEditMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 px-2">
                <Switch
                  id="edit-mode"
                  checked={editMode}
                  onCheckedChange={onToggleEditMode}
                />
                <Label htmlFor="edit-mode" className="text-sm cursor-pointer flex items-center">
                  <PencilLine className={`h-4 w-4 mr-1 ${editMode ? 'text-green-500' : 'text-gray-500'}`} />
                  Edit Mode
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>{editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}</TooltipContent>
          </Tooltip>
        )}
        
        {onToggleFullscreen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleFullscreen}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default ZoomControls;
