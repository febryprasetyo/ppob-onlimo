"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, History, Users, LogOut, Zap, Tag, CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavSidebarProps {
  username: string;
  role: string;
  onClose?: () => void;
}

export function NavSidebar({ username, role, onClose }: NavSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Manajemen Aset", href: "/assets", icon: Users },
    { name: "Validasi ID PLN", href: "/check-pln", icon: Zap },
    { name: "Daftar Harga", href: "/price-list", icon: Tag },
    { name: "Keuangan", href: "/finance", icon: CreditCard },
    { name: "History", href: "/history", icon: History },
  ];

  if (role === "admin") {
    menuItems.push({ name: "User Management", href: "/users", icon: Users });
  }

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 text-white no-print shadow-2xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-8 relative">
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-slate-400 hover:text-white md:hidden"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
            ONLIMO
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black pl-1">
          PPOB & Operations
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
              )} />
              <span className="font-bold text-sm tracking-wide">{item.name}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-6 mt-auto bg-slate-950/50 border-t border-slate-800/50">
        <div className="flex items-center gap-4 px-2 py-4 mb-2">
          <div className="h-12 w-12 rounded-2xl premium-gradient flex items-center justify-center text-lg font-black shadow-xl shadow-blue-900/40">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white truncate uppercase tracking-tight">{username}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{role}</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 gap-4 h-12 rounded-2xl px-5 transition-all group"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">Logout System</span>
        </Button>
      </div>
    </div>
  );
}
