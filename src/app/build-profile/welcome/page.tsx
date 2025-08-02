"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BuildProfileWelcomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/build-profile");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
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
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-2xl mx-auto relative shadow-2xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
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
              Help us understand your background and goals so we can provide personalized guidance.
            </p>

            {/* Get Started Button */}
            <Button
              onClick={handleGetStarted}
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