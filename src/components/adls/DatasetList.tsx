
import React from 'react';
import { Dataset } from '@/types/adls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Database, FileType, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import ZoomControls from './ZoomControls';

interface DatasetListProps {
  datasets: Dataset[];
  onSelectDataset: (dataset: Dataset) => void;
  isLoading: boolean;
}

const DatasetList: React.FC<DatasetListProps> = ({ datasets, onSelectDataset, isLoading }) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading datasets...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (datasets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No datasets found</CardTitle>
          <CardDescription>
            No datasets were found in the connected storage account
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Available Datasets</CardTitle>
          <CardDescription>
            Select a dataset to view and edit its data
          </CardDescription>
        </div>
        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onFitToScreen={() => setZoomLevel(100)}
          onFocusSelection={() => {}}
          disableFocus={true}
        />
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table zoomLevel={zoomLevel} fullWidth={true}>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Columns</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Repaired</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => {
                  // Calculate repair percentage safely
                  const totalRows = dataset.rowCount || 0;
                  const repairedRows = dataset.repairedCount || 0;
                  const repairPercentage = totalRows > 0 
                    ? Math.round((repairedRows / totalRows) * 100) 
                    : 0;
                    
                  return (
                    <TableRow key={dataset.id}>
                      <TableCell>
                        {dataset.format === 'delta' ? (
                          <Database className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileType className="h-5 w-5 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{dataset.name}</TableCell>
                      <TableCell className="font-mono text-xs">{dataset.path}</TableCell>
                      <TableCell>{dataset.columns.length}</TableCell>
                      <TableCell>{dataset.rowCount?.toLocaleString() || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ShieldCheck className={`h-4 w-4 mr-1.5 ${repairPercentage === 100 ? 'text-green-500' : 'text-amber-500'}`} />
                          {repairedRows.toLocaleString() || '0'} 
                          {totalRows > 0 ? 
                            ` (${repairPercentage}%)` : 
                            ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dataset.lastModified 
                          ? format(dataset.lastModified, 'MMM d, yyyy') 
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetList;
