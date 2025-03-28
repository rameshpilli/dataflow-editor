
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ADLSCredentials } from '@/types/adls';
import { Database, Key, Lock, LinkIcon, ServerIcon, ShieldCheck, AlertTriangle, FileBox } from 'lucide-react';
import { adlsService } from '@/services/adlsService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ConnectionFormProps {
  onConnect: (credentials: ADLSCredentials, name: string) => Promise<void>;
  isLoading: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, isLoading }) => {
  const [connectionName, setConnectionName] = useState('');
  const [useManagedIdentity, setUseManagedIdentity] = useState(true);
  const [connectionString, setConnectionString] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountKey, setAccountKey] = useState('');
  const [showConnectionString, setShowConnectionString] = useState(false);
  const [showAccountKey, setShowAccountKey] = useState(false);
  const [connectionType, setConnectionType] = useState<'mock' | 'real'>('real');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [useUserCredentials, setUseUserCredentials] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const fetchAuthMethods = async () => {
    try {
      const methods = await adlsService.getAvailableAuthMethods();
      if (methods) {
        if (!methods.supportsManagedIdentity) {
          setUseManagedIdentity(false);
        }
      }
    } catch (err) {
      console.error('Failed to get auth methods:', err);
      // If backend is unavailable, show message but don't enable mock option by default
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('backend'))) {
        setBackendUnavailable(true);
      }
    }
  };

  useEffect(() => {
    fetchAuthMethods();
  }, []);

  const handleConnect = async () => {
    if (!connectionName) {
      setConnectionError('Please enter a connection name.');
      setShowErrorDialog(true);
      return;
    }
    
    try {
      let credentials: ADLSCredentials;
      
      if (connectionType === 'mock') {
        credentials = {
          useManagedIdentity: false,
          useMockBackend: true,
        };
      } else if (useManagedIdentity) {
        credentials = {
          useManagedIdentity: true,
          useUserCredentials: useUserCredentials,
          tenantId: tenantId || undefined,
          clientId: clientId || undefined,
        };
      } else if (showConnectionString) {
        if (!connectionString) {
          setConnectionError('Please enter a connection string.');
          setShowErrorDialog(true);
          return;
        }
        credentials = {
          useManagedIdentity: false,
          connectionString: connectionString,
        };
      } else if (showAccountKey) {
        if (!accountName || !accountKey) {
          setConnectionError('Please enter both account name and account key.');
          setShowErrorDialog(true);
          return;
        }
        credentials = {
          useManagedIdentity: false,
          accountName: accountName,
          accountKey: accountKey,
        };
      } else {
        setConnectionError('Please select an authentication method.');
        setShowErrorDialog(true);
        return;
      }
      
      await onConnect(credentials, connectionName);
    } catch (err) {
      console.error('Connection failed:', err);
      setConnectionError(err instanceof Error ? err.message : 'Connection failed. Please try again.');
      setShowErrorDialog(true);
    }
  };

  return (
    <div className="animate-scale-in">
      <Card className="w-full max-w-2xl mx-auto overflow-hidden border-opacity-30 dark:border-opacity-20 dark:bg-slate-800/90 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-50 transition-colors duration-300">Connect to ADLS</CardTitle>
          <CardDescription className="transition-colors duration-300">
            Configure your ADLS connection settings
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-blue-900/80 dark:text-blue-100/80">Connection Name</Label>
            <Input
              id="name"
              placeholder="My ADLS Connection"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-blue-900/80 dark:text-blue-100/80">Connection Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={connectionType === 'real' ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-24 p-4 transition-all ${
                  connectionType === 'real' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-blue-50 hover:text-blue-600'
                }`}
                onClick={() => setConnectionType('real')}
              >
                <Database className="h-8 w-8 mb-2" />
                <span>Real ADLS Storage</span>
              </Button>
              
              <Button
                type="button"
                variant={connectionType === 'mock' ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-24 p-4 transition-all ${
                  connectionType === 'mock' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-blue-50 hover:text-blue-600'
                }`}
                onClick={() => setConnectionType('mock')}
              >
                <FileBox className="h-8 w-8 mb-2" />
                <span>Mock Data</span>
              </Button>
            </div>
            
            {connectionType === 'mock' && (
              <p className="text-sm text-blue-500/70 dark:text-blue-400/70 italic mt-2">
                Using mock data for demonstration purposes. No actual ADLS connection will be made.
              </p>
            )}
          </div>

          {connectionType === 'real' && (
            <Tabs defaultValue="managedIdentity" className="w-full">
              <TabsList>
                <TabsTrigger value="managedIdentity" className="transition-colors duration-200 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-50">
                  <Lock className="mr-2 h-4 w-4" />
                  Managed Identity
                </TabsTrigger>
                <TabsTrigger value="connectionString" className="transition-colors duration-200 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-50">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connection String
                </TabsTrigger>
                <TabsTrigger value="accountKey" className="transition-colors duration-200 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-50">
                  <Key className="mr-2 h-4 w-4" />
                  Account Key
                </TabsTrigger>
              </TabsList>
              <TabsContent value="managedIdentity" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-current-user"
                    checked={useUserCredentials}
                    onCheckedChange={(checked) => setUseUserCredentials(checked === true)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 transition-colors duration-200"
                  />
                  <Label htmlFor="use-current-user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-900/80 dark:text-blue-100/80">
                    Use Current User Identity
                  </Label>
                </div>
                <p className="text-sm text-blue-500/70 dark:text-blue-400/70 italic mt-1">
                  Uses the identity of the current logged in user (LDAP/Active Directory)
                </p>
                <div className="space-y-2">
                  <Label htmlFor="tenantId" className="text-blue-900/80 dark:text-blue-100/80">Tenant ID (optional)</Label>
                  <Input
                    id="tenantId"
                    placeholder="Enter your Azure Tenant ID"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-blue-900/80 dark:text-blue-100/80">Client ID (optional)</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter your Azure Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
              </TabsContent>
              <TabsContent value="connectionString" className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="connectionString" className="text-blue-900/80 dark:text-blue-100/80">Connection String</Label>
                  <Input
                    id="connectionString"
                    placeholder="Enter your connection string"
                    type="password"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
              </TabsContent>
              <TabsContent value="accountKey" className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-blue-900/80 dark:text-blue-100/80">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Enter your account name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountKey" className="text-blue-900/80 dark:text-blue-100/80">Account Key</Label>
                  <Input
                    id="accountKey"
                    placeholder="Enter your account key"
                    type="password"
                    value={accountKey}
                    onChange={(e) => setAccountKey(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/50 transition-all duration-300 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-blue-200 dark:hover:border-blue-700"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleConnect} disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {connectionType === 'mock' ? 'Connect to Mock Data' : 'Connect to ADLS'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {backendUnavailable && connectionType === 'real' && (
        <Alert className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Backend server is unavailable. You may want to switch to mock data for demonstration purposes.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Connection Error</DialogTitle>
            <DialogDescription>
              {connectionError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionForm;
