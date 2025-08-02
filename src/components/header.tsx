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
  Plus,
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
import { useEffect, useState } from "react";
import { useAuth } from "./auth/auth-provider";
import { createClient } from "@/lib/supabase";

interface HeaderProps {
  title?: string;
  isCollapsed?: boolean;
}

export default function Header({ title, isCollapsed = false }: HeaderProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get user data from auth.users table
        const supabase = createClient();
        const {
          data: { user: userData },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user data:", error);
          setDisplayName(user.email || "User");
        } else {
          // Get name from user metadata
          const userMetadata = userData?.user_metadata;
          const name =
            userMetadata?.full_name ||
            userMetadata?.name ||
            userMetadata?.first_name ||
            user.email?.split("@")[0] ||
            "User";
          setDisplayName(name);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setDisplayName(user.email || "User");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [user]);

  return (
    <header className={` `}>
      <div className="flex h-16 items-center justify-between">
        {/* Left side - Sidebar Toggle */}
        <div className="flex items-center">
          {title ? (
            <span className="font-['Source_Serif_Pro'] text-[28px] font-semibold leading-[120%]">
              {title}
            </span>
          ) : (
            <span className="font-['Source_Serif_Pro'] text-[28px] font-semibold leading-[120%]">
              Good Morning,{" "}
              <span className="text-primary-gold">{displayName}</span>
            </span>
          )}
          {/* Removed toggle button */}
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {!title ? (
            <div>
              <Button
                variant="outline"
                className="bg-primary-text hover:bg-primary-text hover:cursor-pointer rounded-[8px] mr-[32px]"
              >
                <Plus className="text-white  cursor-pointer" />
                <p className="text-white text-[16px] font-medium">New Chat</p>
              </Button>
            </div>
          ) : null}
          <div>
            <CircleQuestionMark className="text-primary-text w-[24px] h-[24px] cursor-pointer" />
          </div>
          <div>
            <Settings className="text-primary-text w-[24px] h-[24px] cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
}
