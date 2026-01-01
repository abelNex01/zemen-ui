import { useGlobalStats } from "@/hooks/use-stats";
import { ArrowUpRight, Image as ImageIcon, Save } from "lucide-react";
import { motion } from "framer-motion";
import { itemVariants } from "@/lib/animations";

export function StatsCard() {
  const { data: stats, isLoading } = useGlobalStats();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (isLoading || !stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mt-12 mb-8">
      <motion.div 
        variants={itemVariants}
        className="bg-card border dark:border-accent/60 border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3 mb-2 text-muted-foreground">
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Images Optimized</span>
        </div>
        <div className="text-3xl font-display font-bold text-foreground">
          {stats.totalImages.toLocaleString()}
        </div>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="bg-card border dark:border-accent/60 border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3 mb-2 text-muted-foreground">
          <Save className="w-5 h-5" />
          <span className="text-sm font-medium">Bandwidth Saved</span>
        </div>
        <div className="text-3xl font-display font-bold text-foreground">
          {formatBytes(stats.totalSavedBytes)}
        </div>
      </motion.div>
    </div>
  );
}
