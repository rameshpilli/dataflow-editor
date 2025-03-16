
import { ADLSConnection, ADLSCredentials, Dataset, DatasetPreview, DataRow, FilterOptions, TempStorage } from '@/types/adls';
import { toast } from '@/hooks/use-toast';

// This is a mock service - in a real app, this would connect to Azure SDK
class ADLSService {
  private connections: ADLSConnection[] = [];
  private tempStorage: Map<string, TempStorage> = new Map(); // Store temporary data by dataset ID

  // Connect to ADLS
  async connect(credentials: ADLSCredentials, name: string): Promise<ADLSConnection> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Validation
    if (!credentials.useManagedIdentity && 
        (!credentials.connectionString && (!credentials.accountName || !credentials.accountKey))) {
      throw new Error('Invalid credentials: Please provide either connection string or account name and key');
    }
    
    const connection: ADLSConnection = {
      id: `conn_${Date.now()}`,
      name,
      credentials,
      isConnected: true,
      lastConnected: new Date()
    };
    
    this.connections.push(connection);
    return connection;
  }

  // List available datasets
  async listDatasets(connectionId: string): Promise<Dataset[]> {
    const connection = this.connections.find(c => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error('Not connected to ADLS');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock datasets with repair count
    const datasets: Dataset[] = [
      {
        id: 'dataset_1',
        name: 'Customer Data',
        path: '/data/customers',
        format: 'delta' as const,
        columns: [
          { name: 'id', type: 'integer', nullable: false, stats: { min: 1, max: 10000, count: 1000, nullCount: 0 } },
          { name: 'customer_number', type: 'string', nullable: false, stats: { count: 1000, nullCount: 0 } },
          { name: 'name', type: 'string', nullable: false, stats: { count: 1000, nullCount: 0 } },
          { name: 'email', type: 'string', nullable: true, stats: { count: 1000, nullCount: 20 } },
          { name: 'age', type: 'integer', nullable: true, stats: { min: 18, max: 95, count: 1000, nullCount: 15 } },
          { name: 'gender', type: 'string', nullable: true, stats: { count: 1000, nullCount: 5 } },
          { name: 'active', type: 'boolean', nullable: false, stats: { count: 1000, nullCount: 0 } },
          { name: 'registration_date', type: 'date', nullable: false, stats: { count: 1000, nullCount: 0 } },
          { name: 'last_login', type: 'timestamp', nullable: true, stats: { count: 1000, nullCount: 5 } },
          { name: 'account_balance', type: 'decimal', nullable: false, stats: { min: 0, max: 10000, count: 1000, nullCount: 0 } },
          { name: 'lifetime_value', type: 'decimal', nullable: true, stats: { min: 0, max: 25000, count: 1000, nullCount: 10 } },
          { name: 'subscription_tier', type: 'string', nullable: false, stats: { count: 1000, nullCount: 0 } },
          { name: 'address', type: 'string', nullable: true, stats: { count: 1000, nullCount: 30 } },
          { name: 'city', type: 'string', nullable: true, stats: { count: 1000, nullCount: 30 } },
          { name: 'state', type: 'string', nullable: true, stats: { count: 1000, nullCount: 30 } },
          { name: 'postal_code', type: 'string', nullable: true, stats: { count: 1000, nullCount: 30 } },
          { name: 'country', type: 'string', nullable: true, stats: { count: 1000, nullCount: 30 } },
          { name: 'phone', type: 'string', nullable: true, stats: { count: 1000, nullCount: 40 } },
          { name: 'preferred_language', type: 'string', nullable: true, stats: { count: 1000, nullCount: 20 } },
          { name: 'marketing_consent', type: 'boolean', nullable: false, stats: { count: 1000, nullCount: 0 } }
        ],
        rowCount: 1000,
        repairedCount: this.getTempStorage('dataset_1')?.repairedCount || 0,
        lastModified: new Date('2023-06-15')
      },
      {
        id: 'dataset_2',
        name: 'Sales Transactions',
        path: '/data/sales',
        format: 'parquet' as const,
        columns: [
          { name: 'transaction_id', type: 'string', nullable: false },
          { name: 'customer_id', type: 'integer', nullable: false },
          { name: 'product_id', type: 'string', nullable: false },
          { name: 'product_name', type: 'string', nullable: false },
          { name: 'category', type: 'string', nullable: false },
          { name: 'subcategory', type: 'string', nullable: true },
          { name: 'amount', type: 'decimal', nullable: false },
          { name: 'quantity', type: 'integer', nullable: false },
          { name: 'unit_price', type: 'decimal', nullable: false },
          { name: 'discount_amount', type: 'decimal', nullable: true },
          { name: 'tax_amount', type: 'decimal', nullable: false },
          { name: 'total_amount', type: 'decimal', nullable: false },
          { name: 'payment_method', type: 'string', nullable: false },
          { name: 'store_id', type: 'integer', nullable: false },
          { name: 'store_location', type: 'string', nullable: false },
          { name: 'sales_person', type: 'string', nullable: true },
          { name: 'timestamp', type: 'timestamp', nullable: false },
          { name: 'is_online', type: 'boolean', nullable: false },
          { name: 'shipping_cost', type: 'decimal', nullable: true },
          { name: 'delivery_date', type: 'date', nullable: true },
          { name: 'order_source', type: 'string', nullable: true },
          { name: 'channel_id', type: 'integer', nullable: true },
          { name: 'promotion_code', type: 'string', nullable: true },
          { name: 'customer_rating', type: 'integer', nullable: true },
          { name: 'exchange_rate', type: 'decimal', nullable: true },
          { name: 'currency', type: 'string', nullable: false }
        ],
        rowCount: 5000,
        repairedCount: this.getTempStorage('dataset_2')?.repairedCount || 0,
        lastModified: new Date('2023-07-20')
      },
      {
        id: 'dataset_3',
        name: 'Product Inventory',
        path: '/data/inventory',
        format: 'delta' as const,
        columns: [
          { name: 'product_id', type: 'string', nullable: false },
          { name: 'sku', type: 'string', nullable: false },
          { name: 'name', type: 'string', nullable: false },
          { name: 'description', type: 'string', nullable: true },
          { name: 'category', type: 'string', nullable: true },
          { name: 'subcategory', type: 'string', nullable: true },
          { name: 'price', type: 'decimal', nullable: false },
          { name: 'cost', type: 'decimal', nullable: false },
          { name: 'stock_quantity', type: 'integer', nullable: false },
          { name: 'supplier_id', type: 'string', nullable: false },
          { name: 'supplier_name', type: 'string', nullable: false },
          { name: 'supplier_contact', type: 'string', nullable: true },
          { name: 'reorder_level', type: 'integer', nullable: false },
          { name: 'reorder_quantity', type: 'integer', nullable: false },
          { name: 'last_restock_date', type: 'date', nullable: true },
          { name: 'expiration_date', type: 'date', nullable: true },
          { name: 'warehouse_location', type: 'string', nullable: false },
          { name: 'shelf_position', type: 'string', nullable: true },
          { name: 'weight', type: 'decimal', nullable: true },
          { name: 'dimensions', type: 'string', nullable: true },
          { name: 'is_active', type: 'boolean', nullable: false },
          { name: 'created_date', type: 'timestamp', nullable: false },
          { name: 'modified_date', type: 'timestamp', nullable: false }
        ],
        rowCount: 500,
        repairedCount: this.getTempStorage('dataset_3')?.repairedCount || 0,
        lastModified: new Date('2023-08-05')
      },
      // New sample dataset with long path and only 10 records
      {
        id: 'dataset_4',
        name: 'Sample Long Path Data',
        path: '/data/inventory/data/inventory/data/inventory/data/inventory/data/inventory',
        format: 'delta' as const,
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: false },
          { name: 'description', type: 'string', nullable: true },
          { name: 'category', type: 'string', nullable: false },
          { name: 'created_date', type: 'date', nullable: false },
          { name: 'is_active', type: 'boolean', nullable: false }
        ],
        rowCount: 10,
        repairedCount: this.getTempStorage('dataset_4')?.repairedCount || 0,
        lastModified: new Date('2024-01-10')
      }
    ];
    
    return datasets;
  }

  // Get dataset preview with pagination
  async getDatasetPreview(
    connectionId: string, 
    datasetId: string, 
    page: number = 1, 
    pageSize: number = 10,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: FilterOptions[]
  ): Promise<DatasetPreview> {
    const connection = this.connections.find(c => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error('Not connected to ADLS');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get mock dataset
    const datasets = await this.listDatasets(connectionId);
    const dataset = datasets.find(d => d.id === datasetId);
    
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    // Generate mock rows
    const totalRows = dataset.rowCount || 100;
    const startRow = (page - 1) * pageSize;
    const endRow = Math.min(startRow + pageSize, totalRows);
    
    let rows: DataRow[] = [];
    
    for (let i = startRow; i < endRow; i++) {
      const row: DataRow = { __id: `row_${i}` };
      
      dataset.columns.forEach(column => {
        switch (column.type) {
          case 'integer':
            row[column.name] = i + Math.floor(Math.random() * 100);
            break;
          case 'decimal':
            row[column.name] = (i * 10.5 + Math.random() * 100).toFixed(2);
            break;
          case 'string':
            row[column.name] = `${column.name}_value_${i}`;
            break;
          case 'boolean':
            row[column.name] = Math.random() > 0.5;
            break;
          case 'timestamp':
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            row[column.name] = date.toISOString();
            break;
          default:
            row[column.name] = `${column.name}_${i}`;
        }
        
        // Apply null values based on nullable status
        if (column.nullable && Math.random() > 0.9) {
          row[column.name] = null;
        }
      });
      
      rows.push(row);
    }
    
    // Apply any temporarily saved changes to the preview data
    const tempData = this.tempStorage.get(datasetId);
    if (tempData) {
      rows = rows.map(row => {
        const savedRow = tempData.modifiedRows.get(row.__id);
        if (savedRow) {
          return { ...savedRow, __modified: true };
        }
        return row;
      });
    }
    
    // Apply sorting if specified
    if (sortColumn && sortDirection) {
      rows.sort((a, b) => {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];
        
        if (valueA === null) return sortDirection === 'asc' ? -1 : 1;
        if (valueB === null) return sortDirection === 'asc' ? 1 : -1;
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply filtering if specified
    if (filters && filters.length > 0) {
      rows = rows.filter(row => {
        return filters.every(filter => {
          const value = row[filter.column];
          
          if (value === null || value === undefined) return false;
          
          switch (filter.operation) {
            case 'equals':
              return value === filter.value;
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
            case 'greaterThan':
              return value > filter.value;
            case 'lessThan':
              return value < filter.value;
            default:
              return true;
          }
        });
      });
    }
    
    return {
      columns: dataset.columns,
      rows,
      totalRows,
      page,
      pageSize
    };
  }

  // Save changes to temp storage
  async saveChangesToTemp(connectionId: string, datasetId: string, modifiedRows: DataRow[]): Promise<boolean> {
    const connection = this.connections.find(c => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error('Not connected to ADLS');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create or update temp storage
    let storage = this.tempStorage.get(datasetId);
    
    if (!storage) {
      // Get dataset info to know total row count
      const datasets = await this.listDatasets(connectionId);
      const dataset = datasets.find(d => d.id === datasetId);
      
      if (!dataset) {
        throw new Error('Dataset not found');
      }
      
      storage = {
        datasetId,
        modifiedRows: new Map(),
        totalRowCount: dataset.rowCount || 0,
        repairedCount: 0,
        lastSaved: new Date()
      };
      
      this.tempStorage.set(datasetId, storage);
    }
    
    // Update stored rows
    modifiedRows.forEach(row => {
      // If this is a new modified row, increment the repaired count
      if (!storage!.modifiedRows.has(row.__id)) {
        storage!.repairedCount++;
      }
      storage!.modifiedRows.set(row.__id, { ...row });
    });
    
    storage.lastSaved = new Date();
    
    toast({
      title: "Changes saved to temporary storage",
      description: `${storage.repairedCount} of ${storage.totalRowCount} rows repaired`,
    });
    
    // If all rows are repaired, prompt to commit
    if (storage.repairedCount >= storage.totalRowCount) {
      toast({
        title: "All rows repaired",
        description: "You can now commit all changes to the ADLS delta table",
        variant: "default",
      });
    }
    
    return true;
  }

  // Get temporary storage info for a dataset
  getTempStorage(datasetId: string): TempStorage | undefined {
    return this.tempStorage.get(datasetId);
  }

  // Commit all temporary changes to ADLS
  async commitChangesToADLS(connectionId: string, datasetId: string): Promise<boolean> {
    const connection = this.connections.find(c => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error('Not connected to ADLS');
    }

    const storage = this.tempStorage.get(datasetId);
    if (!storage) {
      throw new Error('No temporary changes to commit');
    }

    // Check if all records are repaired
    if (storage.repairedCount < storage.totalRowCount) {
      throw new Error(`Cannot commit changes: only ${storage.repairedCount} of ${storage.totalRowCount} rows have been repaired`);
    }

    // Simulate API call with longer delay for commit
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate success (always succeed when all rows are repaired)
    toast({
      title: "Changes committed successfully",
      description: `Updated ${storage.repairedCount} rows in ADLS delta table`,
      variant: "default",
    });
    
    // Clear temporary storage after successful commit
    this.tempStorage.delete(datasetId);
    
    return true;
  }

  // Legacy save method - now simulate failure with specific error
  async saveChanges(connectionId: string, datasetId: string, changes: DataRow[]): Promise<boolean> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Always throw an error to force using the new temp storage approach
    throw new Error('Failed to save changes. Azure service responded with: Insufficient permissions');
  }

  // Disconnect from ADLS
  async disconnect(connectionId: string): Promise<boolean> {
    const connectionIndex = this.connections.findIndex(c => c.id === connectionId);
    
    if (connectionIndex === -1) {
      throw new Error('Connection not found');
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.connections[connectionIndex].isConnected = false;
    return true;
  }
}

export const adlsService = new ADLSService();
