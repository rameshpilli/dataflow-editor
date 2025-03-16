
import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeftCircle, 
  ShieldCheck
} from 'lucide-react';
import { 
  Card,
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDataEditor } from '../DataEditorContext';

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
    dataPreview, 
    changes,
    repairedCount,
    isFullscreen, 
    onGoBack,
    onSaveChanges,
    onDiscardChanges
  } = useDataEditor();

  const handleBackClick = () => {
    if (changes.length > 0) {
      setShowBackConfirmation(true);
    } else {
      onGoBack();
    }
  };

  const handleConfirmDiscardAndGoBack = () => {
    onDiscardChanges();
    onGoBack();
    setShowBackConfirmation(false);
  };

  const handleSaveAndGoBack = async () => {
    const saveSuccessful = await onSaveChanges();
    if (saveSuccessful) {
      onGoBack();
    }
    setShowBackConfirmation(false);
  };

  return (
    <>
      <CardHeader className={cn(
        "pb-2 transition-all duration-200", 
        isFullscreen ? "py-2" : ""
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackClick} 
              className="mr-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 border-blue-200 dark:border-blue-800 transition-all duration-200 font-medium"
            >
              <ArrowLeftCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              Back
            </Button>
            <CardTitle>{dataset.name}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg px-4 py-2 shadow-sm border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Repair Progress</div>
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={dataset.rowCount ? (repairedCount / dataset.rowCount) * 100 : 0} 
                      className="h-2 w-24 bg-blue-100 dark:bg-blue-900/50"
                    />
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-white dark:bg-gray-800 text-xs font-semibold py-0 h-5 border-blue-200 dark:border-blue-800">
                        <span className="text-indigo-600 dark:text-indigo-400">{repairedCount}</span>
                        <span className="text-gray-500 dark:text-gray-400">/</span>
                        <span className="text-gray-600 dark:text-gray-300">{dataset.rowCount || 0}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CardDescription>
          {dataPreview ? `Displaying ${dataPreview.rows.length} of ${dataPreview.totalRows} rows` : 'Loading data...'}
        </CardDescription>
      </CardHeader>

      <AlertDialog open={onBackConfirmation} onOpenChange={setShowBackConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              There are {changes.length} unsaved changes. Do you want to save them before going back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBackConfirmation(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscardAndGoBack} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndGoBack}>
              Save & Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataHeader;
