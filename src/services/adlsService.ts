import { ADLSConnection, Dataset, DatasetColumn, DatasetPreview, DataRow, FilterOptions, ValidationResult } from '@/types/adls';
import { v4 as uuidv4 } from 'uuid';

// Mock connections
const mockConnections: ADLSConnection[] = [
  {
    id: '1',
    name: 'Production Data Lake',
    credentials: {
      accountName: 'prodadls',
      useManagedIdentity: true
    },
    isConnected: true,
    lastConnected: new Date('2023-06-15')
  },
  {
    id: '2',
    name: 'Development Storage',
    credentials: {
      accountName: 'devadls',
      accountKey: 'mock-key-123'
    },
    isConnected: false
  },
  {
    id: '3',
    name: 'Test Environment',
    credentials: {
      connectionString: 'DefaultEndpointsProtocol=https;AccountName=testadls;AccountKey=mock-key-456'
    },
    isConnected: true,
    lastConnected: new Date('2023-07-01')
  }
];

// Enhanced mock datasets with more columns
const mockDatasets: Dataset[] = [
  {
    id: '1',
    name: 'Customer Data',
    path: '/data/customers',
    format: 'delta',
    columns: [
      { name: 'customer_id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'email', type: 'string', nullable: true },
      { name: 'signup_date', type: 'date', nullable: false },
      { name: 'last_login', type: 'timestamp', nullable: true },
      { name: 'account_status', type: 'string', nullable: false },
      { name: 'address', type: 'string', nullable: true },
      { name: 'city', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: true },
      { name: 'zip_code', type: 'string', nullable: true },
      { name: 'country', type: 'string', nullable: true },
      { name: 'phone', type: 'string', nullable: true },
      { name: 'loyalty_points', type: 'integer', nullable: true },
      { name: 'referral_code', type: 'string', nullable: true },
      { name: 'marketing_consent', type: 'boolean', nullable: false }
    ],
    rowCount: 1000,
    repairedCount: 150,
    lastModified: new Date('2023-07-10')
  },
  {
    id: '2',
    name: 'Transaction History',
    path: '/data/transactions',
    format: 'parquet',
    columns: [
      { name: 'transaction_id', type: 'string', nullable: false },
      { name: 'customer_id', type: 'string', nullable: false },
      { name: 'amount', type: 'double', nullable: false },
      { name: 'currency', type: 'string', nullable: false },
      { name: 'timestamp', type: 'timestamp', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'payment_method', type: 'string', nullable: true },
      { name: 'payment_provider', type: 'string', nullable: true },
      { name: 'order_id', type: 'string', nullable: true },
      { name: 'product_count', type: 'integer', nullable: false },
      { name: 'shipping_cost', type: 'double', nullable: true },
      { name: 'tax_amount', type: 'double', nullable: true },
      { name: 'discount_code', type: 'string', nullable: true },
      { name: 'discount_amount', type: 'double', nullable: true },
      { name: 'refunded', type: 'boolean', nullable: false },
      { name: 'refund_reason', type: 'string', nullable: true },
      { name: 'device_type', type: 'string', nullable: true }
    ],
    rowCount: 5000,
    repairedCount: 320,
    lastModified: new Date('2023-07-12')
  },
  {
    id: '3',
    name: 'Product Catalog',
    path: '/data/products',
    format: 'delta',
    columns: [
      { name: 'product_id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'description', type: 'string', nullable: true },
      { name: 'price', type: 'double', nullable: false },
      { name: 'category', type: 'string', nullable: false },
      { name: 'in_stock', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'timestamp', nullable: false },
      { name: 'sku', type: 'string', nullable: false },
      { name: 'manufacturer', type: 'string', nullable: true },
      { name: 'weight', type: 'double', nullable: true },
      { name: 'dimensions', type: 'string', nullable: true },
      { name: 'color', type: 'string', nullable: true },
      { name: 'material', type: 'string', nullable: true },
      { name: 'warranty_period', type: 'string', nullable: true },
      { name: 'image_url', type: 'string', nullable: true }
    ],
    rowCount: 1500,
    repairedCount: 0,
    lastModified: new Date('2023-07-05')
  }
];

// Generate mock data for a dataset
const generateMockData = (dataset: Dataset, count: number): DataRow[] => {
  const rows: DataRow[] = [];
  
  for (let i = 0; i < count; i++) {
    const row: DataRow = { __id: uuidv4() };
    
    dataset.columns.forEach(column => {
      switch (column.type) {
        case 'string':
          row[column.name] = column.name.includes('id') 
            ? `ID-${Math.floor(Math.random() * 10000)}`
            : column.name.includes('name') 
              ? `Sample ${column.name} ${i}`
              : column.name.includes('email')
                ? `user${i}@example.com`
                : column.name.includes('address')
                  ? `${Math.floor(Math.random() * 9999)} Main St`
                  : column.name.includes('city')
                    ? ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)]
                    : column.name.includes('state')
                      ? ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)]
                      : column.name.includes('country')
                        ? ['USA', 'Canada', 'UK', 'Australia', 'Germany'][Math.floor(Math.random() * 5)]
                        : column.name.includes('phone')
                          ? `(${Math.floor(Math.random() * 900) + 100})-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
                          : `Value ${i} for ${column.name}`;
          break;
        case 'integer':
        case 'int':
          row[column.name] = Math.floor(Math.random() * 1000);
          break;
        case 'double':
        case 'float':
          row[column.name] = parseFloat((Math.random() * 1000).toFixed(2));
          break;
        case 'boolean':
          row[column.name] = Math.random() > 0.5;
          break;
        case 'date':
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 365));
          row[column.name] = date.toISOString().split('T')[0];
          break;
        case 'timestamp':
          const timestamp = new Date();
          timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 365));
          timestamp.setHours(Math.floor(Math.random() * 24));
          row[column.name] = timestamp.toISOString();
          break;
        default:
          row[column.name] = `Value ${i} for ${column.name}`;
      }
      
      // Make some values null based on nullable property
      if (column.nullable && Math.random() > 0.9) {
        row[column.name] = null;
      }
    });
    
    rows.push(row);
  }
  
  return rows;
};

// API functions for export
const getConnections = async (): Promise<ADLSConnection[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockConnections];
};

const getConnection = async (id: string): Promise<ADLSConnection | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockConnections.find(conn => conn.id === id) || null;
};

const createConnection = async (connection: Omit<ADLSConnection, 'id'>): Promise<ADLSConnection> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const newConnection: ADLSConnection = {
    ...connection,
    id: uuidv4(),
    isConnected: false
  };
  mockConnections.push(newConnection);
  return newConnection;
};

const updateConnection = async (id: string, connection: Partial<ADLSConnection>): Promise<ADLSConnection> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const index = mockConnections.findIndex(conn => conn.id === id);
  if (index === -1) throw new Error('Connection not found');
  
  mockConnections[index] = {
    ...mockConnections[index],
    ...connection,
    id
  };
  
  return mockConnections[index];
};

const deleteConnection = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const index = mockConnections.findIndex(conn => conn.id === id);
  if (index === -1) return false;
  
  mockConnections.splice(index, 1);
  return true;
};

const testConnection = async (connection: ADLSConnection): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Simulate connection test (90% success rate)
  return Math.random() > 0.1;
};

const getDatasets = async (): Promise<Dataset[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockDatasets];
};

const getDataset = async (id: string): Promise<Dataset | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockDatasets.find(dataset => dataset.id === id) || null;
};

const getDatasetPreview = async (
  connectionId: string,
  datasetId: string,
  page: number = 1,
  pageSize: number = 10,
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc',
  filters?: FilterOptions[]
): Promise<DatasetPreview> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const dataset = mockDatasets.find(d => d.id === datasetId);
  if (!dataset) throw new Error('Dataset not found');
  
  // Generate more mock data (increased from 1000 to 5000 rows)
  let rows = generateMockData(dataset, 5000);
  
  // Apply filters if provided
  if (filters && filters.length > 0) {
    rows = rows.filter(row => {
      return filters.every(filter => {
        const value = row[filter.column];
        if (value === null || value === undefined) return false;
        
        switch (filter.operation) {
          case 'equals':
            return String(value) === String(filter.value);
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          default:
            return true;
        }
      });
    });
  }
  
  // Apply sorting if provided
  if (sortColumn) {
    rows.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      // Compare based on type
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }
  
  // Calculate total rows and pages
  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  
  // Paginate
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);
  
  return {
    columns: dataset.columns,
    rows: paginatedRows,
    totalRows,
    page,
    pageSize,
    totalPages
  };
};

const updateDatasetRow = async (
  datasetId: string,
  rowId: string,
  columnName: string,
  newValue: any
): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real implementation, this would update the data in ADLS
  return true;
};

const saveDatasetChanges = async (
  datasetId: string,
  changes: { rowId: string, columnName: string, newValue: any }[]
): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  // In a real implementation, this would commit the changes to ADLS
  return true;
};

const validateDataset = async (datasetId: string): Promise<ValidationResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock validation result
  return {
    isValid: Math.random() > 0.3, // 70% chance of being valid
    errors: Math.random() > 0.3 ? [] : [
      {
        rowId: uuidv4(),
        columnName: 'email',
        message: 'Invalid email format',
        severity: 'error'
      },
      {
        rowId: uuidv4(),
        columnName: 'customer_id',
        message: 'ID format does not match expected pattern',
        severity: 'warning'
      }
    ]
  };
};

const repairDataset = async (datasetId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  // In a real implementation, this would trigger a repair job
  return true;
};

// Mock methods for additional functionality
const connect = async (credentials: any, name: string): Promise<ADLSConnection> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const newConnection: ADLSConnection = {
    id: uuidv4(),
    name,
    credentials,
    isConnected: true,
    lastConnected: new Date()
  };
  return newConnection;
};

const disconnect = async (connectionId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return true;
};

const listDatasets = async (connectionId: string): Promise<Dataset[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [...mockDatasets];
};

const getTempStorage = (datasetId: string) => {
  return {
    datasetId,
    modifiedRows: new Map<string, DataRow>(),
    totalRowCount: 1000,
    repairedCount: 0
  };
};

const saveChangesToTemp = async (connectionId: string, datasetId: string, rows: DataRow[]): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return true;
};

const commitChangesToADLS = async (connectionId: string, datasetId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
};

const getComments = async (datasetId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [];
};

const addComment = async (datasetId: string, text: string, rowId?: string, columnName?: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: uuidv4(),
    text,
    createdAt: new Date(),
    createdBy: 'Current User',
    rowId,
    columnName,
    resolved: false
  };
};

const resolveComment = async (datasetId: string, commentId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: commentId,
    text: 'Some comment',
    createdAt: new Date(),
    createdBy: 'Current User',
    resolved: true,
    resolvedAt: new Date(),
    resolvedBy: 'Current User'
  };
};

const updateColumn = async (connectionId: string, datasetId: string, column: DatasetColumn): Promise<Dataset> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const datasetIndex = mockDatasets.findIndex(d => d.id === datasetId);
  if (datasetIndex === -1) throw new Error('Dataset not found');
  
  const columnIndex = mockDatasets[datasetIndex].columns.findIndex(c => c.name === column.name);
  if (columnIndex === -1) throw new Error('Column not found');
  
  mockDatasets[datasetIndex].columns[columnIndex] = column;
  
  return mockDatasets[datasetIndex];
};

// Export all functions as a single object
export const adlsService = {
  getConnections,
  getConnection,
  createConnection,
  updateConnection,
  deleteConnection,
  testConnection,
  getDatasets,
  getDataset,
  getDatasetPreview,
  updateDatasetRow,
  saveDatasetChanges,
  validateDataset,
  repairDataset,
  connect,
  disconnect,
  listDatasets,
  getTempStorage,
  saveChangesToTemp,
  commitChangesToADLS,
  getComments,
  addComment,
  resolveComment,
  updateColumn
};

// Also export individual functions for direct import
export {
  getConnections,
  getConnection,
  createConnection,
  updateConnection,
  deleteConnection,
  testConnection,
  getDatasets,
  getDataset,
  getDatasetPreview,
  updateDatasetRow,
  saveDatasetChanges,
  validateDataset,
  repairDataset
};
