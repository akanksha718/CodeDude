"use client";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';
import { BarChart3, LayoutDashboard, Menu, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react'


const NAV_ITEMS = [
  { label: "DashBoard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },

] as const;


const AppLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isEditorPage = pathname.startsWith("/project/");
  if (isEditorPage) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        {/* <div>RatelimitedBanner</div> */}
        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen  bg-background text-foreground">
      {/* <div>RatelimitedBanner</div> */}
      {
        sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
        )
      }
      <aside className={cn("fixed h-screen inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/favicon.ico" alt="Logo" className='size-7' />
            CodeDude
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {
            NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              )
            })
          }
        </nav>
        <div>Credits</div>
        <Separator />
        <div className="flex items-center gap-3 px-5 py-4">
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
          <span className="text-sm text-muted-foreground">Account</span>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b borber-border px-6 md:hidden">
          <Button
            variant="ghost"
            size="icon-xs"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <img src="/favicon.ico" alt="Logo" className='size-5' />
            CodeDude
          </span>
        </header>
        <main className="flex-1 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
