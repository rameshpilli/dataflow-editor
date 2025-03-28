
export interface ADLSConnection {
  id: string;
  name: string;
  createdAt: Date;
  status: 'connected' | 'disconnected';
  useManagedIdentity: boolean;
  containerFilter?: string[];
  credentials: ADLSCredentials; // Added credentials property
}

export interface ADLSCredentials {
  useManagedIdentity: boolean;
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  containerFilter?: string[];
  useMockBackend?: boolean;
}

export interface Container {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  type?: string; // Added type property
  folderCount?: number; // Added folderCount property
  blobCount?: number; // Added blobCount property
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  containerName: string;
  lastModified: Date;
  folderCount?: number; // Added folderCount property
  blobCount?: number; // Added blobCount property
}

export interface Dataset {
  id: string;
  name: string;
  path: string;
  format: 'delta' | 'csv' | 'parquet' | string;
  columns: DatasetColumn[];
  rowCount?: number;
  repairedCount?: number;
  lastModified: Date;
}

export interface DatasetColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  type?: string; // Added type property
  validationRules?: ValidationRule[];
  validation?: ColumnValidation; // Added validation property
  stats?: ColumnStats; // Added stats property
}

export interface ColumnStats {
  min?: any;
  max?: any;
  count?: number;
  nullCount?: number;
  distinctCount?: number;
}

export interface ColumnValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  enum?: string[];
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'custom';
  value: string;
  errorMessage: string;
}

export interface DatasetPreview {
  datasetId: string;
  columns: DatasetColumn[];
  rows: DataRow[];
  totalRows: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DataRow {
  [key: string]: any;
  __id: string;
  __modified?: boolean;
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
  operator: string; // This is the correct property name
  value: any;
  operation?: string; // Added for backward compatibility
}

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

export interface TempStorage {
  datasetId: string;
  modifiedRows: Map<string, DataRow>;
  totalRowCount: number;
  repairedCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  rowId: string;
  columnName: string;
  message: string;
  severity?: 'error' | 'warning'; // Added severity property
}
