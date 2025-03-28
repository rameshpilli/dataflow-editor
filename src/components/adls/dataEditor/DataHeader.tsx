
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  AlertCircle,
  Database,
  Table,
  Edit3,
  Save
} from 'lucide-react';
import { useDataEditor } from '../DataEditorContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DataHeaderProps {
  onBackConfirmation: boolean;
  setShowBackConfirmation: (show: boolean) => void;
}

const DataHeader: React.FC<DataHeaderProps> = ({
  onBackConfirmation,
  setShowBackConfirmation
}) => {
  const { 
    dataset, 
    editMode,
    changes,
    modifiedRows,
    canCommit,
    onGoBack
  } = useDataEditor();

  const handleBackClick = () => {
    console.log("Back button clicked");
    if (changes.length > 0) {
      console.log("Changes detected, showing confirmation dialog");
      setShowBackConfirmation(true);
    } else {
      console.log("No changes, going back directly");
      onGoBack();
    }
  };

  const handleConfirmBack = () => {
    console.log("Confirmed going back, discarding changes");
    setShowBackConfirmation(false);
    onGoBack();
  };

  return (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30">
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackClick}
          className="mr-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 border-blue-200 dark:border-blue-800 transition-all duration-200 font-medium"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 ml-2">
          {dataset?.name || 'Dataset'}
        </h2>

        <div className="flex items-center ml-4 space-x-2">
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <Database className="h-3 w-3 mr-1" />
            {dataset?.rowCount?.toLocaleString() || 'Unknown'} rows
          </Badge>
          
          <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
            <Table className="h-3 w-3 mr-1" />
            {dataset?.columns?.length || 0} columns
          </Badge>
          
          {editMode && (
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Mode
            </Badge>
          )}
          
          {changes.length > 0 && (
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              <Save className="h-3 w-3 mr-1" />
              {modifiedRows.size} {modifiedRows.size === 1 ? 'row' : 'rows'} modified
            </Badge>
          )}
        </div>
      </div>
      
      <div>
        {changes.length > 0 && !canCommit && (
          <Alert variant="warning" className="mb-0 py-1 px-3 mt-0 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-medium text-amber-800 dark:text-amber-300 ml-2">Uncommitted changes</AlertTitle>
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-400 ml-2">
              Save your changes before exiting
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <AlertDialog open={onBackConfirmation} onOpenChange={setShowBackConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to {modifiedRows.size} {modifiedRows.size === 1 ? 'row' : 'rows'}.
              Going back will discard all these changes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBack} className="bg-red-600 hover:bg-red-700">
              Discard Changes & Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DataHeader;
