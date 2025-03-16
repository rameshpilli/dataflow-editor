
import React from 'react';
import { Button } from '@/components/ui/button';
import { Expand, Pencil, PencilLine } from 'lucide-react';
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
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-md border shadow-sm">
      <TooltipProvider>
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
