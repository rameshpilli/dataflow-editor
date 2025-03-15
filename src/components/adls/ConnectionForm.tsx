
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ADLSCredentials } from '@/types/adls';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConnectionFormProps {
  onConnect: (credentials: ADLSCredentials, name: string) => Promise<void>;
  isLoading: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, isLoading }) => {
  const [connectionName, setConnectionName] = useState('');
  const [useManagedIdentity, setUseManagedIdentity] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountKey, setAccountKey] = useState('');
  const [authMethod, setAuthMethod] = useState<'connection-string' | 'account-key'>('connection-string');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const credentials: ADLSCredentials = {
      useManagedIdentity,
      connectionString: authMethod === 'connection-string' ? connectionString : undefined,
      accountName: authMethod === 'account-key' ? accountName : undefined,
      accountKey: authMethod === 'account-key' ? accountKey : undefined
    };
    
    await onConnect(credentials, connectionName);
  };

  const isValid = () => {
    if (!connectionName) return false;
    
    if (useManagedIdentity) return true;
    
    if (authMethod === 'connection-string') {
      return !!connectionString;
    } else {
      return !!accountName && !!accountKey;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to Azure Data Lake Storage</CardTitle>
        <CardDescription>
          Provide your ADLS credentials to connect and browse available datasets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="connection-name">Connection Name</Label>
            <Input
              id="connection-name"
              placeholder="My ADLS Connection"
              value={connectionName}
              onChange={e => setConnectionName(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="use-managed-identity"
              checked={useManagedIdentity}
              onCheckedChange={setUseManagedIdentity}
            />
            <Label htmlFor="use-managed-identity">Use Azure Managed Identity</Label>
          </div>
          
          {!useManagedIdentity && (
            <Tabs defaultValue="connection-string" onValueChange={(value) => setAuthMethod(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connection-string">Connection String</TabsTrigger>
                <TabsTrigger value="account-key">Account Key</TabsTrigger>
              </TabsList>
              
              <TabsContent value="connection-string" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="connection-string">Connection String</Label>
                  <Input
                    id="connection-string"
                    type="password"
                    placeholder="Enter connection string"
                    value={connectionString}
                    onChange={e => setConnectionString(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="account-key" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Storage Account Name</Label>
                  <Input
                    id="account-name"
                    placeholder="myaccount"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account-key">Storage Account Key</Label>
                  <Input
                    id="account-key"
                    type="password"
                    placeholder="Enter account key"
                    value={accountKey}
                    onChange={e => setAccountKey(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          onClick={handleSubmit} 
          disabled={isLoading || !isValid()}
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectionForm;
