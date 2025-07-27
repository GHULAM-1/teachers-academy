"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  User,
  BookOpen,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  Award,
  Rocket,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "./auth/auth-provider";
import { Chat } from "@/lib/supabase";
import { loadUserChats } from "@/lib/chat-store";
import { CareerChat, loadUserCareerChats, loadCareerChatMessages, determineResumeStep } from "@/lib/career-chat-store";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    id: "mentor",
    label: "AI Mentor",
    href: "/mentor",
    icon: MessageSquare,
  },
  {
    id: "course",
    label: "Passive Income",
    href: "/passive-income",
    icon: BookOpen,
  },
  {
    id: "growth",
    label: "Career Change",
    href: "/career-change",
    icon: Award,
  },
  {
    id: "independent",
    label: "Teaching Business",
    href: "/teaching",
    icon: Rocket,
  },
  {
    id: "profile",
    label: "User Profile",
    href: "/user-profile",
    icon: User,
  },
];

interface SidebarContentProps {
  isCollapsed?: boolean;
  className?: string;
}

function SidebarContent({
  isCollapsed = false,
  className,
}: SidebarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [careerChats, setCareerChats] = useState<CareerChat[]>([]);
  const [careerChatSteps, setCareerChatSteps] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<
    "mentor" | "career" | null
  >("mentor");

  // Auto-expand relevant section based on current route
  useEffect(() => {
    if (pathname.startsWith("/mentor")) {
      setExpandedSection("mentor");
    } else if (pathname.startsWith("/career-change")) {
      setExpandedSection("career");
    }
  }, [pathname]);
  // Load chat history
  useEffect(() => {
    async function fetchChats() {
      try {
        const userChats = await loadUserChats();
        const userCareerChats = await loadUserCareerChats();
        setChats(userChats);
        setCareerChats(userCareerChats);
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChats();
  }, []);

  // Refresh chats when pathname changes (new chat created)
  useEffect(() => {
    if (pathname.startsWith("/mentor/chat/")) {
      async function refreshChats() {
        try {
          const userChats = await loadUserChats();
          setChats(userChats);
        } catch (error) {
          console.error("Error refreshing chats:", error);
        }
      }
      refreshChats();
    }
    if (pathname.startsWith("/career-change/chat/")) {
      async function refreshCareerChats() {
        try {
          const userCareerChats = await loadUserCareerChats();
          setCareerChats(userCareerChats);
          
          // Determine the current step for each career chat
          const stepsMap: Record<string, string> = {};
          for (const chat of userCareerChats) {
            try {
              const messages = await loadCareerChatMessages(chat.id);
              const step = determineResumeStep(messages);
              stepsMap[chat.id] = step;
            } catch (error) {
              console.error(`Error loading steps for chat ${chat.id}:`, error);
              stepsMap[chat.id] = 'discover'; // Fallback
            }
          }
          setCareerChatSteps(stepsMap);
        } catch (error) {
          console.error("Error refreshing career chats:", error);
        }
      }
      refreshCareerChats();
    }
  }, [pathname]);

  // Auto-refresh chats every 5 seconds when on mentor pages to catch new chats
  useEffect(() => {
    if (!pathname.startsWith("/mentor")) return;

    const interval = setInterval(async () => {
      // Don't auto-refresh if already refreshing from an event
      if (isRefreshing) return;

      try {
        const userChats = await loadUserChats();
        // Only update if the chats have actually changed (check both length and latest timestamps)
        const chatsChanged =
          userChats.length !== chats.length ||
          (userChats.length > 0 &&
            chats.length > 0 &&
            userChats[0]?.updated_at !== chats[0]?.updated_at);

        if (chatsChanged) {
          setChats(userChats);
        }
      } catch (error) {
        console.error("Error auto-refreshing chats:", error);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [pathname, chats, isRefreshing]);

  // Auto-refresh career chats every 5 seconds when on career pages to catch new chats
  useEffect(() => {
    if (!pathname.startsWith("/career-change")) return;

    const interval = setInterval(async () => {
      // Don't auto-refresh if already refreshing from an event
      if (isRefreshing) return;

      try {
        const userCareerChats = await loadUserCareerChats();
        // Only update if the chats have actually changed (check both length and latest timestamps)
        const careerChatsChanged =
          userCareerChats.length !== careerChats.length ||
          (userCareerChats.length > 0 &&
            careerChats.length > 0 &&
            userCareerChats[0]?.updated_at !== careerChats[0]?.updated_at);

        if (careerChatsChanged) {
          setCareerChats(userCareerChats);
        }
      } catch (error) {
        console.error("Error auto-refreshing career chats:", error);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [pathname, careerChats, isRefreshing]);

  // Listen for custom chat update events (triggered from API calls)
  useEffect(() => {
    const handleChatUpdate = async () => {
      // Refresh chats immediately when a chat update event is triggered
      setIsRefreshing(true);
      try {
        const userChats = await loadUserChats();
        setChats(userChats);
      } catch (error) {
        console.error("Error refreshing chats on event:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const handleCareerChatUpdate = async () => {
      // Refresh career chats immediately when a chat update event is triggered
      setIsRefreshing(true);
      try {
        const userCareerChats = await loadUserCareerChats();
        setCareerChats(userCareerChats);
        
        // Also refresh the steps for each chat
        const stepsMap: Record<string, string> = {};
        for (const chat of userCareerChats) {
          try {
            const messages = await loadCareerChatMessages(chat.id);
            const step = determineResumeStep(messages);
            stepsMap[chat.id] = step;
          } catch (error) {
            console.error(`Error loading steps for chat ${chat.id}:`, error);
            stepsMap[chat.id] = 'discover'; // Fallback
          }
        }
        setCareerChatSteps(stepsMap);
      } catch (error) {
        console.error("Error refreshing career chats on event:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Listen for custom events
    window.addEventListener("chatCreated", handleChatUpdate);
    window.addEventListener("chatUpdated", handleChatUpdate);
    window.addEventListener("careerChatCreated", handleCareerChatUpdate);
    window.addEventListener("careerChatUpdated", handleCareerChatUpdate);

    return () => {
      window.removeEventListener("chatCreated", handleChatUpdate);
      window.removeEventListener("chatUpdated", handleChatUpdate);
      window.removeEventListener("careerChatCreated", handleCareerChatUpdate);
      window.removeEventListener("careerChatUpdated", handleCareerChatUpdate);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format creation date for display
  const formatCreationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate chat title with incremental number
  const generateChatTitle = (index: number) => {
    return `AI MENTOR CHAT ${index + 1}`;
  };
  return (
    <div className={cn(" text-white h-full flex flex-col", className)}>
      {/* Logo */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className=" rounded-lg flex items-center justify-center flex-shrink-0">
            {isCollapsed ? (
              <Image
                src="/logo1.png"
                alt="Teachers Academy"
                width={32}
                height={32}
              />
            ) : (
              <Image
                src="/logo.png"
                alt="Teachers Academy"
                width={123}
                height={38}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 px-3">
        <div className="space-y-2 py-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 px-3",
                  isActive
                    ? "bg-[#02133B] text-white hover:bg-[#02133B]"
                    : "text-[#02133B] hover:bg-[#02133B] hover:text-white"
                )}
                asChild
              >
                <Link
                  href={item.href}
                  onClick={(e) => {
                    // Show save dialog if we're in a chat and clicking a different page
                    if (
                      (pathname.startsWith("/mentor/chat/") ||
                        pathname.startsWith("/career-change/chat/")) &&
                      item.href !== pathname
                    ) {
                      console.log("🔄 Clicked navigation:", item.href);
                      
                      // Check if we're in a new chat that needs saving
                      if ((window as any).isNewChat || (window as any).isNewCareerChat) {
                        console.log('💾 New chat detected, showing save dialog');
                        e.preventDefault();
                        window.dispatchEvent(
                          new CustomEvent("showSaveDialog", {
                            detail: { intendedUrl: item.href },
                          })
                        );
                      } else {
                        console.log('✅ No new chat, allowing navigation');
                      }
                    }
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <Separator className="mx-3 bg-[#02133B]/20 flex-shrink-0" />

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 space-y-2">
            {/* AI Mentor Chats Section */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 h-auto text-left"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "mentor" ? null : "mentor"
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#02133B]">
                    AI Mentor Chats
                  </h3>
                  {isRefreshing && (
                    <div className="w-3 h-3 border border-[#02133B] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {chats.length > 0 && (
                    <span className="bg-[#02133B] text-white text-xs font-medium px-2 py-1 rounded-full">
                      {chats.length}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      expandedSection === "mentor" ? "rotate-180" : ""
                    )}
                  />
                </div>
              </Button>

              {/* Collapsible Chat List */}
              {expandedSection === "mentor" && (
                <div className="mt-2">
                  <ScrollArea className="max-h-56">
                    <div className="space-y-1 pb-4">
                      {isLoading ? (
                        <div className="px-3 py-2 text-sm text-[#02133B]/60">
                          Loading chats...
                        </div>
                      ) : chats.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[#02133B]/60">
                          <div className="text-center">
                            <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <p>No chats yet</p>
                            <p className="text-xs mt-1">
                              Start a new conversation!
                            </p>
                          </div>
                        </div>
                      ) : (
                        chats.slice(0, 15).map((chat, index) => {
                          const isActiveChat =
                            pathname === `/mentor/chat/${chat.id}`;
                          const chatTitle = generateChatTitle(index);
                          const creationDate = formatCreationDate(
                            chat.created_at
                          );

                          return (
                            <Button
                              key={chat.id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-auto p-3 text-left group transition-all duration-200",
                                isActiveChat
                                  ? "bg-[#02133B] hover:text-white text-white hover:bg-[#02133B]"
                                  : "text-[#02133B] hover:bg-[#02133B]/10"
                              )}
                              asChild
                            >
                              <Link
                                href={`/mentor/chat/${chat.id}`}
                                onClick={(e) => {
                                  console.log("🔄 Clicked chat:", chat.id);
                                  // For chat links, allow navigation without dialog
                                  // Chat links are always to saved chats, so no need for save dialog
                                }}
                              >
                                <div className="flex flex-col gap-1.5 w-full">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                    <span className="text-sm font-medium truncate">
                                      {chatTitle}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs opacity-70">
                                      Created: {creationDate}
                                    </span>
                                    <span className="text-xs opacity-60">
                                      {formatDate(chat.updated_at)}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Career Growth Section */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 h-auto text-left"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "career" ? null : "career"
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#02133B]">
                    Career Growth
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {careerChats.length > 0 && (
                    <span className="bg-[#02133B] text-white text-xs font-medium px-2 py-1 rounded-full">
                      {careerChats.length}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      expandedSection === "career" ? "rotate-180" : ""
                    )}
                  />
                </div>
              </Button>

              {/* Collapsible Career Growth List */}
              {expandedSection === "career" && (
                <div className="mt-2">
                  <ScrollArea className="max-h-56">
                    <div className="space-y-1 pb-4">
                      {isLoading ? (
                        <div className="px-3 py-2 text-sm text-[#02133B]/60">
                          Loading career chats...
                        </div>
                      ) : careerChats.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[#02133B]/60">
                          <div className="text-center">
                            <Award className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <p>No career chats yet</p>
                            <p className="text-xs mt-1">
                              Start your career journey!
                            </p>
                          </div>
                        </div>
                      ) : (
                        careerChats.slice(0, 15).map((chat, index) => {
                          const chatStep = careerChatSteps[chat.id] || 'discover';
                          const isActiveChat =
                            pathname === `/career-change/chat/${chatStep}` && 
                            searchParams.get('chatId') === chat.id;
                          const chatTitle = `CAREER JOURNEY ${index + 1}`;
                          const creationDate = formatCreationDate(
                            chat.created_at
                          );

                          return (
                            <Button
                              key={chat.id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-auto p-3 text-left group transition-all duration-200",
                                isActiveChat
                                  ? "bg-[#02133B] hover:text-white text-white hover:bg-[#02133B]"
                                  : "text-[#02133B] hover:bg-[#02133B]/10"
                              )}
                              asChild
                            >
                              <Link
                                href={`/career-change/chat/${careerChatSteps[chat.id] || 'discover'}?chatId=${chat.id}`}
                                onClick={(e) => {
                                  console.log(
                                    "🔄 Clicked career chat:",
                                    chat.id,
                                    "Step:",
                                    careerChatSteps[chat.id] || 'discover'
                                  );
                                  // For career chat links, allow navigation without dialog
                                  // Career chat links are always to saved chats, so no need for save dialog
                                }}
                              >
                                <div className="flex flex-col gap-1.5 w-full">
                                  <div className="flex items-center gap-2">
                                    <Award className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                    <span className="text-sm font-medium truncate">
                                      {chatTitle}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs opacity-70">
                                      Created: {creationDate}
                                    </span>
                                    <span className="text-xs opacity-60">
                                      {formatDate(chat.updated_at)}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!isCollapsed && user && (
        <div className="flex  p-3 border-t border-[#02133B]/20">
          <div className="flex  items-center gap-1 p-2 rounded-lg bg-[#E4EDFF]/50">
            {/* <div className="w-8 h-8 rounded-full bg-[#02133B] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div> */}
            <div className="flex-1">
              <p className="text-xs font-medium text-[#02133B] truncate">
                {user.email}
              </p>
            </div>
            <div className="">
              <Button
                onClick={signOut}
                size="sm"
                variant="ghost"
                className="p-1 h-auto text-[#02133B] hover:bg-[#02133B]/10 "
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

export default function Sidebar({
  className,
  isCollapsed = false,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex transition-all bg-white rounded-[16px] border-[#02133B]/20 border-[1px] pr-[16px] duration-300 ",
          isCollapsed ? "w-16" : "w-[18rem]",
          className
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-background"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
