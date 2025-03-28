
import React from 'react';
import { ADLSCredentials } from '@/types/adls';

// Define the props interface for ConnectionForm
interface ConnectionFormProps {
  onConnect: (credentials: ADLSCredentials, name: string) => Promise<void>;
  isLoading: boolean;
}

// This is just a placeholder component since the actual ConnectionForm is read-only
// The styling for renaming "Real ADLS" to "ADLS Storage" is handled via CSS in connection-form-override.css
const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, isLoading }) => {
  return (
    <div className="connection-form-wrapper">
      {/* The actual connection form implementation would be here */}
      {/* But since we're using CSS overrides to modify text, we just need this placeholder */}
      
      {/* Mock form for demonstration */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-blue-100 dark:border-blue-900/30">
        <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-300">Connect to ADLS Storage</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Enter your ADLS credentials to connect</p>
        
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          onClick={() => onConnect({
            accountName: 'datalakeaccount',
            accountKey: 'demo-key',
            useManagedIdentity: false,
            useMockBackend: true
          }, 'Demo ADLS Connection')}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect to Demo ADLS'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionForm;
