"use client";

import { useState, useEffect } from "react";
import { NavSidebar } from "@/components/nav-sidebar";
import { Menu, Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: { username: string; role: string };
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-slate-200">
        <NavSidebar username={session.username} role={session.role} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 w-80 bg-slate-900 z-50 lg:hidden transition-transform duration-300 ease-in-out shadow-2xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavSidebar 
          username={session.username} 
          role={session.role} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header 
          className={cn(
            "sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-4 transition-all duration-300 no-print",
            isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
          )}
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-2xl w-80 group transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white border border-transparent focus-within:border-blue-100">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Cari transaksi atau aset..." 
                className="bg-transparent border-none text-sm focus:outline-none w-full text-slate-600 placeholder:text-slate-400 font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </Button>
            
            <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />
            
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[11px] font-black text-slate-900 leading-none uppercase tracking-tighter truncate max-w-[120px]">{session.username}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{session.role}</span>
              </div>
              <div className="h-10 w-10 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pt-2 md:pt-4">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
