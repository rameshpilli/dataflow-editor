
import React from 'react';
import { DatasetColumn } from '@/types/adls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface DataStatsProps {
  columns: DatasetColumn[];
}

const DataStats: React.FC<DataStatsProps> = ({ columns }) => {
  // Filter columns that have stats
  const columnsWithStats = columns.filter(column => column.stats);
  
  if (columnsWithStats.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Max</TableHead>
              <TableHead>Null Count</TableHead>
              <TableHead>Total Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columnsWithStats.map((column) => (
              <TableRow key={column.name}>
                <TableCell className="font-medium">{column.name}</TableCell>
                <TableCell>{column.type}</TableCell>
                <TableCell>
                  {column.stats?.min !== undefined ? String(column.stats.min) : '-'}
                </TableCell>
                <TableCell>
                  {column.stats?.max !== undefined ? String(column.stats.max) : '-'}
                </TableCell>
                <TableCell>{column.stats?.nullCount || 0}</TableCell>
                <TableCell>{column.stats?.count || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DataStats;
