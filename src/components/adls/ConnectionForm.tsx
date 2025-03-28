
import React, { useState } from 'react';
import { ADLSCredentials } from '@/types/adls';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

// Define the props interface for ConnectionForm
interface ConnectionFormProps {
  onConnect: (credentials: ADLSCredentials, name: string) => Promise<void>;
  isLoading: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, isLoading }) => {
  const [accountName, setAccountName] = useState('');
  const [accountKey, setAccountKey] = useState('');
  const [connectionName, setConnectionName] = useState('ADLS Connection');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConnect = () => {
    // For now, let's just use the demo connection
    onConnect({
      accountName: 'datalakeaccount',
      accountKey: 'demo-key',
      useManagedIdentity: false,
      useMockBackend: true
    }, 'Demo ADLS Connection');
  };

  const handleConnectReal = () => {
    // This would connect to a real ADLS using the provided credentials
    if (!accountName || !accountKey) {
      return; // Don't connect if fields are empty
    }
    
    onConnect({
      accountName,
      accountKey,
      useManagedIdentity: false,
      useMockBackend: false
    }, connectionName || 'ADLS Connection');
  };

  return (
    <div className="connection-form-wrapper">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-blue-100 dark:border-blue-900/30">
        <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-300">Connect to ADLS Storage</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Enter your ADLS credentials to connect</p>
        
        {/* Connection form for real ADLS */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="account-name">Account Name</Label>
            <Input 
              id="account-name" 
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="yourstorageaccount"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="account-key">Account Key</Label>
            <Input 
              id="account-key" 
              type="password"
              value={accountKey}
              onChange={(e) => setAccountKey(e.target.value)}
              placeholder="Your account access key"
              className="mt-1"
            />
          </div>
          
          {showAdvanced && (
            <div>
              <Label htmlFor="connection-name">Connection Name</Label>
              <Input 
                id="connection-name" 
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="ADLS Connection"
                className="mt-1"
              />
            </div>
          )}
          
          <div className="text-right">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
            </button>
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleConnectReal}
            disabled={isLoading || !accountName || !accountKey}
          >
            {isLoading ? 'Connecting...' : 'Connect to ADLS'}
          </Button>
        </div>
        
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">Or</span>
          </div>
        </div>
        
        {/* Demo button */}
        <div className="mt-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                For demo purposes, you can connect to a mock ADLS backend with sample data.
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect to Demo ADLS'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;
