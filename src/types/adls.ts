export interface ADLSConnection {
  id: string;
  name: string;
  createdAt: Date;
  status: 'connected' | 'disconnected';
  useManagedIdentity: boolean;
  containerFilter?: string[];
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
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  containerName: string;
  lastModified: Date;
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
  validationRules?: ValidationRule[];
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
  operator: string;
  value: any;
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
}
