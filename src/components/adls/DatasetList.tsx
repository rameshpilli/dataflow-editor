
import React from 'react';
import { Dataset } from '@/types/adls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Database, FileType } from 'lucide-react';

interface DatasetListProps {
  datasets: Dataset[];
  onSelectDataset: (dataset: Dataset) => void;
  isLoading: boolean;
}

const DatasetList: React.FC<DatasetListProps> = ({ datasets, onSelectDataset, isLoading }) => {
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
      <CardHeader>
        <CardTitle>Available Datasets</CardTitle>
        <CardDescription>
          Select a dataset to view and edit its data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Columns</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((dataset) => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DatasetList;
