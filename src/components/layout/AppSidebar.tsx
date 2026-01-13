import { useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  Receipt,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Pharmacy", url: "/pharmacy", icon: Pill },
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Nature Vital" className="w-12 h-12 object-contain" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">Nature Vital</span>
              <span className="text-xs text-muted-foreground">Wellness Center</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <RouterNavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "animate-pulse")} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.title}</span>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-3 border-t border-border">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50",
          collapsed && "justify-center"
        )}>
          <Activity className="h-4 w-4 text-primary" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">System Online</span>
              <span className="text-xs text-muted-foreground">All branches synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border flex items-center justify-center hover:bg-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
