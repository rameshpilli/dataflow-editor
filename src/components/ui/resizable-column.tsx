
import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ResizableColumnProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  onResize: (width: number) => void;
  className?: string;
}

const ResizableColumn: React.FC<ResizableColumnProps> = ({ 
  children, 
  width, 
  minWidth = 100, 
  onResize, 
  className 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const initialX = useRef<number>(0);
  const initialWidth = useRef<number>(0);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    initialX.current = e.clientX;
    initialWidth.current = width;
    setIsResizing(true);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const delta = e.clientX - initialX.current;
      const newWidth = Math.max(initialWidth.current + delta, minWidth);
      onResize(newWidth);
    }
  }, [isResizing, minWidth, onResize]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  }, [handleMouseMove]);

  // Instead of wrapping the children, extend them with the resizer
  // This avoids invalid nesting in table structures
  return (
    <>
      {children}
      <div 
        className={cn(
          "absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-gray-300 dark:hover:bg-gray-600 z-10",
          isResizing ? "bg-primary" : ""
        )}
        onMouseDown={startResizing}
        onClick={(e) => e.stopPropagation()}
        style={{
          height: "100%",
          position: "absolute",
          top: 0,
          right: 0,
          width: "4px",
          cursor: "col-resize"
        }}
      />
    </>
  );
};

export { ResizableColumn };
