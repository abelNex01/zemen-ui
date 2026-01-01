import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Wrench,
  History,
  Settings,
  Crown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/pro" },
  {
    id: "batch",
    label: "Batch Optimization",
    icon: Layers,
    path: "/pro/batch",
  },
  {
    id: "upscale",
    label: "Image Upscale",
    icon: ArrowUpRight,
    path: "/pro/upscale",
  },
  {
    id: "convert",
    label: "Format Converter",
    icon: RefreshCw,
    path: "/pro/convert",
  },
  { id: "tools", label: "Advanced Tools", icon: Wrench, path: "/pro/tools" },
  { id: "history", label: "History", icon: History, path: "/pro/history" },
  { id: "settings", label: "Settings", icon: Settings, path: "/pro/settings" },
];

interface ProSidebarProps {
  daysRemaining?: number;
}

export default function ProSidebar({ daysRemaining = 30 }: ProSidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 text-white flex flex-col z-40">
      <div className="p-6 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <img src={logo} alt="ZemenPix" className="h-7 invert" />
          <span className="text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" />
            PRO
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location === item.path ||
            (item.path !== "/pro" && location.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Shield className="w-4 h-4 text-green-500" />
            Pro Active
          </div>
          <p className="text-xs text-zinc-500">
            {daysRemaining} days remaining
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Your images never leave your device
        </p>
      </div>
    </aside>
  );
}
