import React, { useRef, useState, useEffect } from "react";
import { useDrag } from "@use-gesture/react";
import { cn } from "@/lib/utils";

interface ScrubbableInputProps {
  value: number;
  onChange: (value: number, commit?: boolean) => void;
  label?: React.ReactNode;
  step?: number;
  min?: number;
  max?: number;
  className?: string; // Container class
  inputClassName?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function ScrubbableInput({
  value,
  onChange,
  label,
  step = 1,
  min = -Infinity,
  max = Infinity,
  className,
  inputClassName,
  prefix,
  suffix
}: ScrubbableInputProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create a ref for the value to access it inside the gesture handler without dependencies issues
  const valueRef = useRef(value);
  valueRef.current = value;

  const bind = useDrag(({ movement: [mx], first, last, memo = valueRef.current }) => {
    if (first) {
        setIsScrubbing(true);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        return valueRef.current;
    }
    
    // Calculate new value based on drag distance (mx) and step
    const delta = Math.round(mx / 2) * step; // Slower scrub speed (pixels / 2)
    let newValue = memo + delta;
    
    // Clamp
    newValue = Math.min(Math.max(newValue, min), max);
    
    if (newValue !== valueRef.current) {
        onChange(newValue, false); // Transient
    }
    
    if (last) {
        setIsScrubbing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onChange(newValue, true); // Commit
    }
    
    return memo;
  }, {
      axis: 'x',
      filterTaps: true,
  });

  return (
    <div className={cn("flex items-center group relative", className)}>
      {label && (
        <div 
            {...bind()} 
            className="absolute left-0 z-10 flex items-center justify-center p-2 text-zinc-400 cursor-ew-resize hover:text-white select-none touch-none"
        >
          {label}
        </div>
      )}
      
      <div className="relative w-full">
          {prefix && <div className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">{prefix}</div>}
          <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                if(!isNaN(val)) onChange(val, false);
            }}
            className={cn(
              "w-full bg-[#2a2a2a] text-zinc-300 text-xs h-7 rounded px-2 border border-transparent hover:border-zinc-700 focus:border-blue-500 focus:outline-none transition-colors",
              label ? "pl-7" : "",
              prefix && !label ? "pl-6" : "", 
              suffix ? "pr-6" : "",
              inputClassName
            )}
            onKeyDown={(e) => {
                if(e.key === "Enter") {
                    inputRef.current?.blur();
                    onChange(value, true); // Commit on Enter
                }
            }}
            onBlur={() => onChange(value, true)} // Commit on blur
          />
          {suffix && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none text-xs">{suffix}</div>}
      </div>
    </div>
  );
}
