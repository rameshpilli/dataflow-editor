
import React from 'react';
import { Container, Folder } from '@/types/adls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FolderOpen, Database, ChevronLeft, HardDrive, FolderArchive, FolderInput, FolderOutput, FolderSymlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContainerBrowserProps {
  containers: Container[];
  selectedContainer: Container | null;
  folders: Folder[];
  selectedFolder: Folder | null;
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
  isLoading,
  onSelectContainer,
  onSelectFolder,
  onBackToContainers,
  onBackToFolders
}) => {
  const getContainerIcon = (containerType: string) => {
    switch (containerType) {
      case 'ingress':
        return <FolderInput className="h-5 w-5 text-green-500" />;
      case 'bronze':
        return <FolderArchive className="h-5 w-5 text-amber-500" />;
      case 'silver':
        return <FolderOutput className="h-5 w-5 text-blue-500" />;
      case 'gold':
        return <FolderSymlink className="h-5 w-5 text-yellow-500" />;
      default:
        return <HardDrive className="h-5 w-5 text-purple-500" />;
    }
  };
  
  const getContainerBadge = (containerType: string) => {
    switch (containerType) {
      case 'ingress':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">{containerType}</Badge>;
      case 'bronze':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">{containerType}</Badge>;
      case 'silver':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{containerType}</Badge>;
      case 'gold':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">{containerType}</Badge>;
      default:
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">{containerType}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-md border-opacity-40 overflow-hidden animate-pulse">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="h-6 w-48 bg-blue-200 dark:bg-blue-800 rounded"></div>
          <div className="h-4 w-72 bg-blue-100 dark:bg-blue-900 rounded mt-2"></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedContainer) {
    // Container browsing view
    return (
      <Card className="shadow-lg border border-blue-100 dark:border-blue-900/40 overflow-hidden rounded-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40 py-5">
          <CardTitle className="text-blue-700 dark:text-blue-300 text-2xl">Storage Containers</CardTitle>
          <CardDescription className="text-blue-600/70 dark:text-blue-400/70 mt-1">
            Select a container to browse its folders and datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table fullWidth={true} hoverable={true} striped={true} compact={true}>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Type</TableHead>
                  <TableHead className="w-[180px] text-blue-700 dark:text-blue-300 font-semibold">Name</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-center">Folders</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-center">Blobs</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Last Modified</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-semibold"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((container) => (
                  <TableRow key={container.id} className="transition-all duration-150">
                    <TableCell>
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md inline-flex">
                        {getContainerIcon(container.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate text-blue-800 dark:text-blue-200">
                      {container.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-mono">
                        {container.folderCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 rounded-full font-mono">
                        {container.blobCount}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400">
                      {container.lastModified 
                        ? format(container.lastModified, 'MMM d, yyyy') 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm hover:shadow transition-all duration-200 group"
                        onClick={() => onSelectContainer(container.id)}
                      >
                        Browse
                        <FolderOpen className="h-3.5 w-3.5 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  } else if (!selectedFolder) {
    // Folder browsing view
    return (
      <Card className="shadow-lg border border-blue-100 dark:border-blue-900/40 overflow-hidden rounded-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40" 
                  onClick={onBackToContainers}
                >
                  <ChevronLeft className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </Button>
                <CardTitle className="text-blue-700 dark:text-blue-300 text-2xl">
                  {selectedContainer.name} {getContainerBadge(selectedContainer.type)}
                </CardTitle>
              </div>
              <CardDescription className="text-blue-600/70 dark:text-blue-400/70 mt-1 ml-10">
                Browse folders within this container
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {folders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table fullWidth={true} hoverable={true} striped={true} compact={true}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Type</TableHead>
                    <TableHead className="w-[180px] text-blue-700 dark:text-blue-300 font-semibold">Name</TableHead>
                    <TableHead className="w-[220px] text-blue-700 dark:text-blue-300 font-semibold">Path</TableHead>
                    <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-center">Subfolders</TableHead>
                    <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-center">Blobs</TableHead>
                    <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Last Modified</TableHead>
                    <TableHead className="text-blue-700 dark:text-blue-300 font-semibold"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folders.map((folder) => (
                    <TableRow key={folder.id} className="transition-all duration-150">
                      <TableCell>
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md inline-flex">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate text-blue-800 dark:text-blue-200">
                        {folder.name}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-mono text-xs truncate max-w-[220px] cursor-help bg-gray-50 dark:bg-gray-800/40 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                                {folder.path}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="font-mono text-xs p-2 max-w-md break-all bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border-blue-100 dark:border-blue-800" side="bottom">
                              {folder.path}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-mono">
                          {folder.folderCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 rounded-full font-mono">
                          {folder.blobCount}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {folder.lastModified 
                          ? format(folder.lastModified, 'MMM d, yyyy') 
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm hover:shadow transition-all duration-200 group"
                          onClick={() => onSelectFolder(folder.id)}
                        >
                          Browse
                          <Database className="h-3.5 w-3.5 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-blue-300 dark:text-blue-700 mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-1">No folders found</h3>
              <p className="text-blue-600/70 dark:text-blue-400/70 max-w-md mx-auto">
                This container doesn't contain any folders. You can still view datasets associated with this container.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  } else {
    // Show datasets within folder view - this is handled by the DatasetList component
    return (
      <Card className="shadow-lg border border-blue-100 dark:border-blue-900/40 overflow-hidden rounded-xl mb-4">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40" 
                  onClick={onBackToFolders}
                >
                  <ChevronLeft className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </Button>
                <CardTitle className="text-blue-700 dark:text-blue-300 text-2xl flex items-center space-x-2">
                  <span>{selectedContainer.name}</span>
                  {getContainerBadge(selectedContainer.type)}
                  <span className="mx-2 text-blue-300 dark:text-blue-700">/</span>
                  <span>{selectedFolder.name}</span>
                </CardTitle>
              </div>
              <CardDescription className="text-blue-600/70 dark:text-blue-400/70 mt-1 ml-10">
                Viewing datasets in this folder
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }
};

export default ContainerBrowser;
