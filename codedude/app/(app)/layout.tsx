"use client";
import { BarChart3, LayoutDashboard, Settings } from 'lucide-react';
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
    return (<div className="flex h-screen flex-col bg-background text-foreground">
      <div>RatelimitedBanner</div>
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
    );
  }
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div>RatelimitedBanner</div>
      
    </div>
  )
}

export default AppLayout;
