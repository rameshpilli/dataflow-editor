
import React from 'react';
import { DatasetColumn } from '@/types/adls';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { SortAsc, SortDesc, Edit, Trash, ArrowUpDown, EyeOff, Type, Calendar, LetterCase } from 'lucide-react';

interface ColumnMenuProps {
  column: DatasetColumn;
  children: React.ReactNode;
  onSort: (direction: 'asc' | 'desc' | null) => void;
  onEditAll: () => void;
  onEditSelected: () => void;
  onSetNull: () => void;
  onSetNullSelected: () => void;
  onHide: () => void;
  onTransform?: (type: string) => void;
  hasSelectedRows: boolean;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({
  column,
  children,
  onSort,
  onEditAll,
  onEditSelected,
  onSetNull,
  onSetNullSelected,
  onHide,
  onTransform,
  hasSelectedRows
}) => {
  const handleTransform = (type: string) => {
    if (onTransform) {
      onTransform(type);
    } else {
      // Fallback if transform handler isn't provided
      console.warn('Transform handler not provided for column', column.name);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onSort('asc')}>
          <SortAsc className="mr-2 h-4 w-4" />
          Sort Ascending
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onSort('desc')}>
          <SortDesc className="mr-2 h-4 w-4" />
          Sort Descending
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onSort(null)}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Clear Sorting
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onEditAll}>
          <Edit className="mr-2 h-4 w-4" />
          Edit All Values
        </ContextMenuItem>
        {hasSelectedRows && (
          <ContextMenuItem onClick={onEditSelected}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Selected Values
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onSetNull}>
          <Trash className="mr-2 h-4 w-4" />
          Set All to NULL
        </ContextMenuItem>
        {hasSelectedRows && (
          <ContextMenuItem onClick={onSetNullSelected}>
            <Trash className="mr-2 h-4 w-4" />
            Set Selected to NULL
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        
        {/* Column transformations submenu */}
        {onTransform && (column.type === 'string' || column.type === 'date' || column.type === 'timestamp') && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Type className="mr-2 h-4 w-4" />
                Transform Values
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                {column.type === 'string' && (
                  <>
                    <ContextMenuItem onClick={() => handleTransform('uppercase')}>
                      <LetterCase className="mr-2 h-4 w-4" />
                      Convert to UPPERCASE
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleTransform('lowercase')}>
                      <LetterCase className="mr-2 h-4 w-4" />
                      Convert to lowercase
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleTransform('capitalize')}>
                      <LetterCase className="mr-2 h-4 w-4" />
                      Capitalize Words
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleTransform('trim')}>
                      <LetterCase className="mr-2 h-4 w-4" />
                      Trim Whitespace
                    </ContextMenuItem>
                  </>
                )}
                {(column.type === 'date' || column.type === 'timestamp') && (
                  <>
                    <ContextMenuItem onClick={() => handleTransform('iso')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Format as ISO
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleTransform('localeDate')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Format as Local Date
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleTransform('localeDateTime')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Format as Local Date & Time
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        
        <ContextMenuItem onClick={onHide}>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Column
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ColumnMenu;
