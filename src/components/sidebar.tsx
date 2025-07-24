"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import Image from "next/image";

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
    label: "Build Your Course",
    href: "/build-course",
    icon: BookOpen,
  },
  {
    id: "growth",
    label: "Career Growth",
    href: "/career",
    icon: Award,
  },
  {
    id: "independent",
    label: "Go Independent",
    href: "/independent",
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
      <ScrollArea className="flex-1 px-3">
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
                <Link href={item.href}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

export default function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex transition-all bg-white rounded-[16px] border-[#02133B]/20 border-[1px] pr-[16px] duration-300 ",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
        />
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
