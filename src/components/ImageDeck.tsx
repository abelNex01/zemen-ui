import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import art1 from "../assets/art/art1.png";
import art2 from "../assets/art/art2.png";
import art3 from "../assets/art/art3.png";
import art4 from "../assets/art/art4.png";
import art5 from "../assets/art/art5.png";
import art6 from "../assets/art/art6.png";
import art7 from "../assets/art/art7.png";

import { useIsMobile } from "@/hooks/use-mobile";

const cardData = [
  { src: art1, username: "@bre", color: "#FF4D4D", testimonial: "Blown away by the speed!" },
  { src: art2, username: "@abel", color: "#FFD700", testimonial: "No cloud, No worry." },
  { src: art3, username: "@mike", color: "#4D94FF", testimonial: "Cleanest optimization yet." },
  { src: art4, username: "@anna", color: "#32CD32", testimonial: "Saved me gigabytes of data!" },
  { src: art5, username: "@emma", color: "#FF69B4", testimonial: "Simple but powerful." },
  { src: art6, username: "@kira", color: "#8A2BE2", testimonial: "Professional grade tools." },
  { src: art7, username: "@sami", color: "#FF8C00", testimonial: "The UI is just stunning." },
];

const Badge = ({ text, color, className }: { text: string; color: string; className?: string }) => (
  <div
    className={`absolute z-20 px-2 py-1 rounded-lg text-white text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-md whitespace-nowrap ${className}`}
    style={{ backgroundColor: color }}
  >
    <span>{text}</span>
    <div 
      className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px]"
      style={{ borderTopColor: color }}
    />
  </div>
);

export function ImageDeck() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isMobile = useIsMobile();


  useEffect(() => {
    setHoveredIndex(isMobile ? 2 : 4);
  }, [isMobile]);


  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative w-full max-w-6xl h-[220px] md:h-[350px] mx-auto flex flex-col items-center justify-center mt-0 mb-2 px-4 overflow-visible isolate"
      onMouseLeave={() => setHoveredIndex(isMobile ? 2 : 4)}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {cardData.map((card, index) => {
          const offset = index - Math.floor(cardData.length / 2);
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={index}
              className="absolute"
              onMouseEnter={() => !isMobile && setHoveredIndex(index)}
              onClick={() => setHoveredIndex(index)}
            >
              <motion.div
                initial={{ 
                  x: 0, 
                  rotate: 0, 
                  opacity: 0,
                  scale: 0.8,
                  zIndex: 10
                }}
                animate={{ 
                  x: isMobile ? offset * 45 : offset * 85,
                  y: isHovered 
                    ? (Math.abs(offset) * (isMobile ? 8 : 12)) - 40
                    : Math.abs(offset) * (isMobile ? 8 : 12),
                  rotate: offset * (isMobile ? 3 : 6),
                  opacity: 1,
                  scale: isHovered ? 1.05 : (isMobile ? 0.85 : 0.9), 
                  zIndex: isHovered ? 100 : 10 - Math.abs(offset)
                }}
                transition={{ 
                  delay: isReady ? 0 : index * 0.08, 
                  type: "spring", 
                  stiffness: isReady ? 300 : 120,
                  damping: isReady ? 25 : 18,
                  mass: isReady ? 0.5 : 1
                }}
                className="relative cursor-pointer"
              >

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    >
                      <Badge 
                        text={card.username} 
                        color={card.color} 
                        className="top-[-20px] left-1/2 -translate-x-1/2"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-[110px] md:w-[160px] aspect-[3/4] rounded-xl md:rounded-[1.5rem] overflow-hidden shadow-xl border-2 border-white/60 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800">
                  <img 
                    src={card.src} 
                    alt={`Art ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>


                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute top-[105%] left-1/2 -translate-x-1/2 w-[180px] md:w-[220px] z-20 pointer-events-none"
                    >
                      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
                        <p className="text-[11px] md:text-xs font-medium text-zinc-900 dark:text-zinc-100 italic">
                          "{card.testimonial}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
