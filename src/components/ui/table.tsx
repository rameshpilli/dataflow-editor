
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { 
    fullWidth?: boolean;
    zoomLevel?: number;
    columnResizing?: boolean;
    alternateRowColors?: boolean;
  }
>(({ className, fullWidth = false, zoomLevel = 100, columnResizing = false, alternateRowColors = false, ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-auto", 
    fullWidth ? "max-w-none" : "",
  )}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm border-collapse",
        columnResizing ? "table-fixed" : "",
        alternateRowColors ? "even:[&_tr:nth-child(even)]:bg-gray-50 dark:even:[&_tr:nth-child(even)]:bg-gray-800/30" : "",
        className
      )}
      style={{ 
        fontSize: `${zoomLevel / 100}rem`,
        tableLayout: columnResizing ? "fixed" : "auto"
      }}
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
    className={cn("[&_tr]:border-b sticky top-0 bg-white dark:bg-gray-900 z-10", className)} 
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
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 sticky bottom-0 bg-white dark:bg-gray-900 z-10",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { 
    isHighlighted?: boolean;
    isAlternate?: boolean;
  }
>(({ className, isHighlighted, isAlternate, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
      isHighlighted ? "bg-blue-50 dark:bg-blue-900/20" : "",
      isAlternate ? "bg-gray-50 dark:bg-gray-800/20" : "",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    minWidth?: number;
    width?: number;
  }
>(({ className, minWidth, width, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0",
      "whitespace-nowrap bg-gray-100 dark:bg-gray-800 border-r last:border-r-0", // Light gray background with right borders
      className
    )}
    style={{
      minWidth: minWidth ? `${minWidth}px` : undefined,
      width: width ? `${width}px` : undefined,
      maxWidth: width ? `${width}px` : undefined,
      // Explicitly enforce horizontal text orientation
      writingMode: "horizontal-tb",
      textOrientation: "mixed",
      textOverflow: "ellipsis",
      overflow: "hidden"
    }}
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
  }
>(({ className, minWidth, width, isEditing, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0",
      "whitespace-nowrap border-r last:border-r-0", // Add right borders between cells
      isEditing ? "bg-blue-700 dark:bg-blue-800 text-white" : "", // Darker blue for editing
      className
    )}
    style={{
      minWidth: minWidth ? `${minWidth}px` : undefined,
      width: width ? `${width}px` : undefined,
      maxWidth: width ? `${width}px` : undefined,
      textOverflow: "ellipsis",
      overflow: "hidden"
    }}
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
