
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Columns, 
  Filter, 
  FileDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import ZoomControls from '../ZoomControls';
import { useDataEditor } from '../DataEditorContext';

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
    dataset,
    dataPreview,
    filters, 
    setFilters,
    zoomLevel,
    setZoomLevel,
    selectedRows,
    isFullscreen,
    setIsFullscreen,
    editMode,
    setEditMode
  } = useDataEditor();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const handleClearFilters = () => {
    setFilters([]);
  };

  const handleFitToScreen = () => {
    setZoomLevel(100);
  };

  const handleFocusSelection = () => {
    if (selectedRows.size > 0) {
      // Find the first selected row and scroll to it
      // This requires direct DOM manipulation, handled elsewhere
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleToggleEditMode = () => {
    setEditMode(!editMode);
    
    toast({
      title: editMode ? "Edit mode disabled" : "Edit mode enabled",
      description: editMode 
        ? "Cells are now read-only" 
        : "You can now edit cells by clicking on them",
    });
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleExportData = () => {
    if (!dataPreview || !dataset) return;
    
    const filename = `${dataset.name}-export-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'csv') {
      exportToCSV(dataPreview.rows, dataset.columns, filename);
    } else {
      exportToJSON(dataPreview.rows, dataset.columns, filename);
    }
    
    setShowExportDialog(false);
  };

  const exportToCSV = (data: any[], columns: any[], filename: string) => {
    if (!data || !data.length) {
      toast({
        title: "Export failed",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const visibleColumns = columns.map(col => col.name);
    
    const header = visibleColumns.join(',');
    
    const csvRows = data.map(row => {
      return visibleColumns.map(colName => {
        const value = row[colName];
        if (value === null || value === undefined) return '';
        const valueStr = String(value);
        return valueStr.includes(',') || valueStr.includes('"') 
          ? `"${valueStr.replace(/"/g, '""')}"` 
          : valueStr;
      }).join(',');
    });
    
    const csvContent = [header, ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `Dataset exported as ${filename}.csv`,
    });
  };

  const exportToJSON = (data: any[], columns: any[], filename: string) => {
    if (!data || !data.length) {
      toast({
        title: "Export failed",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }
    
    const visibleColumns = columns.map(col => col.name);
    
    const filteredData = data.map(row => {
      const filteredRow: Record<string, any> = {};
      visibleColumns.forEach(colName => {
        filteredRow[colName] = row[colName];
      });
      return filteredRow;
    });
    
    const jsonContent = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `Dataset exported as ${filename}.json`,
    });
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => setShowColumnManager(true)}>
          <Columns className="mr-2 h-4 w-4" />
          Columns
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
        {filters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
            <Badge variant="outline" className="ml-2 bg-blue-50 dark:bg-blue-900/20">{filters.length}</Badge>
          </Button>
        )}
      </div>
      <ZoomControls 
        zoomLevel={zoomLevel} 
        onZoomChange={setZoomLevel}
        onFitToScreen={handleFitToScreen}
        onFocusSelection={handleFocusSelection}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        disableFocus={selectedRows.size === 0}
        editMode={editMode}
        onToggleEditMode={handleToggleEditMode}
      />

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="export-format" className="mb-2 block">Export Format</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'json')}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onClick={handleExportData}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableToolbar;
