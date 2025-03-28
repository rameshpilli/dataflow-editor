import { 
  ADLSConnection, 
  ADLSCredentials, 
  Dataset, 
  DatasetPreview, 
  DataRow,
  DataChange,
  Container,
  Folder,
  FilterOptions,
  Comment,
  TempStorage,
  DatasetColumn
} from '@/types/adls';
import { v4 as uuidv4 } from 'uuid';

// Base API URL for the Python backend
const API_BASE_URL = 'http://localhost:8000';

// Mock data generators
const generateMockContainers = (containerFilter?: string[]): Container[] => {
  const allContainers = [
    { id: 'ingress-container', name: 'ingress', path: 'ingress', lastModified: new Date() },
    { id: 'bronze-container', name: 'bronze', path: 'bronze', lastModified: new Date() },
    { id: 'silver-container', name: 'silver', path: 'silver', lastModified: new Date() },
    { id: 'gold-container', name: 'gold', path: 'gold', lastModified: new Date() }
  ];
  
  if (!containerFilter || containerFilter.length === 0) {
    return allContainers;
  }
  
  return allContainers.filter(c => 
    containerFilter.some(filter => c.name.toLowerCase().includes(filter.toLowerCase()))
  );
};

const generateMockFolders = (containerId: string): Folder[] => {
  if (containerId.includes('bronze')) {
    return [
      { id: 'vendorA-folder', name: 'vendorA', path: 'bronze/vendorA', containerName: 'bronze', lastModified: new Date() },
      { id: 'vendorB-folder', name: 'vendorB', path: 'bronze/vendorB', containerName: 'bronze', lastModified: new Date() }
    ];
  } else if (containerId.includes('silver')) {
    return [
      { id: 'processed-folder', name: 'processed', path: 'silver/processed', containerName: 'silver', lastModified: new Date() },
      { id: 'validated-folder', name: 'validated', path: 'silver/validated', containerName: 'silver', lastModified: new Date() }
    ];
  } else if (containerId.includes('gold')) {
    return [
      { id: 'analytics-folder', name: 'analytics', path: 'gold/analytics', containerName: 'gold', lastModified: new Date() },
      { id: 'reporting-folder', name: 'reporting', path: 'gold/reporting', containerName: 'gold', lastModified: new Date() }
    ];
  }
  
  return [
    { id: 'raw-folder', name: 'raw', path: 'ingress/raw', containerName: 'ingress', lastModified: new Date() }
  ];
};

const generateMockDatasets = (containerId?: string, folderId?: string): Dataset[] => {
  const baseDatasets = [
    {
      id: 'sales-dataset',
      name: 'Sales Data',
      path: 'bronze/vendorA/sales',
      format: 'delta',
      columns: [
        { name: 'date', dataType: 'date', nullable: false },
        { name: 'product_id', dataType: 'string', nullable: false },
        { name: 'amount', dataType: 'decimal', nullable: false }
      ],
      rowCount: 1000,
      repairedCount: 950,
      lastModified: new Date()
    },
    {
      id: 'customers-dataset',
      name: 'Customer Information',
      path: 'bronze/vendorA/customers',
      format: 'delta',
      columns: [
        { name: 'customer_id', dataType: 'string', nullable: false },
        { name: 'name', dataType: 'string', nullable: false },
        { name: 'email', dataType: 'string', nullable: true }
      ],
      rowCount: 500,
      repairedCount: 500,
      lastModified: new Date()
    },
    {
      id: 'products-dataset',
      name: 'Product Catalog',
      path: 'silver/processed/products',
      format: 'delta',
      columns: [
        { name: 'product_id', dataType: 'string', nullable: false },
        { name: 'name', dataType: 'string', nullable: false },
        { name: 'category', dataType: 'string', nullable: false },
        { name: 'price', dataType: 'decimal', nullable: false }
      ],
      rowCount: 200,
      repairedCount: 180,
      lastModified: new Date()
    }
  ];
  
  if (!containerId && !folderId) {
    return baseDatasets;
  }
  
  if (containerId?.includes('bronze')) {
    if (folderId?.includes('vendorA')) {
      return baseDatasets.filter(d => d.path.includes('bronze/vendorA'));
    } else if (folderId?.includes('vendorB')) {
      return [{
        id: 'inventory-dataset',
        name: 'Inventory Data',
        path: 'bronze/vendorB/inventory',
        format: 'delta',
        columns: [
          { name: 'product_id', dataType: 'string', nullable: false },
          { name: 'quantity', dataType: 'integer', nullable: false },
          { name: 'warehouse', dataType: 'string', nullable: false }
        ],
        rowCount: 300,
        repairedCount: 275,
        lastModified: new Date()
      }];
    }
    return baseDatasets.filter(d => d.path.includes('bronze'));
  } else if (containerId?.includes('silver')) {
    return baseDatasets.filter(d => d.path.includes('silver'));
  } else if (containerId?.includes('gold')) {
    return [{
      id: 'sales-summary-dataset',
      name: 'Sales Summary',
      path: 'gold/analytics/sales_summary',
      format: 'delta',
      columns: [
        { name: 'date', dataType: 'date', nullable: false },
        { name: 'total_sales', dataType: 'decimal', nullable: false },
        { name: 'region', dataType: 'string', nullable: false }
      ],
      rowCount: 100,
      repairedCount: 100,
      lastModified: new Date()
    }];
  } else if (containerId?.includes('ingress')) {
    return [{
      id: 'raw-data-dataset',
      name: 'Raw Data',
      path: 'ingress/raw/data',
      format: 'csv',
      columns: [
        { name: 'timestamp', dataType: 'string', nullable: false },
        { name: 'data', dataType: 'string', nullable: false }
      ],
      rowCount: 2000,
      repairedCount: 0,
      lastModified: new Date()
    }];
  }
  
  return baseDatasets;
};

const generateMockDataPreview = (datasetId: string): DatasetPreview => {
  const columns = [
    { name: 'id', dataType: 'string', nullable: false },
    { name: 'name', dataType: 'string', nullable: false },
    { name: 'value', dataType: 'decimal', nullable: true },
    { name: 'date', dataType: 'date', nullable: false }
  ];
  
  const rows = Array(20).fill(0).map((_, i) => ({
    __id: `row-${i}`,
    id: `ID_${i}`,
    name: `Item ${i}`,
    value: Math.round(Math.random() * 1000) / 100,
    date: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
  }));
  
  return {
    datasetId,
    columns,
    rows,
    totalRows: 100,
    page: 1,
    pageSize: 20,
    totalPages: 5
  };
};

class ADLSService {
  private activeConnection: ADLSConnection | null = null;
  private tempStorage: Map<string, TempStorage> = new Map();
  private useMockBackend: boolean = false;
  
  // Connect to ADLS
  async connect(credentials: ADLSCredentials, name: string): Promise<ADLSConnection> {
    this.useMockBackend = credentials.useMockBackend || false;
    
    // If using mock backend, return a mock connection
    if (this.useMockBackend) {
      const mockConnection: ADLSConnection = {
        id: uuidv4(),
        name,
        createdAt: new Date(),
        status: 'connected',
        useManagedIdentity: credentials.useManagedIdentity,
        containerFilter: credentials.containerFilter,
        credentials: credentials
      };
      
      this.activeConnection = mockConnection;
      return mockConnection;
    }
    
    // Otherwise, use the real backend
    try {
      const response = await fetch(`${API_BASE_URL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials,
          name
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to connect to ADLS');
      }
      
      const connectionData = await response.json();
      this.activeConnection = connectionData;
      
      return connectionData;
    } catch (error) {
      console.error('ADLS connection error:', error);
      throw error;
    }
  }
  
  // Disconnect from ADLS
  async disconnect(connectionId: string): Promise<boolean> {
    if (this.useMockBackend) {
      this.activeConnection = null;
      return true;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/disconnect/${connectionId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to disconnect from ADLS');
      }
      
      this.activeConnection = null;
      return true;
    } catch (error) {
      console.error('ADLS disconnect error:', error);
      throw error;
    }
  }
  
  // List containers
  async listContainers(connectionId: string, containerFilter?: string[]): Promise<Container[]> {
    if (this.useMockBackend) {
      return generateMockContainers(containerFilter);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/containers/${connectionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list containers');
      }
      
      const containers = await response.json();
      return containers;
    } catch (error) {
      console.error('Error listing containers:', error);
      throw error;
    }
  }
  
  // List folders in a container
  async listFolders(connectionId: string, containerId: string): Promise<Folder[]> {
    if (this.useMockBackend) {
      return generateMockFolders(containerId);
    }
    
    try {
      // In a real implementation, we would get the container name from a previous API call
      // For this mock, we'll use a query parameter
      const containerName = containerId.includes('bronze') ? 'bronze' : 
                           containerId.includes('silver') ? 'silver' : 
                           containerId.includes('gold') ? 'gold' : 'ingress';
      
      const response = await fetch(
        `${API_BASE_URL}/folders/${connectionId}/${containerId}?container_name=${containerName}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list folders');
      }
      
      const folders = await response.json();
      return folders;
    } catch (error) {
      console.error('Error listing folders:', error);
      throw error;
    }
  }
  
  // List datasets
  async listDatasets(connectionId: string): Promise<Dataset[]> {
    if (this.useMockBackend) {
      return generateMockDatasets();
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/${connectionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list datasets');
      }
      
      const datasets = await response.json();
      return datasets;
    } catch (error) {
      console.error('Error listing datasets:', error);
      throw error;
    }
  }
  
  // Get datasets by container
  async getDatasetsByContainer(
    connectionId: string, 
    containerId: string
  ): Promise<Dataset[]> {
    if (this.useMockBackend) {
      return generateMockDatasets(containerId);
    }
    
    try {
      // In a real implementation, we would get the container name from a previous API call
      // For this mock, we'll use a query parameter
      const containerName = containerId.includes('bronze') ? 'bronze' : 
                           containerId.includes('silver') ? 'silver' : 
                           containerId.includes('gold') ? 'gold' : 'ingress';
      
      const response = await fetch(
        `${API_BASE_URL}/datasets/${connectionId}/container/${containerId}?container_name=${containerName}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get datasets by container');
      }
      
      const datasets = await response.json();
      return datasets;
    } catch (error) {
      console.error('Error getting datasets by container:', error);
      throw error;
    }
  }
  
  // Get datasets by folder
  async getDatasetsByFolder(
    connectionId: string, 
    folderId: string
  ): Promise<Dataset[]> {
    if (this.useMockBackend) {
      return generateMockDatasets(undefined, folderId);
    }
    
    try {
      // In a real implementation, we would get these values from previous API calls
      // For this mock, we'll use query parameters
      const containerName = 'bronze';
      const folderPath = 'vendorA';
      
      const response = await fetch(
        `${API_BASE_URL}/datasets/${connectionId}/folder/${folderId}?container_name=${containerName}&folder_path=${folderPath}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get datasets by folder');
      }
      
      const datasets = await response.json();
      return datasets;
    } catch (error) {
      console.error('Error getting datasets by folder:', error);
      throw error;
    }
  }
  
  // Get dataset preview with pagination and filtering
  async getDatasetPreview(
    connectionId: string,
    datasetId: string,
    page: number = 1,
    pageSize: number = 10,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: FilterOptions[]
  ): Promise<DatasetPreview> {
    if (this.useMockBackend) {
      return generateMockDataPreview(datasetId);
    }
    
    try {
      // Build query parameters
      let queryParams = `page=${page}&page_size=${pageSize}&path=${datasetId}`;
      
      if (sortColumn && sortDirection) {
        queryParams += `&sort_column=${sortColumn}&sort_direction=${sortDirection}`;
      }
      
      if (filters && filters.length > 0) {
        queryParams += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/preview/${connectionId}/${datasetId}?${queryParams}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get dataset preview');
      }
      
      const previewData = await response.json();
      return previewData;
    } catch (error) {
      console.error('Error getting dataset preview:', error);
      throw error;
    }
  }
  
  // Save changes to temporary storage
  async saveChangesToTemp(
    connectionId: string,
    datasetId: string,
    modifiedRows: DataRow[]
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/save-changes/${connectionId}/${datasetId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(modifiedRows),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save changes');
      }
      
      // Update local temp storage representation
      const tempStorage: TempStorage = {
        datasetId,
        modifiedRows: new Map(modifiedRows.map(row => [row.__id, row])),
        totalRowCount: 100, // Mock value
        repairedCount: modifiedRows.length
      };
      
      this.tempStorage.set(datasetId, tempStorage);
      
      return true;
    } catch (error) {
      console.error('Error saving changes to temp:', error);
      throw error;
    }
  }
  
  // Commit changes to ADLS
  async commitChangesToADLS(
    connectionId: string,
    datasetId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/commit-changes/${connectionId}/${datasetId}`,
        {
          method: 'POST',
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to commit changes');
      }
      
      // Clear local temp storage
      this.tempStorage.delete(datasetId);
      
      return true;
    } catch (error) {
      console.error('Error committing changes to ADLS:', error);
      throw error;
    }
  }
  
  // Get temporary storage info
  getTempStorage(datasetId: string): TempStorage | undefined {
    return this.tempStorage.get(datasetId);
  }
  
  // Get comments for a dataset
  async getComments(datasetId: string): Promise<Comment[]> {
    // Mock implementation - in a real app, this would call the backend
    return [
      {
        id: uuidv4(),
        text: 'This dataset needs quality checks',
        createdAt: new Date(),
        createdBy: 'John Doe',
        resolved: false
      },
      {
        id: uuidv4(),
        text: 'Some values in the sales column look suspicious',
        createdAt: new Date(Date.now() - 86400000),
        createdBy: 'Jane Smith',
        rowId: 'row-5',
        columnName: 'sales',
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: 'John Doe'
      }
    ];
  }
  
  // Add a comment
  async addComment(
    datasetId: string,
    text: string,
    rowId?: string,
    columnName?: string
  ): Promise<Comment> {
    // Mock implementation - in a real app, this would call the backend
    const newComment: Comment = {
      id: uuidv4(),
      text,
      createdAt: new Date(),
      createdBy: 'Current User',
      rowId,
      columnName,
      resolved: false
    };
    
    return newComment;
  }
  
  // Resolve a comment
  async resolveComment(
    datasetId: string,
    commentId: string
  ): Promise<Comment> {
    // Mock implementation - in a real app, this would call the backend
    const resolvedComment: Comment = {
      id: commentId,
      text: 'This issue has been resolved',
      createdAt: new Date(Date.now() - 86400000),
      createdBy: 'Jane Smith',
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: 'Current User'
    };
    
    return resolvedComment;
  }
  
  // Update column validation rules
  async updateColumn(
    connectionId: string,
    datasetId: string,
    updatedColumn: DatasetColumn
  ): Promise<Dataset> {
    // Mock implementation - in a real app, this would call the backend
    return {
      id: datasetId,
      name: 'Updated Dataset',
      path: 'bronze/vendorA/updated_dataset',
      format: 'delta',
      columns: [updatedColumn],
      rowCount: 100,
      repairedCount: 50,
      lastModified: new Date()
    };
  }
}

// Create and export an instance
export const adlsService = new ADLSService();
