
import React from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronFirst, ChevronLast } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useDataEditor } from '../DataEditorContext';

const PaginationControls: React.FC = () => {
  const { 
    dataPreview,
    page,
    pageSize,
    isFullscreen,
    getTotalPages,
    handlePageChange,
    handlePageSizeChange
  } = useDataEditor();

  const handlePageSizeChangeWithToast = (newSize: number) => {
    handlePageSizeChange(newSize);
    
    toast({
      title: "Page size updated",
      description: `Showing ${newSize} items per page`,
    });
  };

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => handlePageSizeChangeWithToast(Number(value))}
        >
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent 
            className={cn(
              "z-[99999]",
              isFullscreen && "fixed"
            )}
            align="start"
            side="top"
          >
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {dataPreview && getTotalPages() > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(1)}
                disabled={page <= 1}
                className={cn("h-8 w-8", page <= 1 && "opacity-50 cursor-not-allowed")}
                aria-label="Go to first page"
              >
                <ChevronFirst className="h-4 w-4" />
              </Button>
            </PaginationItem>
            
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                className={cn("h-8", page <= 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            
            {/* First page */}
            {page > 2 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
              </PaginationItem>
            )}
            
            {/* Ellipsis if needed */}
            {page > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            {/* Previous page if not first */}
            {page > 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(page - 1)}>
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Current page */}
            <PaginationItem>
              <PaginationLink isActive>{page}</PaginationLink>
            </PaginationItem>
            
            {/* Next page if not last */}
            {page < getTotalPages() && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(page + 1)}>
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Ellipsis if needed */}
            {page < getTotalPages() - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            {/* Last page if not current or adjacent */}
            {page < getTotalPages() - 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(getTotalPages())}>
                  {getTotalPages()}
                </PaginationLink>
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(getTotalPages(), page + 1))}
                className={cn("h-8", page >= getTotalPages() && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(getTotalPages())}
                disabled={page >= getTotalPages()}
                className={cn("h-8 w-8", page >= getTotalPages() && "opacity-50 cursor-not-allowed")}
                aria-label="Go to last page"
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <div className="flex items-center">
        <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 py-1.5 px-3 shadow-sm border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-200 font-medium">
          {dataPreview ? (
            <>
              {((page - 1) * pageSize) + 1}-
              {Math.min(page * pageSize, dataPreview.totalRows)} of {dataPreview.totalRows.toLocaleString()} rows
            </>
          ) : (
            'No data'
          )}
        </Badge>
      </div>
    </div>
  );
};

export default PaginationControls;
