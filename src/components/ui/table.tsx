
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
        "w-full caption-bottom text-sm",
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
      "border-b transition-colors",
      isHighlighted ? "bg-green-100 dark:bg-green-900" : "",
      isAlternate ? "bg-blue-50 dark:bg-blue-950/20" : "",
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
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      "whitespace-nowrap bg-gray-100 dark:bg-gray-800", // Add light gray background to headers
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
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      "whitespace-nowrap border-r last:border-r-0", // Add right borders between cells
      isEditing ? "bg-blue-600 dark:bg-blue-700 text-white" : "",
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
