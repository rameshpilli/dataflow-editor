
import React, { useState, useEffect } from 'react';
import { Container, Folder, FolderTree, Dataset } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, ChevronDown, Database, Folder as FolderIcon, FolderOpen, Server, ChevronLeft, Search, FileJson, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ContainerBrowserProps {
  containers: Container[];
  selectedContainer: Container | null;
  folders: Folder[];
  selectedFolder: Folder | null;
  folderTree: FolderTree | null;
  isLoading: boolean;
  onSelectContainer: (containerId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onBackToContainers: () => void;
  onBackToFolders: () => void;
}

const ContainerBrowser: React.FC<ContainerBrowserProps> = ({
  containers,
  selectedContainer,
  folders,
  selectedFolder,
  folderTree,
  isLoading,
  onSelectContainer,
  onSelectFolder,
  onBackToContainers,
  onBackToFolders
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>(folderTree ? 'tree' : 'list');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Automatically expand all nodes on initial load for better discoverability
  useEffect(() => {
    if (folderTree && folderTree.children.length > 0) {
      const initialExpandedNodes = new Set<string>();
      const expandFirstLevel = (node: FolderTree) => {
        initialExpandedNodes.add(node.id);
        // Only auto-expand the first level
        if (node.id === folderTree.id) {
          node.children.forEach(child => {
            initialExpandedNodes.add(child.id);
          });
        }
      };
      expandFirstLevel(folderTree);
      setExpandedNodes(initialExpandedNodes);
    }
  }, [folderTree]);
  
  const filteredContainers = containers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  const handleFolderSelect = (folderId: string) => {
    console.log(`Selecting folder with ID: ${folderId}`);
    
    if (!folderId) {
      console.error('Invalid folder ID provided');
      return;
    }
    
    // This will directly call the parent component's handler with the folder ID
    onSelectFolder(folderId);
  };
  
  const normalizeForComparison = (str: string): string => {
    return str.toLowerCase().trim();
  };

  const findFolderInCurrentView = (folderName: string, containerName?: string): Folder | undefined => {
    console.log(`Looking for folder "${folderName}" in ${folders.length} folders`);
    
    // Direct match by name (case-insensitive)
    let normalizedName = normalizeForComparison(folderName);
    let folder = folders.find(f => normalizeForComparison(f.name) === normalizedName);
    
    if (folder) {
      console.log(`Found folder by name: ${folder.name} (${folder.id})`);
      return folder;
    }
    
    // Try to match by ID patterns
    console.log(`Trying ID patterns for "${folderName}"...`);
    const possibleIds = [
      folderName,
      folderName.toLowerCase(),
      `${folderName}-folder`,
      `${folderName.toLowerCase()}-folder`,
      folderName.replace(/\s+/g, '-').toLowerCase()
    ];
    
    for (const id of possibleIds) {
      folder = folders.find(f => f.id === id);
      if (folder) {
        console.log(`Found folder by ID pattern: ${id} (${folder.name})`);
        return folder;
      }
    }
    
    // Try matching by path suffix
    if (containerName) {
      folder = folders.find(f => 
        f.path.toLowerCase().endsWith(`/${normalizedName}`) || 
        f.path.toLowerCase().includes(`${containerName.toLowerCase()}/${normalizedName}`)
      );
      if (folder) {
        console.log(`Found folder by path: ${folder.path} (${folder.id})`);
        return folder;
      }
    }
    
    // If we still can't find it, just return the first folder with dataset files if any
    if (folders.length > 0) {
      const folderWithDatasets = folders.find(f => f.hasDatasetFiles);
      if (folderWithDatasets) {
        console.log(`Couldn't find exact match for "${folderName}", using first folder with datasets: ${folderWithDatasets.name} (${folderWithDatasets.id})`);
        return folderWithDatasets;
      }
      
      // Last resort: just return the first folder
      console.log(`Couldn't find any match for "${folderName}", using first available folder: ${folders[0].name} (${folders[0].id})`);
      return folders[0];
    }
    
    console.error(`No matching folder found for "${folderName}"`);
    return undefined;
  };
  
  const handleNodeClick = (node: any) => {
    console.log('Node clicked:', node);
    
    if (node.type === 'container') {
      onSelectContainer(node.id);
    } else if (node.type === 'folder') {
      // Extract container name from the path
      const pathParts = node.path?.split('/') || [];
      const containerName = pathParts[0];
      
      // First find and select the container
      const containerToSelect = containers.find(c => 
        normalizeForComparison(c.name) === normalizeForComparison(containerName)
      );
      
      if (!containerToSelect) {
        console.error(`Container not found for path: ${node.path}`);
        toast({
          title: "Container not found",
          description: `Could not find container for path: ${node.path}`,
          variant: "destructive"
        });
        return;
      }
      
      // If we're not already in this container, select it first
      if (!selectedContainer || selectedContainer.id !== containerToSelect.id) {
        console.log(`Selecting container first: ${containerToSelect.name} (${containerToSelect.id})`);
        onSelectContainer(containerToSelect.id);
        
        // After container is selected, we need to wait for folders to load
        setTimeout(() => {
          // Use the actual folder ID if we have it
          if (node.id && typeof node.id === 'string') {
            console.log(`Selecting folder directly by ID from tree: ${node.id}`);
            handleFolderSelect(node.id);
          } else {
            // Find the folder by name
            const folderName = node.name;
            if (folders.length > 0) {
              console.log(`Looking for folder "${folderName}" after container selection`);
              const folderToSelect = findFolderInCurrentView(folderName, containerName);
              if (folderToSelect) {
                handleFolderSelect(folderToSelect.id);
              } else {
                toast({
                  title: "Folder not found",
                  description: `Could not find folder "${folderName}". Try selecting a folder from the list.`,
                  variant: "destructive"
                });
              }
            } else {
              console.error("No folders available after container selection");
              toast({
                title: "No folders available",
                description: "No folders available in this container.",
                variant: "destructive"
              });
            }
          }
        }, 500);
      } else {
        // We're already in the right container, just select the folder
        if (node.id && typeof node.id === 'string') {
          console.log(`Selecting folder directly by ID: ${node.id}`);
          handleFolderSelect(node.id);
        } else {
          const folderName = node.name;
          const folderToSelect = findFolderInCurrentView(folderName, containerName);
          if (folderToSelect) {
            handleFolderSelect(folderToSelect.id);
          } else {
            toast({
              title: "Folder not found",
              description: `Could not find folder "${folderName}". Try selecting a folder from the list.`,
              variant: "destructive"
            });
          }
        }
      }
    } else if (node.type === 'dataset') {
      const pathParts = node.path?.split('/') || [];
      if (pathParts.length >= 2) {
        const containerName = pathParts[0];
        const folderName = pathParts[1];
        
        console.log('Dataset selected:', node.name);
        console.log('Container:', containerName, 'Folder:', folderName);
        
        const containerToSelect = containers.find(c => 
          normalizeForComparison(c.name) === normalizeForComparison(containerName)
        );
        
        if (containerToSelect) {
          if (!selectedContainer || selectedContainer.id !== containerToSelect.id) {
            onSelectContainer(containerToSelect.id);
            
            setTimeout(() => {
              const folderToSelect = findFolderInCurrentView(folderName, containerName);
              
              if (folderToSelect) {
                handleFolderSelect(folderToSelect.id);
              } else {
                toast({
                  title: "Folder not found",
                  description: `Could not find parent folder "${folderName}" for dataset. Try using List View.`,
                  variant: "destructive"
                });
              }
            }, 500);
          } else {
            const folderToSelect = findFolderInCurrentView(folderName, containerName);
            
            if (folderToSelect) {
              handleFolderSelect(folderToSelect.id);
            } else {
              toast({
                title: "Folder not found",
                description: `Could not find parent folder "${folderName}" for dataset. Try using List View.`,
                variant: "destructive"
              });
            }
          }
        }
      }
    }
    
    toggleNode(node.id);
  };
  
  const renderFolderTree = (node: FolderTree, level = 0) => {
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      const hasMatchingChildren = node.children.some(child => 
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!hasMatchingChildren) {
        return null;
      }
    }
    
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedContainer?.name === node.name || selectedFolder?.name === node.name;
    
    return (
      <div key={node.id} className="pl-4">
        <div 
          className={`flex items-center py-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded px-2 cursor-pointer ${
            isSelected ? 'bg-blue-100/80 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300' : ''
          }`}
          onClick={() => handleNodeClick(node)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.id);
            }}
          >
            {node.children.length > 0 ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4" />
            )}
          </Button>
          
          {node.type === 'root' && <Server className="h-4 w-4 mr-2 text-gray-500" />}
          {node.type === 'container' && <Database className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />}
          {node.type === 'folder' && (
            isSelected ? 
              <FolderOpen className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" /> : 
              <FolderIcon className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
          )}
          {node.type === 'dataset' && (
            node.format === 'delta' ? 
              <FileJson className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" /> : 
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
          )}
          
          <span className="text-sm truncate">{node.name}</span>
          
          {node.metadata?.hasDatasetFiles && (
            <Badge variant="outline" className="ml-2 text-xs py-0 h-5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              Dataset
            </Badge>
          )}
        </div>
        
        {isExpanded && node.children.length > 0 && (
          <div className="border-l border-gray-200 dark:border-gray-700 ml-2 pl-2">
            {node.children.map(child => renderFolderTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  const renderContent = () => {
    if (viewMode === 'tree' && folderTree) {
      return (
        <ScrollArea className="h-[300px] pr-3">
          {renderFolderTree(folderTree)}
        </ScrollArea>
      );
    } else {
      return (
        <>
          {!selectedContainer ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Containers</p>
              </div>
              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-1">
                  {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center p-2 rounded">
                        <div className="h-4 w-4 bg-blue-200 dark:bg-blue-800 rounded mr-2"></div>
                        <div className="h-4 w-32 bg-blue-200 dark:bg-blue-800 rounded"></div>
                      </div>
                    ))
                  ) : filteredContainers.length > 0 ? (
                    filteredContainers.map((container) => (
                      <Button
                        key={container.id}
                        variant="ghost"
                        className={`w-full justify-start text-left font-normal h-auto py-1.5 ${
                          selectedContainer?.id === container.id
                            ? 'bg-blue-100/80 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300'
                            : ''
                        }`}
                        onClick={() => {
                          console.log('Container selected:', container.id);
                          onSelectContainer(container.id);
                        }}
                      >
                        <Database className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">{container.name}</span>
                        {container.hasDatasetFiles && (
                          <Badge variant="outline" className="ml-2 text-xs py-0 h-5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                            Dataset
                          </Badge>
                        )}
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {searchTerm ? 
                        `No containers matching "${searchTerm}"` : 
                        'No containers available'
                      }
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 pl-0"
                  onClick={onBackToContainers}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="text-sm">Back to Containers</span>
                </Button>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedContainer.name}
                  </p>
                </div>
              </div>
              
              <ScrollArea className="h-[250px] pr-3">
                <div className="space-y-1">
                  {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center p-2 rounded">
                        <div className="h-4 w-4 bg-amber-200 dark:bg-amber-800 rounded mr-2"></div>
                        <div className="h-4 w-32 bg-amber-200 dark:bg-amber-800 rounded"></div>
                      </div>
                    ))
                  ) : filteredFolders.length > 0 ? (
                    filteredFolders.map((folder) => (
                      <TooltipProvider key={folder.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start text-left font-normal h-auto py-1.5 ${
                                selectedFolder?.id === folder.id
                                  ? 'bg-blue-100/80 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300'
                                  : ''
                              }`}
                              onClick={() => {
                                console.log(`List view: Folder clicked - ${folder.id} (${folder.name})`);
                                console.log(`Folder data:`, JSON.stringify(folder));
                                handleFolderSelect(folder.id);
                              }}
                              data-folder-id={folder.id}
                              data-folder-name={folder.name}
                            >
                              {selectedFolder?.id === folder.id ? (
                                <FolderOpen className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                              ) : (
                                <FolderIcon className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                              )}
                              <span className="truncate">{folder.name}</span>
                              {folder.hasDatasetFiles && (
                                <Badge variant="outline" className="ml-2 text-xs py-0 h-5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                  Dataset
                                </Badge>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{folder.name}</p>
                              <p className="text-xs">{folder.path}</p>
                              {folder.folderCount !== undefined && (
                                <p className="text-xs">
                                  {folder.folderCount} folder{folder.folderCount !== 1 ? 's' : ''}, 
                                  {folder.blobCount !== undefined && ` ${folder.blobCount} file${folder.blobCount !== 1 ? 's' : ''}`}
                                </p>
                              )}
                              {folder.hasDatasetFiles && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  Contains datasets: {folder.datasetFormats?.join(', ')}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {searchTerm ? 
                        `No folders matching "${searchTerm}"` : 
                        'No folders available'
                      }
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </>
      );
    }
  };
  
  return (
    <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 pb-3 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-blue-800 dark:text-blue-200">Data Browser</CardTitle>
          
          {folderTree && (
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'list' | 'tree')}
              className="h-8"
            >
              <TabsList className="h-7 p-0.5">
                <TabsTrigger
                  value="list"
                  className="text-xs h-6 px-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300"
                >
                  List View
                </TabsTrigger>
                <TabsTrigger
                  value="tree"
                  className="text-xs h-6 px-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300"
                >
                  Tree View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-3">
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder={viewMode === 'tree' ? "Search folders..." : selectedContainer ? "Search folders..." : "Search containers..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 bg-white/90 dark:bg-gray-900/70 border-blue-200/60 dark:border-blue-900/40"
          />
        </div>
        
        <Separator className="my-3 bg-blue-100/50 dark:bg-blue-900/30" />
        
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ContainerBrowser;
