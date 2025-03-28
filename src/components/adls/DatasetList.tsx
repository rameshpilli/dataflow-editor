
import React from 'react';
import { Dataset } from '@/types/adls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Database, FileType, ShieldCheck, Search, ExternalLink } from 'lucide-react';
import ZoomControls from './ZoomControls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

interface DatasetListProps {
  datasets: Dataset[];
  onSelectDataset: (dataset: Dataset) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  connectionInfo?: React.ReactNode;
  loadingDatasetId?: string | null;
}

const DatasetList: React.FC<DatasetListProps> = ({ 
  datasets, 
  onSelectDataset, 
  isLoading, 
  searchQuery, 
  onSearchChange,
  connectionInfo,
  loadingDatasetId
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-md border-opacity-40 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardTitle className="text-blue-700 dark:text-blue-300">Loading datasets...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (datasets.length === 0) {
    return (
      <Card className="shadow-md border-opacity-40 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardTitle className="text-blue-700 dark:text-blue-300">No datasets found</CardTitle>
          <CardDescription>
            No datasets were found in the connected storage account
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleDatasetSelect = (dataset: Dataset) => {
    console.log(`DatasetList - Selecting dataset: ${dataset.id} (${dataset.name})`);
    console.log(`Dataset details: path=${dataset.path}, format=${dataset.format}`);
    onSelectDataset(dataset);
  };

  return (
    <Card className="shadow-lg border border-blue-100 dark:border-blue-900/40 overflow-hidden rounded-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40 py-5">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex-1">
            <CardTitle className="text-blue-700 dark:text-blue-300 text-2xl">Available Datasets</CardTitle>
            <CardDescription className="text-blue-600/70 dark:text-blue-400/70 mt-1">
              Select a dataset to view and edit its data
            </CardDescription>
          </div>
          
          {connectionInfo && (
            <div className="flex-none">
              {connectionInfo}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between w-full mt-4">
          <ZoomControls />
          
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 py-2 h-10 text-sm rounded-full border-blue-200/80 bg-white/90 dark:bg-blue-950/30 dark:border-blue-800/50 text-blue-800 dark:text-blue-200 shadow-sm transition-all duration-200 hover:shadow focus:border-blue-400 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-300/30 dark:focus:ring-blue-700/30"
              id="dataset-search"
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table fullWidth={true} hoverable={true} striped={true} compact={true}>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Type</TableHead>
                <TableHead className="w-[180px] text-blue-700 dark:text-blue-300 font-semibold">Name</TableHead>
                <TableHead className="w-[180px] text-blue-700 dark:text-blue-300 font-semibold">Path</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-center">Columns</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-center">Count</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Repaired</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Last Modified</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300 font-semibold"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => {
                const totalRows = dataset.rowCount || 0;
                const repairedRows = dataset.repairedCount || 0;
                let repairPercentage = 0;
                
                if (totalRows > 0 && repairedRows > 0) {
                  repairPercentage = Math.round((repairedRows / totalRows) * 100);
                }
                
                const isLoading = loadingDatasetId === dataset.id;
                
                return (
                  <TableRow 
                    key={dataset.id} 
                    className={`transition-all duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 ${isLoading ? 'bg-blue-50/80 dark:bg-blue-900/30 animate-pulse-subtle' : 'cursor-pointer'}`}
                    onClick={() => !isLoading && handleDatasetSelect(dataset)}
                  >
                    <TableCell>
                      {dataset.format === 'delta' ? (
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md inline-flex">
                          <Database className="h-5 w-5 text-blue-500 drop-shadow-sm" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-md inline-flex">
                          <FileType className="h-5 w-5 text-green-500 drop-shadow-sm" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate text-blue-800 dark:text-blue-200">
                      {dataset.name}
                      {isLoading && <span className="ml-2 text-xs text-blue-500">Loading...</span>}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-mono text-xs truncate max-w-[180px] cursor-help bg-gray-50 dark:bg-gray-800/40 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                              {dataset.path}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="font-mono text-xs p-2 max-w-md break-all bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border-blue-100 dark:border-blue-800" side="bottom">
                            {dataset.path}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700 dark:text-blue-300 text-center">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                        {dataset.columns.length}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-center">
                      <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 rounded-full">
                        {dataset.rowCount?.toLocaleString() || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ShieldCheck className={`h-4 w-4 mr-1.5 ${repairPercentage === 100 ? 'text-green-500' : 'text-amber-500'}`} />
                        <span className="font-mono tabular-nums">
                          {repairedRows.toLocaleString()} 
                          {totalRows > 0 ? 
                            ` (${repairPercentage}%)` : 
                            ' (0%)'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400">
                      {dataset.lastModified 
                        ? format(dataset.lastModified, 'MMM d, yyyy') 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm hover:shadow transition-all duration-200 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoading) {
                            handleDatasetSelect(dataset);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Loading...' : 'View Data'}
                        {!isLoading && <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetList;
