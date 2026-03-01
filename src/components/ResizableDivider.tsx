import { useEffect, useState } from 'react';

interface ResizableDividerProps {
  width: number;
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export default function ResizableDivider({
  width,
  onResize,
  minWidth = 250,
  maxWidth = 600,
  className = '',
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(width);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, minWidth), maxWidth);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startWidth, minWidth, maxWidth, onResize]);

  return (
    <div
      className={`w-1 hover:w-2 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/50 transition-all z-50 h-full flex flex-col justify-center items-center group select-none touch-none ${className}`}
      onMouseDown={handleMouseDown}
    >
        {/* Visual handle indicator - only visible on hover/drag */}
        <div className={`h-8 w-0.5 bg-slate-300 dark:bg-slate-600 rounded group-hover:bg-blue-400 dark:group-hover:bg-blue-400 transition-colors ${isDragging ? 'bg-blue-400' : ''}`} />
    </div>
  );
}
