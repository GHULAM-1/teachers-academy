"use client";

import { useState } from "react";
import ChatHistorySidebar from "@/components/chat-history-sidebar";
import Header from "@/components/header";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="bg-[#E4EDFF] flex justify-center">
      <div className="w-full max-w-[1440px]">
        <div className="flex h-screen gap-4 p-4">
          {/* Sidebar with Chat History */}
          <ChatHistorySidebar isCollapsed={isCollapsed} />

          {/* Main Content */}
          <div className="flex-1 flex rounded-[16px] px-4 bg-white border-[#02133B]/20 border-[1px] flex-col overflow-hidden">
            {/* Header */}
            <Header isCollapsed={isCollapsed} onToggle={toggleSidebar} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto hide-scrollbar bg-background">
              <div className="container mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
