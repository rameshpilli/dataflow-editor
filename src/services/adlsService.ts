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
  DatasetColumn,
  FolderTree
} from '@/types/adls';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:8000';

// Store references to the mock data structures
const mockContainers: Container[] = [
  { id: 'ingress-container', name: 'ingress', path: 'ingress', lastModified: new Date() },
  { id: 'bronze-container', name: 'bronze', path: 'bronze', lastModified: new Date() },
  { id: 'silver-container', name: 'silver', path: 'silver', lastModified: new Date() },
  { id: 'gold-container', name: 'gold', path: 'gold', lastModified: new Date() }
];

const mockFolders: Record<string, Folder[]> = {
  'ingress-container': [
    { id: 'raw-folder', name: 'raw', path: 'ingress/raw', containerName: 'ingress', lastModified: new Date(), hasDatasetFiles: true }
  ],
  'bronze-container': [
    { id: 'vendorA-folder', name: 'vendorA', path: 'bronze/vendorA', containerName: 'bronze', lastModified: new Date(), hasDatasetFiles: true },
    { id: 'vendorB-folder', name: 'vendorB', path: 'bronze/vendorB', containerName: 'bronze', lastModified: new Date(), hasDatasetFiles: true }
  ],
  'silver-container': [
    { id: 'processed-folder', name: 'processed', path: 'silver/processed', containerName: 'silver', lastModified: new Date(), hasDatasetFiles: true },
    { id: 'validated-folder', name: 'validated', path: 'silver/validated', containerName: 'silver', lastModified: new Date() }
  ],
  'gold-container': [
    { id: 'analytics-folder', name: 'analytics', path: 'gold/analytics', containerName: 'gold', lastModified: new Date(), hasDatasetFiles: true },
    { id: 'reporting-folder', name: 'reporting', path: 'gold/reporting', containerName: 'gold', lastModified: new Date() }
  ]
};

// Update dataset IDs to be more predictable and ensure we can find them
const bronzeVendorADatasets: Dataset[] = [
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
  }
];

const bronzeVendorBDatasets: Dataset[] = [
  {
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
  }
];

const silverProcessedDatasets: Dataset[] = [
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

const goldAnalyticsDatasets: Dataset[] = [
  {
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
  },
  {
    id: 'monthly-metrics-dataset',
    name: 'Monthly Metrics',
    path: 'gold/analytics/monthly_metrics',
    format: 'delta',
    columns: [
      { name: 'month', dataType: 'string', nullable: false },
      { name: 'revenue', dataType: 'decimal', nullable: false },
      { name: 'growth_rate', dataType: 'decimal', nullable: true },
      { name: 'customer_count', dataType: 'integer', nullable: false }
    ],
    rowCount: 24,
    repairedCount: 24,
    lastModified: new Date()
  },
  {
    id: 'regional-performance-dataset',
    name: 'Regional Performance',
    path: 'gold/analytics/regional_performance',
    format: 'delta',
    columns: [
      { name: 'region', dataType: 'string', nullable: false },
      { name: 'sales', dataType: 'decimal', nullable: false },
      { name: 'target', dataType: 'decimal', nullable: false },
      { name: 'achievement', dataType: 'decimal', nullable: false }
    ],
    rowCount: 50,
    repairedCount: 48,
    lastModified: new Date()
  }
];

const goldReportingDatasets: Dataset[] = [
  {
    id: 'executive-summary-dataset',
    name: 'Executive Summary',
    path: 'gold/reporting/executive_summary',
    format: 'delta',
    columns: [
      { name: 'quarter', dataType: 'string', nullable: false },
      { name: 'department', dataType: 'string', nullable: false },
      { name: 'budget', dataType: 'decimal', nullable: false },
      { name: 'actual', dataType: 'decimal', nullable: false }
    ],
    rowCount: 16,
    repairedCount: 16,
    lastModified: new Date()
  },
  {
    id: 'financial-report-dataset',
    name: 'Financial Report',
    path: 'gold/reporting/financial_report',
    format: 'delta',
    columns: [
      { name: 'account', dataType: 'string', nullable: false },
      { name: 'balance', dataType: 'decimal', nullable: false },
      { name: 'period', dataType: 'string', nullable: false }
    ],
    rowCount: 120,
    repairedCount: 120,
    lastModified: new Date()
  }
];

const ingressRawDatasets: Dataset[] = [
  {
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
  }
];

// Create a direct map between folder IDs and datasets, including both folder IDs and folder names as lookup keys
const mockDatasetsByFolder: Record<string, Dataset[]> = {
  'raw-folder': ingressRawDatasets,
  'raw': ingressRawDatasets,
  'vendorA-folder': bronzeVendorADatasets,
  'vendorA': bronzeVendorADatasets,
  'vendorB-folder': bronzeVendorBDatasets,
  'vendorB': bronzeVendorBDatasets,
  'processed-folder': silverProcessedDatasets,
  'processed': silverProcessedDatasets,
  'analytics-folder': goldAnalyticsDatasets,
  'analytics': goldAnalyticsDatasets,
  'reporting-folder': goldReportingDatasets,
  'reporting': goldReportingDatasets
};

// Map container names to their datasets for easier lookup when navigating by name
const mockDatasetsByContainer: Record<string, Dataset[]> = {
  'ingress': ingressRawDatasets,
  'bronze': [...bronzeVendorADatasets, ...bronzeVendorBDatasets],
  'silver': silverProcessedDatasets,
  'gold': [...goldAnalyticsDatasets, ...goldReportingDatasets]
};

const generateMockContainers = (containerFilter?: string[]): Container[] => {
  if (!containerFilter || containerFilter.length === 0) {
    return mockContainers;
  }
  
  return mockContainers.filter(c => 
    containerFilter.some(filter => c.name.toLowerCase().includes(filter.toLowerCase()))
  );
};

const generateMockFolders = (containerId: string): Folder[] => {
  return mockFolders[containerId] || [];
};

const generateMockDatasets = (containerId?: string, folderId?: string): Dataset[] => {
  if (folderId) {
    // First try exact match with folder ID
    if (mockDatasetsByFolder[folderId]) {
      console.log(`Returning ${mockDatasetsByFolder[folderId].length} datasets for folder ID ${folderId}`);
      return mockDatasetsByFolder[folderId];
    }
    
    // If no exact match, try to find by folder name
    const folderName = folderId.replace('-folder', '');
    if (mockDatasetsByFolder[folderName]) {
      console.log(`Found datasets using folder name ${folderName}`);
      return mockDatasetsByFolder[folderName];
    }
    
    // For "analytics" folder in "gold" container
    if (containerId === 'gold-container' && (folderId === 'analytics-folder' || folderId === 'analytics')) {
      console.log('Returning gold analytics datasets');
      return goldAnalyticsDatasets;
    }
    
    // For "reporting" folder in "gold" container
    if (containerId === 'gold-container' && (folderId === 'reporting-folder' || folderId === 'reporting')) {
      console.log('Returning gold reporting datasets');
      return goldReportingDatasets;
    }

    console.log(`No datasets found for folder ${folderId}`);
    return [];
  }

  if (containerId) {
    const containerName = containerId.replace('-container', '');
    if (mockDatasetsByContainer[containerName]) {
      return mockDatasetsByContainer[containerName];
    }
  }

  if (!containerId && !folderId) {
    return [
      ...bronzeVendorADatasets,
      ...silverProcessedDatasets,
      ...goldAnalyticsDatasets.slice(0, 1)
    ];
  }

  return [];
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
  private folderTreeCache: Map<string, FolderTree> = new Map();
  private backendAvailable: boolean = true;
  
  constructor() {
    this.checkBackendAvailability();
  }
  
  private async checkBackendAvailability(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_BASE_URL}/auth-methods`, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      this.backendAvailable = response.ok;
    } catch (error) {
      console.log("Backend unavailable, but not automatically using mock data");
      this.backendAvailable = false;
    }
  }
  
  async connect(credentials: ADLSCredentials, name: string): Promise<ADLSConnection> {
    if (credentials.useMockBackend) {
      console.log("Using mock backend as requested by user");
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
      this.useMockBackend = true;
      return mockConnection;
    }
    
    if (!this.backendAvailable) {
      throw new Error('Backend server is unavailable. Please check your connection or try using mock data.');
    }
    
    try {
      console.log("Attempting real connection to ADLS");
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
      this.useMockBackend = false;
      
      return connectionData;
    } catch (error) {
      console.error('ADLS connection error:', error);
      throw error;
    }
  }
  
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
  
  async getFolderTree(connectionId: string): Promise<FolderTree> {
    if (this.folderTreeCache.has(connectionId)) {
      return this.folderTreeCache.get(connectionId)!;
    }
    
    if (this.useMockBackend) {
      const containers = generateMockContainers(this.activeConnection?.containerFilter);
      const tree: FolderTree = {
        id: 'root',
        name: 'Root',
        type: 'root',
        children: []
      };
      
      for (const container of containers) {
        const containerNode: FolderTree = {
          id: container.id,
          name: container.name,
          type: 'container',
          path: container.name,
          children: []
        };
        
        const folders = generateMockFolders(container.id);
        
        for (const folder of folders) {
          const folderNode: FolderTree = {
            id: folder.id,
            name: folder.name,
            type: 'folder',
            path: folder.path,
            children: []
          };
          
          const datasets = mockDatasetsByFolder[folder.id] || [];
          for (const dataset of datasets) {
            folderNode.children.push({
              id: dataset.id,
              name: dataset.name,
              type: 'dataset',
              format: dataset.format,
              path: dataset.path,
              children: []
            });
          }
          
          containerNode.children.push(folderNode);
        }
        
        tree.children.push(containerNode);
      }
      
      this.folderTreeCache.set(connectionId, tree);
      
      return tree;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/folder-tree/${connectionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get folder tree');
      }
      
      const treeData = await response.json();
      
      this.folderTreeCache.set(connectionId, treeData);
      
      return treeData;
    } catch (error) {
      console.error('Error getting folder tree:', error);
      throw error;
    }
  }
  
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
  
  async listFolders(connectionId: string, containerId: string): Promise<Folder[]> {
    if (this.useMockBackend) {
      return generateMockFolders(containerId);
    }
    
    try {
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
  
  async checkFolderContainsDatasetFiles(
    connectionId: string,
    containerName: string,
    folderPath: string
  ): Promise<{hasDatasetFiles: boolean, formats: string[]}> {
    if (this.useMockBackend) {
      if (folderPath.includes('vendorA') || folderPath.includes('vendorB')) {
        return { hasDatasetFiles: true, formats: ['delta', 'parquet'] };
      }
      
      return { hasDatasetFiles: false, formats: [] };
    }
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/check-dataset-files/${connectionId}?container_name=${containerName}&folder_path=${folderPath}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to check folder contents');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking folder contents:', error);
      throw error;
    }
  }
  
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
  
  async getDatasetsByContainer(
    connectionId: string, 
    containerId: string
  ): Promise<Dataset[]> {
    if (this.useMockBackend) {
      return generateMockDatasets(containerId);
    }
    
    try {
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
  
  async getDatasetsByFolder(
    connectionId: string, 
    folderId: string
  ): Promise<Dataset[]> {
    console.log(`Getting datasets for folder: ${folderId}`);
    if (this.useMockBackend) {
      try {
        // First, try the direct lookup by folder ID
        let datasets = mockDatasetsByFolder[folderId] || [];
        
        if (datasets.length === 0) {
          // Try using just the folder name without the "-folder" suffix
          const folderName = folderId.replace('-folder', '');
          datasets = mockDatasetsByFolder[folderName] || [];
          
          if (datasets.length === 0) {
            // If still no datasets, look for case-insensitive matches
            const folderIdLower = folderId.toLowerCase();
            
            // Try to find a partial match in folder IDs
            const matchingFolderKey = Object.keys(mockDatasetsByFolder).find(key => 
              key.toLowerCase().includes(folderIdLower) || 
              folderIdLower.includes(key.toLowerCase())
            );
            
            if (matchingFolderKey) {
              console.log(`Found datasets using partial match to folder key: ${matchingFolderKey}`);
              datasets = mockDatasetsByFolder[matchingFolderKey];
            }
          }
        }
        
        console.log(`Mock backend returning ${datasets.length} datasets for folder ${folderId}`);
        
        // Return a deep copy to avoid mutation issues
        return JSON.parse(JSON.stringify(datasets));
      } catch (error) {
        console.error('Error generating mock datasets:', error);
        return [];
      }
    }
    
    try {
      // ... keep existing code for real API call
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
      
      const tempStorage: TempStorage = {
        datasetId,
        modifiedRows: new Map(modifiedRows.map(row => [row.__id, row])),
        totalRowCount: 100,
        repairedCount: modifiedRows.length
      };
      
      this.tempStorage.set(datasetId, tempStorage);
      
      return true;
    } catch (error) {
      console.error('Error saving changes to temp:', error);
      throw error;
    }
  }
  
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
      
      this.tempStorage.delete(datasetId);
      
      return true;
    } catch (error) {
      console.error('Error committing changes to ADLS:', error);
      throw error;
    }
  }
  
  getTempStorage(datasetId: string): TempStorage | undefined {
    return this.tempStorage.get(datasetId);
  }
  
  async getComments(datasetId: string): Promise<Comment[]> {
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
  
  async addComment(
    datasetId: string,
    text: string,
    rowId?: string,
    columnName?: string
  ): Promise<Comment> {
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
  
  async resolveComment(
    datasetId: string,
    commentId: string
  ): Promise<Comment> {
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
  
  async updateColumn(
    connectionId: string,
    datasetId: string,
    updatedColumn: DatasetColumn
  ): Promise<Dataset> {
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
  
  async getAvailableAuthMethods(): Promise<{ 
    supportsManagedIdentity: boolean, 
    supportsConnectionString: boolean,
    supportsAccountKey: boolean,
    recommendedMethod: 'managedIdentity' | 'connectionString' | 'accountKey' | null,
    environmentInfo: {
      isAzureEnvironment: boolean,
      isDevEnvironment: boolean,
      hasSystemManagedIdentity: boolean,
      hasUserManagedIdentity: boolean
    }
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_BASE_URL}/auth-methods`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get authentication methods');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting authentication methods:', error);
      
      if (this.backendAvailable) {
        console.log("Backend unavailable for auth methods");
        this.backendAvailable = false;
      }
      
      return {
        supportsManagedIdentity: true,
        supportsConnectionString: true,
        supportsAccountKey: true,
        recommendedMethod: 'accountKey',
        environmentInfo: {
          isAzureEnvironment: false,
          isDevEnvironment: true,
          hasSystemManagedIdentity: false,
          hasUserManagedIdentity: false
        }
      };
    }
  }
}

export const adlsService = new ADLSService();
