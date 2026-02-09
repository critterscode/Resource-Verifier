import { Link, useLocation } from "wouter";
import { LayoutDashboard, Database, CheckSquare, ListMusic, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Resources", href: "/resources", icon: Database },
  { label: "Review Mode", href: "/review", icon: CheckSquare },
  { label: "My Lists", href: "/lists", icon: ListMusic },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="no-print hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 font-display">
            ResourceHub
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex justify-around items-center p-2">
        {NAV_ITEMS.map((item) => {
           const isActive = location === item.href;
           const Icon = item.icon;
           
           return (
             <Link key={item.href} href={item.href}>
               <div className={cn(
                 "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                 isActive ? "text-primary" : "text-muted-foreground"
               )}>
                 <Icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                 <span className="text-[10px] font-medium">{item.label}</span>
               </div>
             </Link>
           );
        })}
      </div>
    </nav>
  );
}
