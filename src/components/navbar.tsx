"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./auth/auth-provider";
import { createClient, supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import PremiumUpgradeDialog from "./premium-upgrade-dialog";

export default function Navbar() {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [showPremiumDialog, setShowPremiumDialog] = useState(false);
    const router = useRouter();
  
    // Extract initials from display name
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2); // Limit to 2 characters
    };
  
    useEffect(() => {
      async function fetchUserProfile() {
        if (!user) {
          setIsLoading(false);
          return;
        }
  
        try {
          // Get user data from auth.users table
          const supabase = createClient();
          const { data: { user: userData }, error } = await supabase.auth.getUser();
  
          if (error) {
            console.error('Error fetching user data:', error);
            setDisplayName(user.email || 'User');
          } else {
            // Get name from user metadata
            const userMetadata = userData?.user_metadata;
            const name = userMetadata?.full_name || 
                        userMetadata?.name ||
                        userMetadata?.first_name ||
                        user.email?.split('@')[0] || 
                        'User';
            setDisplayName(name);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setDisplayName(user.email || 'User');
        } finally {
          setIsLoading(false);
        }
      }
  
      fetchUserProfile();
    }, [user]);

    const handleSignOut = async () => {
        try {
          await supabase.auth.signOut();
          // Clear any local state immediately
          setDisplayName('');
          setIsLoading(false);
          // Redirect to landing page
          window.location.href = '/';
        } catch (error) {
          console.error('Error signing out:', error);
        }
      };

      const handleProfile = () => {
        router.push('/user-profile');
      };
  

  // Don't render navbar content while loading or if no user
  if (isLoading || !user) {
    return (
      <nav className="w-full max-w-[1440px] mx-auto bg-primary-blue text-white px-6 py-3 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <img src="/logo-white.png" alt="logo" className="w-[100px] h-[30px]" />
        </div>
        
        {/* Show loading state on the right */}
        <div className="flex items-center space-x-4">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className=" w-full max-w-[1440px] mx-auto bg-primary-blue text-white px-6 py-3 flex items-center justify-between">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-3">
        <img src="/logo-white.png" alt="logo" className="w-[100px] h-[30px]" />
      </div>

      {/* Right side - Upgrade and User Profile */}
      <div className="flex items-center space-x-4">
        {/* Upgrade to Premium Button */}
        <Button
          variant="outline"
          onClick={() => setShowPremiumDialog(true)}
          className="bg-primary-gold hover:cursor-pointer hover:bg-primary-gold border-primary-gold text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <Star className="w-4 h-4 hover:text-white " fill="white" color="white" />
          <span className="text-sm text-white font-medium">
            Upgrade to Premium
          </span>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex outline-0 items-center space-x-2 p-2 hover:bg-transparent"
            >
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarFallback className="bg-transparent text-white font-semibold text-sm">
                  {user ? getInitials(displayName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">{displayName}</span>
              <ChevronDown className="w-4 h-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Premium Upgrade Dialog */}
      <PremiumUpgradeDialog 
        isOpen={showPremiumDialog} 
        onClose={() => setShowPremiumDialog(false)} 
      />
    </nav>
  );
}
