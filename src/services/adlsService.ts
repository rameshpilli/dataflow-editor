import { ADLSConnection, ADLSCredentials, Dataset, DatasetPreview, DataRow, FilterOptions } from '@/types/adls';
import { toast } from '@/hooks/use-toast';

// This is a mock service - in a real app, this would connect to Azure SDK
class ADLSService {
  private connections: ADLSConnection[] = [];

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
    
    // Return mock datasets
    return [
      {
        id: 'dataset_1',
        name: 'Customer Data',
        path: '/data/customers',
        format: 'delta',
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
        lastModified: new Date('2023-06-15')
      },
      {
        id: 'dataset_2',
        name: 'Sales Transactions',
        path: '/data/sales',
        format: 'parquet',
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
        lastModified: new Date('2023-07-20')
      },
      {
        id: 'dataset_3',
        name: 'Product Inventory',
        path: '/data/inventory',
        format: 'delta',
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
        lastModified: new Date('2023-08-05')
      }
    ];
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

  // Save changes to a dataset
  async saveChanges(connectionId: string, datasetId: string, changes: DataRow[]): Promise<boolean> {
    const connection = this.connections.find(c => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error('Not connected to ADLS');
    }

    // Simulate API call with potential failure
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly succeed or fail to demonstrate error handling
    const success = Math.random() > 0.2;
    
    if (!success) {
      throw new Error('Failed to save changes. Azure service responded with: Insufficient permissions');
    }
    
    toast({
      title: "Changes saved successfully",
      description: `Updated ${changes.length} rows in ${datasetId}`,
    });
    
    return true;
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
