"use client";

import React, { useEffect, useState } from "react";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth/auth-provider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function UserCard() {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    async function checkProfileCompletion() {
      if (!user) {
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // First check if the user exists in auth
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setIsProfileComplete(false);
          setIsLoading(false);
          return;
        }

        // Then check the profiles table
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("preferred_name, role_title, career_goals, biggest_obstacle")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking profile completion:", error);
          setIsProfileComplete(false);
        } else {
          // Check if profile has essential fields filled
          const hasEssentialFields =
            profile?.preferred_name ||
            profile?.role_title ||
            profile?.career_goals ||
            profile?.biggest_obstacle;

          setIsProfileComplete(!!hasEssentialFields);
          setProfileData(profile);
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
        setIsProfileComplete(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkProfileCompletion();
  }, [user]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  // Show profile data if profile is complete
  if (isProfileComplete && profileData) {
    return (
      <div className="bg-white rounded-[16px] flex items-center p-6 shadow-sm">
        <div className="flex flex-col items-start gap-[32px]  text-left">
          {/* Icon with sparkle */}
          <div className="relative mb-4">
            <div className="relative">
              <User className="w-8 h-8 text-primary-gold" />
              <Sparkles className="w-4 h-4 text-primary-gold absolute -top-1 -right-2" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold leading-tight mb-4">
              <span className="text-primary-text">Welcome back,</span>
              <br />
              <span className="text-primary-gold">
                {profileData.preferred_name || "User"}
              </span>
            </h2>
          </div>
          <div>
          <div className="space-y-3">
              {profileData.role_title && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-text/70">
                    Role:
                  </span>
                  <span className="text-sm text-primary-text">
                    {profileData.role_title}
                  </span>
                </div>
              )}

              {profileData.career_goals && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-text/70">
                    Career Goals:
                  </span>
                  <span className="text-sm text-primary-text">
                    {profileData.career_goals}
                  </span>
                </div>
              )}

              {profileData.biggest_obstacle && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-text/70">
                    Biggest Challenge:
                  </span>
                  <span className="text-sm text-primary-text">
                    {profileData.biggest_obstacle}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
          <Link href="/mentor" className="mt-6 inline-block">
              <Button className="bg-primary-gold hover:bg-primary-gold hover:cursor-pointer text-white px-6 py-3 rounded-lg font-medium">
                <span>Continue with AI Mentor</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Show setup card if profile is not complete
  return (
    <div className="bg-white rounded-[16px] p-6 shadow-sm">
      <div className="flex flex-col items-start gap-[16px] text-left">
        {/* Icon with sparkle */}
        <div className="relative mb-4">
          <div className="relative">
            <User className="w-8 h-8 text-primary-gold" />
            <Sparkles className="w-4 h-4 text-primary-gold absolute -top-1 -right-2" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold leading-tight">
            <span className="text-primary-text">Let's Build Your</span>
            <br />
            <span className="text-primary-gold">Personalized AI</span>
            <br />
            <span className="text-primary-gold">Mentor</span>
          </h2>
        </div>

        {/* Description */}
        <p className="text-primary-text text-[16px] leading-relaxed mb-6 max-w-xs">
          Answer 8 quick questions about your experience and career goals. This
          allows your AI to build a unique profile of you, ensuring every piece
          of advice is perfectly tailored to your background.
        </p>

        {/* CTA Button */}
        <Link href="/mentor">
          <Button className="bg-primary-gold hover:bg-primary-gold hover:cursor-pointer text-white px-6 py-3 rounded-lg font-medium">
            <span>GET STARTED</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
