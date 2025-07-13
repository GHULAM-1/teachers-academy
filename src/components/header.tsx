"use client";

import {
  Bell,
  Settings,
  User,
  LogOut,
  UserIcon,
  ChevronLeft,
  ChevronRight,
  PanelRight,
  PanelLeft,
  CircleQuestionMark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Header({
  className,
  isCollapsed = false,
  onToggle,
}: HeaderProps) {
  return (
    <header className={`bg-background border-b border-[#02133B]/20 ${className}`}>
      <div className="flex h-16 items-center justify-between">
        {/* Left side - Sidebar Toggle */}
        <div className="flex items-center">
          {onToggle && (
            <div onClick={onToggle}>
              {isCollapsed ? (
                <PanelRight className="text-[#02133B] w-[24px] h-[24px] cursor-pointer" />
              ) : (
                <PanelLeft className="text-[#02133B] w-[24px] h-[24px] cursor-pointer" />
              )}
            </div>
          )}
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          <div>
            <CircleQuestionMark className="text-[#02133B] w-[24px] h-[24px] cursor-pointer" />
          </div>
          <div>
            <Settings className="text-[#02133B] w-[24px] h-[24px] cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
}
