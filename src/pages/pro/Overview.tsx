import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image, ArrowDown, Zap, Clock, TrendingUp } from "lucide-react";
import { getHistoryStats, getHistory } from "@/lib/db";
import { containerVariants, itemVariants } from "@/lib/animations";

interface Stats {
  totalProcessed: number;
  totalSaved: number;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>({
    totalProcessed: 0,
    totalSaved: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      const statsData = await getHistoryStats();
      setStats(statsData);
      const history = await getHistory(5);
      setRecentActivity(history);
    }
    loadStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const quickActions = [
    {
      label: "Batch Optimize",
      icon: Zap,
      href: "/pro/batch",
      color: "bg-blue-500",
    },
    {
      label: "Upscale Image",
      icon: TrendingUp,
      href: "/pro/upscale",
      color: "bg-purple-500",
    },
    {
      label: "Convert Format",
      icon: Image,
      href: "/pro/convert",
      color: "bg-green-500",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold mb-2">Welcome to ZemenPix Pro</h1>
        <p className="text-muted-foreground">
          Advanced image optimization tools at your fingertips
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Image className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Images Processed
            </span>
          </div>
          <p className="text-4xl font-bold">{stats.totalProcessed}</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <ArrowDown className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Space Saved
            </span>
          </div>
          <p className="text-4xl font-bold">{formatBytes(stats.totalSaved)}</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </span>
          </div>
          <p className="text-4xl font-bold">{recentActivity.length}</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold">{action.label}</h3>
              </a>
            );
          })}
        </div>
      </motion.div>

      {recentActivity.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Image className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-500">
                    -
                    {Math.round(
                      (1 - item.compressedSize / item.originalSize) * 100
                    )}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(item.originalSize - item.compressedSize)} saved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
