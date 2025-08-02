"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import UserProfileForm from "@/components/profile/user-profile-form";
import Header from "@/components/header";
import { User, ArrowRight, ArrowLeft } from "lucide-react";
import { useProfileStatus } from "@/hooks/use-profile-status";
import Loading from "@/components/ui/loading";
import Image from "next/image";
import DynamicProfileForm from "@/components/dynamic-profile-form";

export default function UserProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDynamicForm, setShowDynamicForm] = useState(false);
  const { updateProfileStatus } = useProfileStatus();

  const profileQuestions = [
    {
      id: "preferred_name",
      question: "What would you prefer to be called?",
      placeholder: "James",
      field: "preferred_name"
    },
    {
      id: "role_title",
      question: "What's your current profession?",
      placeholder: "e.g. Teacher, Student, Professional",
      field: "role_title"
    },
    {
      id: "career_goals",
      question: "What are your career goals?",
      placeholder: "e.g. Career change, Skill development",
      field: "career_goals"
    },
    {
      id: "exploring_opportunities",
      question: "Why are you exploring new opportunities right now?",
      placeholder: "e.g. Career growth, Skill development, New challenges",
      field: "exploring_opportunities"
    },
    {
      id: "top_skills",
      question: "What are your top skills?",
      placeholder: "e.g. Teaching, Communication, Leadership",
      field: "top_skills"
    },
    {
      id: "biggest_obstacle",
      question: "What's your biggest obstacle right now?",
      placeholder: "e.g. Time constraints, Lack of experience, Uncertainty",
      field: "biggest_obstacle"
    },
    {
      id: "students_and_subjects",
      question: "What subjects or areas do you teach or want to teach?",
      placeholder: "e.g. Math, Science, English, Business",
      field: "students_and_subjects"
    },
    {
      id: "additional_activities",
      question: "What additional activities or interests do you have?",
      placeholder: "e.g. Writing, Public speaking, Technology",
      field: "additional_activities"
    },
    {
      id: "weekly_time_commitment",
      question: "How much time can you commit weekly?",
      placeholder: "e.g. 5-10 hours, 10-20 hours",
      field: "weekly_time_commitment"
    }
  ];

  useEffect(() => {
    checkUserProfile();
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // PGRST116 means "no rows found" - this is expected when no profile exists
        if (error.code === "PGRST116") {
          console.log("No profile found - hiding sidebar");
          setHasProfile(false);
          updateProfileStatus(false);
        } else {
          console.error("Error checking user profile:", error);
          setHasProfile(false);
          updateProfileStatus(false);
        }
      } else if (profile) {
        console.log("Profile found - showing sidebar");
        setHasProfile(true);
        updateProfileStatus(true);
      } else {
        console.log("No profile data - hiding sidebar");
        setHasProfile(false);
        updateProfileStatus(false);
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      setHasProfile(false);
      updateProfileStatus(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildProfile = () => {
    setShowDynamicForm(true);
  };

  const handleFormComplete = () => {
    setShowDynamicForm(false);
    setHasProfile(true);
    updateProfileStatus(true);
    // Refresh the page to show the profile form
    window.location.reload();
  };

  const handleFormBack = () => {
    setShowDynamicForm(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Header isCollapsed={false} title="User Profile" />
        <Loading message="Checking your profile..." />
      </div>
    );
  }

    if (showDynamicForm) {
    return (
      <DynamicProfileForm
        questions={profileQuestions}
        onComplete={handleFormComplete}
        onBack={handleFormBack}
      />
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen max-w-[1440px] mx-auto top-15 overflow-hidden fixed inset-0">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/card-bg.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div
            className="rounded-2xl w-full max-w-5xl min-h-[554px] flex flex-col justify-center items-center mx-auto relative"
            style={{
              background: "rgba(255, 255, 255, 0.21)",
              borderRadius: "16px",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(9.6px)",
              WebkitBackdropFilter: "blur(9.6px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="absolute top-6 left-6 p-2 bg-[#02133B] text-white rounded-full hover:bg-[#02133B]/90"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Content */}
            <div className="p-12 pt-16 text-center">
              <h1 className="text-4xl font-bold text-[#02133B] mb-6">
                Build Your Profile
              </h1>
              
              <p className="text-lg text-[#02133B] mb-12 max-w-md mx-auto">
                Help us understand your background and goals so we can provide
                personalized guidance.
              </p>

              {/* Get Started Button */}
              <Button
                onClick={handleBuildProfile}
                className="bg-[#02133B] hover:bg-[#02133B]/90 text-white font-medium py-4 px-8 rounded-lg flex items-center space-x-2 mx-auto"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <Header isCollapsed={false} title="User Profile" />
      <div className="">
        <UserProfileForm />
      </div>
    </div>
  );
}
