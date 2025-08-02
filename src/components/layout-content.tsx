"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ChatHistorySidebar from "@/components/chat-history-sidebar";
import Header from "@/components/header";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import Loading from "@/components/ui/loading";
import { useProfileStatus } from "@/hooks/use-profile-status";

interface LayoutContentProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function LayoutContent({ children, isLoading = false }: LayoutContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const pathname = usePathname();
  const { hasProfile } = useProfileStatus();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    // Hide sidebar for user-profile route only if no profile data
    if (pathname === '/user-profile') {
      // Check if profile data exists using hook
      // hasProfile === false means no profile data
      // hasProfile === null means still loading
      // hasProfile === true means profile exists
      console.log('Layout: pathname is /user-profile, hasProfile:', hasProfile);
      setHideSidebar(hasProfile === false);
    } else {
      console.log('Layout: pathname is not /user-profile, hiding sidebar:', false);
      setHideSidebar(false);
    }
  }, [pathname, hasProfile]);

  return (
    <div className=" min-h-screen flex justify-center">
      <div className="w-full max-w-[1440px] flex flex-col h-screen">
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0">
            <Navbar />
          </div>
          <div className="flex flex-1 min-h-0">
            {(() => { console.log('Rendering sidebar, hideSidebar:', hideSidebar); return null; })()}
            {!hideSidebar && (
              <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
            )}

            {/* Main Content */}
            <div className={`flex-1 flex rounded-tl-[16px] mt-[16px] bg-[#F5F9FC] shadow-sm px-4 border-[#02133B]/10 border-l-[1px] border-t-[1px] flex-col overflow-hidden ${
              hideSidebar ? 'rounded-tl-[0px] border-l-[0px]' : ''
            }`}>
              {/* Header */}

              {/* Page Content */}
              <main className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
                <div className="container mx-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : (
                    children
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
