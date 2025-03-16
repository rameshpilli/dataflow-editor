
import React from 'react';
import { Button } from '@/components/ui/button';
import { Expand, PencilLine, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

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
  zoomLevel = 100,
  onZoomChange,
  onFitToScreen,
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
        
        {onZoomChange && (
          <div className="flex items-center gap-1 px-2 border-l border-gray-200 dark:border-gray-700">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
                  className="h-8 w-8"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            
            <div className="w-16 text-xs text-center font-medium">
              {zoomLevel}%
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
                  className="h-8 w-8"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {onToggleFullscreen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleFullscreen}
                className="h-8 w-8"
              >
                {isFullscreen ? 
                  <Minimize2 className="h-4 w-4" /> : 
                  <Maximize2 className="h-4 w-4" />
                }
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
