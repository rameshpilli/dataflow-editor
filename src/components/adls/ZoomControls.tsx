
import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Expand, Pencil } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  onFocusSelection: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  disableFocus?: boolean;
  editMode?: boolean;
  onToggleEditMode?: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  zoomLevel, 
  onZoomChange, 
  onFitToScreen,
  onFocusSelection,
  onToggleFullscreen,
  isFullscreen = false,
  disableFocus = false,
  editMode = false,
  onToggleEditMode
}) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 25, 200);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 25, 50);
    onZoomChange(newZoom);
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-md border shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut} 
              disabled={zoomLevel <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2 px-2">
          <Slider 
            className="w-24" 
            value={[zoomLevel]} 
            min={50} 
            max={200} 
            step={25}
            onValueChange={(values) => onZoomChange(values[0])}
          />
          <Select 
            value={String(zoomLevel)} 
            onValueChange={(value) => onZoomChange(parseInt(value))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue>{zoomLevel}%</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="125">125%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="175">175%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        
        {onToggleEditMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 px-2">
                <Label htmlFor="edit-mode" className="text-sm cursor-pointer">Edit Mode</Label>
                <Switch
                  id="edit-mode"
                  checked={editMode}
                  onCheckedChange={onToggleEditMode}
                />
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
