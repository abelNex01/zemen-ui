import { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { itemVariants } from '@/lib/animations';

interface ComparisonSliderProps {
  originalUrl: string;
  optimizedUrl: string;
  originalSize: number;
  optimizedSize: number;
}

export function ComparisonSlider({ 
  originalUrl, 
  optimizedUrl,
  originalSize,
  optimizedSize
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleMove]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto my-8"
      variants={itemVariants}
    >
      <div className="flex justify-between items-end mb-4 font-display">
        <div className="text-left">
          <span className="block text-xs text-muted-foreground uppercase tracking-wider">Original</span>
          <span className="text-lg font-bold">{formatSize(originalSize)}</span>
        </div>
        <div className="text-right text-primary">
          <span className="block text-xs text-muted-foreground uppercase tracking-wider">Optimized</span>
          <span className="text-lg font-bold">{formatSize(optimizedSize)}</span>
          <span className="ml-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
            -{Math.round(((originalSize - optimizedSize) / originalSize) * 100)}%
          </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-muted/30 rounded-2xl overflow-hidden cursor-ew-resize select-none border dark:border-accent/60 border-border shadow-sm"
        onClick={(e) => handleMove(e.clientX)}
      >
        {/* Optimized Image (Background) */}
        <img 
          src={optimizedUrl} 
          alt="Optimized" 
          className="absolute top-0 left-0 w-full h-full object-contain"
        />

        {/* Original Image (Foreground - Clipped) */}
        <div 
          className="absolute top-0 left-0 h-full w-full overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={originalUrl} 
            alt="Original" 
            className="absolute top-0 left-0 h-full w-full max-w-none object-contain"
            // Important: object-contain must match parent aspect ratio handling
             style={{ width: containerRef.current?.offsetWidth }}
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-black">
            <MoveHorizontal className="w-4 h-4" />
          </div>
        </div>

        {/* Labels overlay */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          Optimized
        </div>
      </div>
    </motion.div>
  );
}
