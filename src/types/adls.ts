export interface ADLSCredentials {
  useManagedIdentity?: boolean;
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  containerFilter?: string[];
}

export interface ADLSConnection {
  id: string;
  name: string;
  credentials: ADLSCredentials;
  isConnected?: boolean;
  lastConnected?: Date;
}

export interface Container {
  id: string;
  name: string;
  type: 'ingress' | 'bronze' | 'silver' | 'gold' | 'other';
  lastModified?: Date;
  folderCount?: number;
  blobCount?: number;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  containerId: string;
  parentFolderId?: string;
  lastModified?: Date;
  folderCount?: number;
  blobCount?: number;
}

export interface Blob {
  id: string;
  name: string;
  path: string;
  containerId: string;
  folderId?: string;
  size: number;
  contentType: string;
  lastModified: Date;
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
  // Schema validation rules
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface Dataset {
  id: string;
  name: string;
  path: string;
  format: 'delta' | 'parquet';
  columns: DatasetColumn[];
  rowCount?: number;
  repairedCount?: number;
  lastModified?: Date;
  comments?: Comment[];
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
  totalPages: number; // Added totalPages property
}

export interface TempStorage {
  datasetId: string;
  modifiedRows: Map<string, DataRow>;
  totalRowCount: number;
  repairedCount: number;
  lastSaved?: Date;
}

// New interfaces for comments feature
export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  createdBy: string;
  rowId?: string;
  columnName?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  rowId: string;
  columnName: string;
  message: string;
  severity: 'error' | 'warning';
}
