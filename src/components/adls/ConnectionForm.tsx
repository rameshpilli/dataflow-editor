
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ADLSCredentials } from '@/types/adls';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Key, ServerCog, ShieldCheck, Info, Users, Building } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { adlsService } from '@/services/adlsService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConnectionFormProps {
  onConnect: (credentials: ADLSCredentials, name: string) => Promise<void>;
  isLoading: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, isLoading }) => {
  const [connectionName, setConnectionName] = useState('My Azure Storage');
  const [useManagedIdentity, setUseManagedIdentity] = useState(false);
  const [useUserCredentials, setUseUserCredentials] = useState(false);
  const [connectionString, setConnectionString] = useState('DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey==;EndpointSuffix=core.windows.net');
  const [accountName, setAccountName] = useState('myaccount');
  const [accountKey, setAccountKey] = useState('mykey==');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [authMethod, setAuthMethod] = useState<'connection-string' | 'account-key'>('connection-string');
  const [containerFilter, setContainerFilter] = useState('ingress,bronze,silver,gold');
  const [useMockBackend, setUseMockBackend] = useState(true);
  const [authInfo, setAuthInfo] = useState<{
    supportsManagedIdentity: boolean;
    supportsConnectionString: boolean;
    supportsAccountKey: boolean;
    recommendedMethod: 'managedIdentity' | 'connectionString' | 'accountKey' | null;
    environmentInfo: {
      isAzureEnvironment: boolean;
      isDevEnvironment: boolean;
      hasSystemManagedIdentity: boolean;
      hasUserManagedIdentity: boolean;
    }
  } | null>(null);

  useEffect(() => {
    // Get available authentication methods
    const fetchAuthMethods = async () => {
      try {
        const methods = await adlsService.getAvailableAuthMethods();
        setAuthInfo(methods);

        // Set default auth method based on recommendation
        if (methods.recommendedMethod === 'managedIdentity') {
          setUseManagedIdentity(true);
        }
      } catch (error) {
        console.error('Failed to get auth methods:', error);
      }
    };

    fetchAuthMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const credentials: ADLSCredentials = {
      useManagedIdentity,
      connectionString: authMethod === 'connection-string' ? connectionString : undefined,
      accountName: authMethod === 'account-key' || useManagedIdentity ? accountName : undefined,
      accountKey: authMethod === 'account-key' ? accountKey : undefined,
      containerFilter: containerFilter.split(',').map(c => c.trim()).filter(Boolean),
      useMockBackend,
      tenantId: useManagedIdentity ? tenantId : undefined,
      clientId: useManagedIdentity ? clientId : undefined,
      useUserCredentials: useManagedIdentity ? useUserCredentials : undefined
    };
    
    await onConnect(credentials, connectionName);
  };

  const isValid = () => {
    if (!connectionName) return false;
    
    if (useManagedIdentity) {
      return !!accountName; // Only account name is required for managed identity
    }
    
    if (authMethod === 'connection-string') {
      return !!connectionString;
    } else {
      return !!accountName && !!accountKey;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-blue-200/50 dark:border-blue-900/30 overflow-hidden animate-scale-in bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/70 rounded-lg shadow-inner">
            <Database className="h-6 w-6 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
              Connect to Azure Data Lake Storage
            </CardTitle>
            <CardDescription className="text-blue-700/80 dark:text-blue-300/80 text-sm">
              Provide your ADLS credentials to connect and browse available datasets
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {authInfo?.environmentInfo.isAzureEnvironment && (
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">Azure Environment Detected</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              We detected you're running in an Azure environment. Managed identity authentication is recommended.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="connection-name" className="text-blue-900/80 dark:text-blue-100/80 font-medium">
              Connection Name
            </Label>
            <Input
              id="connection-name"
              placeholder="My ADLS Connection"
              value={connectionName}
              onChange={e => setConnectionName(e.target.value)}
              required
              className="bg-white/90 dark:bg-slate-900/80 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="container-filter" className="text-blue-900/80 dark:text-blue-100/80 font-medium flex items-center">
              Container Filter
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-1 text-blue-500/70" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-blue-100 dark:border-blue-800 p-3 max-w-xs">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Specify containers to filter by (comma-separated). Common examples include: ingress, bronze, silver, gold, or leave blank to show all.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="container-filter"
              placeholder="ingress,bronze,silver,gold"
              value={containerFilter}
              onChange={e => setContainerFilter(e.target.value)}
              className="bg-white/90 dark:bg-slate-900/80 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-900/30 shadow-sm">
            <Switch
              id="use-mock-backend"
              checked={useMockBackend}
              onCheckedChange={setUseMockBackend}
              className="data-[state=checked]:bg-blue-600"
            />
            <div className="flex items-center space-x-2">
              <ServerCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="use-mock-backend" className="cursor-pointer text-blue-800 dark:text-blue-200">
                Use Mock Backend (for testing)
              </Label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-900/30 shadow-sm">
            <Switch
              id="use-managed-identity"
              checked={useManagedIdentity}
              onCheckedChange={setUseManagedIdentity}
              className="data-[state=checked]:bg-blue-600"
            />
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="use-managed-identity" className="cursor-pointer text-blue-800 dark:text-blue-200">
                Use Azure Managed Identity
              </Label>
            </div>
          </div>
          
          {useManagedIdentity && (
            <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="account-name-mi" className="text-blue-900/80 dark:text-blue-100/80 font-medium">
                  Storage Account Name
                </Label>
                <Input
                  id="account-name-mi"
                  placeholder="myaccount"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="bg-white/90 dark:bg-slate-900/70 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/80 dark:bg-slate-900/50 border border-blue-200/50 dark:border-blue-900/30 shadow-sm">
                <Switch
                  id="use-user-credentials"
                  checked={useUserCredentials}
                  onCheckedChange={setUseUserCredentials}
                  className="data-[state=checked]:bg-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Label htmlFor="use-user-credentials" className="cursor-pointer text-blue-800 dark:text-blue-200">
                    Use Current User Identity (LDAP/AD)
                  </Label>
                </div>
              </div>
              
              {!useUserCredentials && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-id" className="text-blue-900/80 dark:text-blue-100/80 font-medium flex items-center">
                      Tenant ID
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 ml-1 text-blue-500/70" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-blue-100 dark:border-blue-800 p-3 max-w-xs">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              Optional. The Azure AD tenant ID. If not provided, the default tenant will be used.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="tenant-id"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={tenantId}
                      onChange={e => setTenantId(e.target.value)}
                      className="bg-white/90 dark:bg-slate-900/70 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client-id" className="text-blue-900/80 dark:text-blue-100/80 font-medium flex items-center">
                      Client ID
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 ml-1 text-blue-500/70" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-blue-100 dark:border-blue-800 p-3 max-w-xs">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              Optional. The client ID of the managed identity. If not provided, the system-assigned managed identity will be used.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="client-id"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      className="bg-white/90 dark:bg-slate-900/70 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          {!useManagedIdentity && (
            <Tabs 
              defaultValue="connection-string" 
              onValueChange={(value) => setAuthMethod(value as any)}
              className="border border-blue-200/50 dark:border-blue-900/30 rounded-lg overflow-hidden shadow-sm"
            >
              <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40">
                <TabsTrigger 
                  value="connection-string" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900/80 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
                >
                  Connection String
                </TabsTrigger>
                <TabsTrigger 
                  value="account-key" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900/80 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
                >
                  Account Key
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="connection-string" className="space-y-4 p-4 pt-4 bg-white/95 dark:bg-slate-900/80 rounded-b-lg">
                <div className="space-y-2">
                  <Label htmlFor="connection-string" className="text-blue-900/80 dark:text-blue-100/80 font-medium">
                    Connection String
                  </Label>
                  <div className="relative">
                    <Input
                      id="connection-string"
                      placeholder="Enter connection string"
                      value={connectionString}
                      onChange={e => setConnectionString(e.target.value)}
                      className="pl-9 bg-white/90 dark:bg-slate-900/70 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                    />
                    <Key className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 italic">
                    This is a mock service - any valid-looking connection string will work
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="account-key" className="space-y-4 p-4 pt-4 bg-white/95 dark:bg-slate-900/80 rounded-b-lg">
                <div className="space-y-2">
                  <Label htmlFor="account-name" className="text-blue-900/80 dark:text-blue-100/80 font-medium">
                    Storage Account Name
                  </Label>
                  <Input
                    id="account-name"
                    placeholder="myaccount"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className="bg-white/90 dark:bg-slate-900/70 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account-key" className="text-blue-900/80 dark:text-blue-100/80 font-medium">
                    Storage Account Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="account-key"
                      placeholder="Enter account key"
                      value={accountKey}
                      onChange={e => setAccountKey(e.target.value)}
                      className="pl-9 bg-white/90 dark:bg-slate-900/70 border-blue-200 dark:border-blue-900/50 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                      type="password"
                    />
                    <Key className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
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
      <CardFooter className="flex justify-end bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border-t border-blue-100/50 dark:border-blue-900/30 py-4">
        <Button 
          type="submit" 
          onClick={handleSubmit} 
          disabled={isLoading || !isValid()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectionForm;
