
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Keyboard, Search } from 'lucide-react';

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => (
  <div className="flex justify-between items-center mb-3">
    <span className="text-sm text-slate-600 dark:text-slate-300">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-slate-400">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const KeyboardShortcutsDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden md:inline">Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate the application more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-sm font-medium mb-2 text-slate-900 dark:text-slate-100">General</h3>
          <ShortcutItem keys={["/"]} description="Focus search" />
          <ShortcutItem keys={["?"]} description="Show this dialog" />
          <ShortcutItem keys={["Esc"]} description="Close modal or cancel" />
          
          <h3 className="text-sm font-medium mb-2 mt-6 text-slate-900 dark:text-slate-100">Navigation</h3>
          <ShortcutItem keys={["G", "H"]} description="Go to home" />
          <ShortcutItem keys={["G", "D"]} description="Go to datasets" />
          
          <h3 className="text-sm font-medium mb-2 mt-6 text-slate-900 dark:text-slate-100">Data Editing</h3>
          <ShortcutItem keys={["Ctrl", "S"]} description="Save changes" />
          <ShortcutItem keys={["Ctrl", "Z"]} description="Undo last change" />
          <ShortcutItem keys={["Tab"]} description="Move to next cell" />
          <ShortcutItem keys={["Shift", "Tab"]} description="Move to previous cell" />
          <ShortcutItem keys={["Enter"]} description="Edit current cell" />
          <ShortcutItem keys={["Ctrl", "Enter"]} description="Commit all changes" />
          <ShortcutItem keys={["Ctrl", "F"]} description="Filter data" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
