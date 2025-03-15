
export interface ADLSCredentials {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  useManagedIdentity?: boolean;
}

export interface ADLSConnection {
  id: string;
  name: string;
  credentials: ADLSCredentials;
  isConnected: boolean;
  lastConnected?: Date;
}

export interface DatasetColumn {
  name: string;
  type: string;
  nullable: boolean;
  stats?: {
    min?: any;
    max?: any;
    count?: number;
    nullCount?: number;
  };
}

export interface Dataset {
  id: string;
  name: string;
  path: string;
  format: 'delta' | 'parquet';
  columns: DatasetColumn[];
  rowCount?: number;
  lastModified?: Date;
}

export interface DataRow {
  [key: string]: any;
  __id: string; // Unique identifier for the row
  __modified?: boolean; // Flag to track if row has been modified
}

export interface DataChange {
  rowId: string;
  columnName: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export interface FilterOptions {
  column: string;
  operation: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface DatasetPreview {
  columns: DatasetColumn[];
  rows: DataRow[];
  totalRows: number;
  page: number;
  pageSize: number;
}
