
import React from 'react';
import { Dataset } from '@/types/adls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Database, FileType, ShieldCheck, Search } from 'lucide-react';
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
}

const DatasetList: React.FC<DatasetListProps> = ({ 
  datasets, 
  onSelectDataset, 
  isLoading, 
  searchQuery, 
  onSearchChange,
  connectionInfo
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

  return (
    <Card className="shadow-lg border border-blue-100 dark:border-blue-900/40 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40">
        <div>
          <CardTitle className="text-blue-700 dark:text-blue-300">Available Datasets</CardTitle>
          <CardDescription>
            Select a dataset to view and edit its data
          </CardDescription>
        </div>
        <div className="flex items-center gap-5">
          {connectionInfo && (
            <div className="mr-2">
              {connectionInfo}
            </div>
          )}
          <div className="relative w-60">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 py-1 h-8 text-sm border-gray-200 dark:border-gray-700"
              id="dataset-search"
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => onSearchChange('')}
              >
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
          <ZoomControls />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table fullWidth={true} hoverable={true} striped={true} compact={true}>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-700 dark:text-blue-300">Type</TableHead>
                <TableHead className="w-[180px] text-blue-700 dark:text-blue-300">Name</TableHead>
                <TableHead className="w-[180px] text-blue-700 dark:text-blue-300">Path</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300">Columns</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300">Count</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300">Repaired</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300">Last Modified</TableHead>
                <TableHead className="text-blue-700 dark:text-blue-300"></TableHead>
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
                    
                return (
                  <TableRow key={dataset.id} className="transition-all duration-150">
                    <TableCell>
                      {dataset.format === 'delta' ? (
                        <Database className="h-5 w-5 text-blue-500 drop-shadow-sm" />
                      ) : (
                        <FileType className="h-5 w-5 text-green-500 drop-shadow-sm" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">
                      {dataset.name}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-mono text-xs truncate max-w-[180px] cursor-help">
                              {dataset.path}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="font-mono text-xs p-2 max-w-md break-all bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border-blue-100 dark:border-blue-800" side="bottom">
                            {dataset.path}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700 dark:text-blue-300">{dataset.columns.length}</TableCell>
                    <TableCell className="font-mono tabular-nums">{dataset.rowCount?.toLocaleString() || 'Unknown'}</TableCell>
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
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm"
                        onClick={() => onSelectDataset(dataset)}
                      >
                        View Data
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
