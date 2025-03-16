
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

interface PaginationProps extends React.ComponentProps<"nav"> {
  totalItems?: number;
  pageSize?: number;
  currentPage?: number;
  siblingCount?: number;
  showRowsInfo?: boolean;
}

const Pagination = ({ 
  className, 
  totalItems, 
  pageSize = 10, 
  currentPage = 1, 
  siblingCount = 1,
  showRowsInfo = true,
  ...props 
}: PaginationProps) => {
  // Calculate start and end item numbers
  const startItem = totalItems ? Math.min(((currentPage - 1) * pageSize) + 1, totalItems) : undefined;
  const endItem = totalItems ? Math.min(startItem + pageSize - 1, totalItems) : undefined;
  
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-between items-center flex-wrap gap-2", className)}
      {...props}
    >
      {showRowsInfo && startItem !== undefined && endItem !== undefined && totalItems !== undefined && (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Showing <span className="font-medium text-foreground">{startItem}-{endItem}</span> of <span className="font-medium text-foreground">{totalItems}</span> rows
        </div>
      )}
      <div className="flex items-center ml-auto">
        {props.children}
      </div>
    </nav>
  )
}
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      isActive && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 text-blue-600 dark:text-blue-400",
      "h-8 w-8 rounded-md p-0",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("h-8 px-2 gap-1 w-auto mr-1", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only md:not-sr-only md:inline-flex">Prev</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("h-8 px-2 gap-1 w-auto ml-1", className)}
    {...props}
  >
    <span className="sr-only md:not-sr-only md:inline-flex">Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-8 w-8 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
