
import React from 'react';
import { DatasetColumn } from '@/types/adls';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { SortAsc, SortDesc, Edit, Trash, ArrowUpDown, EyeOff } from 'lucide-react';

interface ColumnMenuProps {
  column: DatasetColumn;
  children: React.ReactNode;
  onSort: (direction: 'asc' | 'desc' | null) => void;
  onEditAll: () => void;
  onEditSelected: () => void;
  onSetNull: () => void;
  onSetNullSelected: () => void;
  onHide: () => void;
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
  hasSelectedRows
}) => {
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
        <ContextMenuItem onClick={onHide}>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Column
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ColumnMenu;
