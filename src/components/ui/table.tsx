
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { 
    fullWidth?: boolean;
    zoomLevel?: number;
    columnResizing?: boolean;
  }
>(({ className, fullWidth = false, zoomLevel = 100, columnResizing = false, ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-auto", 
    fullWidth ? "max-w-none" : "",
  )}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm",
        columnResizing ? "table-fixed" : "",
        className
      )}
      style={{ 
        fontSize: `${zoomLevel / 100}rem`,
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: "top left",
        width: zoomLevel > 100 ? `${100 * 100 / zoomLevel}%` : '100%'
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
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
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
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { 
    isHighlighted?: boolean 
  }
>(({ className, isHighlighted, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      isHighlighted ? "bg-green-50 dark:bg-green-950 animate-pulse" : "",
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
      "overflow-hidden text-ellipsis", // Allow horizontal scrolling without text wrapping
      className
    )}
    style={{
      minWidth: minWidth ? `${minWidth}px` : undefined,
      width: width ? `${width}px` : undefined,
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
  }
>(({ className, minWidth, width, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      "overflow-hidden text-ellipsis", // Allow horizontal scrolling without text wrapping
      className
    )}
    style={{
      minWidth: minWidth ? `${minWidth}px` : undefined,
      width: width ? `${width}px` : undefined,
      maxWidth: width ? `${width}px` : undefined,
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
