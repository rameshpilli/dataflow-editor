
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ADLSCredentials } from '@/types/adls';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Key, ServerCog } from 'lucide-react';

interface ConnectionFormProps {
  onConnect: (credentials: ADLSCredentials, name: string) => Promise<void>;
  isLoading: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, isLoading }) => {
  const [connectionName, setConnectionName] = useState('My Azure Storage');
  const [useManagedIdentity, setUseManagedIdentity] = useState(false);
  const [connectionString, setConnectionString] = useState('DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey==;EndpointSuffix=core.windows.net');
  const [accountName, setAccountName] = useState('myaccount');
  const [accountKey, setAccountKey] = useState('mykey==');
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
    <Card className="w-full max-w-md mx-auto shadow-lg border-blue-100/50 dark:border-blue-900/30 overflow-hidden animate-scale-in">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>Connect to Azure Data Lake Storage</CardTitle>
            <CardDescription>
              Provide your ADLS credentials to connect and browse available datasets
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="connection-name" className="text-blue-900/80 dark:text-blue-100/80">Connection Name</Label>
            <Input
              id="connection-name"
              placeholder="My ADLS Connection"
              value={connectionName}
              onChange={e => setConnectionName(e.target.value)}
              required
              className="bg-white/80 dark:bg-slate-900/50 border-blue-100 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            />
          </div>
          
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20">
            <Switch
              id="use-managed-identity"
              checked={useManagedIdentity}
              onCheckedChange={setUseManagedIdentity}
            />
            <div className="flex items-center space-x-2">
              <ServerCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="use-managed-identity" className="cursor-pointer">Use Azure Managed Identity</Label>
            </div>
          </div>
          
          {!useManagedIdentity && (
            <Tabs 
              defaultValue="connection-string" 
              onValueChange={(value) => setAuthMethod(value as any)}
              className="border border-blue-100/50 dark:border-blue-900/30 rounded-lg overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-2 bg-blue-50 dark:bg-blue-950/30">
                <TabsTrigger value="connection-string" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/70">
                  Connection String
                </TabsTrigger>
                <TabsTrigger value="account-key" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/70">
                  Account Key
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="connection-string" className="space-y-4 p-4 pt-4 bg-white/80 dark:bg-slate-900/50 rounded-b-lg">
                <div className="space-y-2">
                  <Label htmlFor="connection-string" className="text-blue-900/80 dark:text-blue-100/80">Connection String</Label>
                  <div className="relative">
                    <Input
                      id="connection-string"
                      placeholder="Enter connection string"
                      value={connectionString}
                      onChange={e => setConnectionString(e.target.value)}
                      className="pl-9 bg-white/80 dark:bg-slate-900/80 border-blue-100 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                    />
                    <Key className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 italic">
                    This is a mock service - any valid-looking connection string will work
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="account-key" className="space-y-4 p-4 pt-4 bg-white/80 dark:bg-slate-900/50 rounded-b-lg">
                <div className="space-y-2">
                  <Label htmlFor="account-name" className="text-blue-900/80 dark:text-blue-100/80">Storage Account Name</Label>
                  <Input
                    id="account-name"
                    placeholder="myaccount"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/80 border-blue-100 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account-key" className="text-blue-900/80 dark:text-blue-100/80">Storage Account Key</Label>
                  <div className="relative">
                    <Input
                      id="account-key"
                      placeholder="Enter account key"
                      value={accountKey}
                      onChange={e => setAccountKey(e.target.value)}
                      className="pl-9 bg-white/80 dark:bg-slate-900/80 border-blue-100 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                    />
                    <Key className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 italic">
                    This is a mock service - any valid-looking account key will work
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-t border-blue-100/30 dark:border-blue-900/20">
        <Button 
          type="submit" 
          onClick={handleSubmit} 
          disabled={isLoading || !isValid()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all duration-300 hover:shadow-lg"
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectionForm;
