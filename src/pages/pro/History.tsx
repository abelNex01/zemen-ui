import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Image, Trash2, ArrowDown, TrendingUp, RefreshCw } from 'lucide-react';
import { getHistory, clearHistory } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/lib/animations';

interface HistoryItem {
  id?: number;
  filename: string;
  originalSize: number;
  compressedSize: number;
  format: string;
  action: 'compress' | 'upscale' | 'convert';
  timestamp: number;
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getHistory(100);
    setHistory(data);
    setLoading(false);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'compress': return ArrowDown;
      case 'upscale': return TrendingUp;
      case 'convert': return RefreshCw;
      default: return Image;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'compress': return 'text-green-500 bg-green-500/10';
      case 'upscale': return 'text-purple-500 bg-purple-500/10';
      case 'convert': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-zinc-500 bg-zinc-500/10';
    }
  };

  const totalSaved = history.reduce((acc, item) => acc + (item.originalSize - item.compressedSize), 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Processing History</h1>
          <p className="text-muted-foreground">Track all your image processing activities</p>
        </div>
        {history.length > 0 && (
          <Button 
            onClick={handleClearHistory}
            variant="outline"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear History
          </Button>
        )}
      </motion.div>

      {history.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Images</p>
            <p className="text-2xl font-bold">{history.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-green-500">{formatBytes(totalSaved)}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Average Savings</p>
            <p className="text-2xl font-bold">
              {history.length > 0 
                ? Math.round((totalSaved / history.reduce((acc, i) => acc + i.originalSize, 0)) * 100) 
                : 0}%
            </p>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="text-center py-12">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-border">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-bold mb-2">No History Yet</h3>
            <p className="text-muted-foreground">
              Start processing images to see your history here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item, i) => {
              const Icon = getActionIcon(item.action);
              const color = getActionColor(item.action);
              const savings = item.originalSize - item.compressedSize;
              const savingsPercent = Math.round((1 - item.compressedSize / item.originalSize) * 100);

              return (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-border hover:border-primary/20 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()} • {item.action}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatBytes(item.originalSize)} → {formatBytes(item.compressedSize)}
                    </p>
                    <p className={`text-xs ${savings > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {savings > 0 ? `-${formatBytes(savings)} (${savingsPercent}%)` : 'No change'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
