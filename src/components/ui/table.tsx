
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { 
    fullWidth?: boolean;
    zoomLevel?: number;
    columnResizing?: boolean;
    alternateRowColors?: boolean;
    compact?: boolean;
    striped?: boolean;
    borderless?: boolean;
    hoverable?: boolean;
  }
>(({ 
  className, 
  fullWidth = false, 
  zoomLevel = 100, 
  columnResizing = false, 
  alternateRowColors = false,
  compact = false,
  striped = false,
  borderless = false,
  hoverable = true,
  ...props 
}, ref) => (
  <div className={cn(
    "relative w-full overflow-auto rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-shadow duration-200 hover:shadow-md",
    fullWidth ? "max-w-none" : "",
  )}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm border-collapse",
        columnResizing ? "table-fixed" : "",
        alternateRowColors ? "even:[&_tr:nth-child(even)]:bg-gray-50 dark:even:[&_tr:nth-child(even)]:bg-gray-800/30" : "",
        striped ? "[&_tbody_tr:nth-child(odd)]:bg-gray-50 dark:[&_tbody_tr:nth-child(odd)]:bg-gray-900/40" : "",
        compact ? "[&_th]:py-2 [&_td]:py-2" : "",
        borderless ? "border-none [&_tr]:border-none [&_th]:border-none [&_td]:border-none" : "[&_th]:border-b [&_td]:border-b [&_tr:last-child_td]:border-b-0",
        hoverable ? "[&_tbody_tr]:hover:bg-blue-50/80 dark:[&_tbody_tr]:hover:bg-blue-900/30 [&_tbody_tr]:transition-colors duration-150" : "",
        className
      )}
      style={{ 
        fontSize: `${zoomLevel / 100}rem`,
        tableLayout: columnResizing ? "fixed" : "auto"
      }}
      role="grid"
      aria-label="Data table"
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "[&_tr]:border-b sticky top-0 bg-gray-200/95 dark:bg-gray-800/95 z-10 backdrop-blur-sm shadow-md", 
      className
    )}
    role="rowgroup"
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    role="rowgroup"
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 sticky bottom-0 bg-white dark:bg-gray-900 z-10 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]",
      className
    )}
    role="rowgroup"
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { 
    isHighlighted?: boolean;
    isAlternate?: boolean;
    isSelected?: boolean;
  }
>(({ className, isHighlighted, isAlternate, isSelected, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors data-[state=selected]:bg-muted",
      isHighlighted ? "bg-blue-50 dark:bg-blue-900/30" : "",
      isAlternate ? "bg-gray-50 dark:bg-gray-800/30" : "",
      isSelected ? "bg-blue-100 dark:bg-blue-800/40 outline outline-2 outline-blue-300 dark:outline-blue-700/50" : "",
      className
    )}
    role="row"
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    minWidth?: number;
    width?: number;
    isSorted?: boolean;
    sortDirection?: 'asc' | 'desc';
  }
>(({ className, minWidth, width, isSorted, sortDirection, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-semibold text-gray-800 dark:text-gray-200 [&:has([role=checkbox])]:pr-0 transition-colors select-none",
      "whitespace-nowrap bg-gray-200/95 dark:bg-gray-700/95 border-r last:border-r-0 backdrop-blur-sm", 
      "group hover:bg-gray-300/95 dark:hover:bg-gray-600/95",
      "first:rounded-tl-sm last:rounded-tr-sm",
      isSorted && "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-[inset_0_-2px_0_0_rgba(59,130,246,0.5)]",
      "table-header-cell",
      className
    )}
    style={{
      minWidth: minWidth ? `${minWidth}px` : undefined,
      width: width ? `${width}px` : undefined,
      maxWidth: width ? `${width}px` : undefined,
      textOverflow: "ellipsis",
      overflow: "hidden"
    }}
    role="columnheader"
    aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    minWidth?: number;
    width?: number;
    isEditing?: boolean;
    isNumeric?: boolean;
  }
>(({ className, minWidth, width, isEditing, isNumeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0",
      "whitespace-nowrap border-r last:border-r-0 transition-colors", 
      isEditing ? "bg-blue-600 dark:bg-blue-700 text-white shadow-inner" : "", 
      isNumeric ? "text-right font-mono text-sm tabular-nums" : "",
      className
    )}
    style={{
      minWidth: minWidth ? `${minWidth}px` : undefined,
      width: width ? `${width}px` : undefined,
      maxWidth: width ? `${width}px` : undefined,
      textOverflow: "ellipsis",
      overflow: "hidden"
    }}
    role="gridcell"
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
