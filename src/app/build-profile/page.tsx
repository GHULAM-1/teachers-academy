"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BuildProfilePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [preferredName, setPreferredName] = useState("James");
  const totalSteps = 5;
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete profile setup
      router.push("/user-profile");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[#02133B]">
              What would you prefer to be called?
            </h2>
            <div className="max-w-md mx-auto">
              <Input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="James"
                className="text-center text-lg py-3"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[#02133B]">
              What's your current profession?
            </h2>
            <div className="max-w-md mx-auto">
              <Input
                type="text"
                placeholder="e.g. Teacher, Student, Professional"
                className="text-center text-lg py-3"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[#02133B]">
              What are your career goals?
            </h2>
            <div className="max-w-md mx-auto">
              <Input
                type="text"
                placeholder="e.g. Career change, Skill development"
                className="text-center text-lg py-3"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[#02133B]">
              How much experience do you have?
            </h2>
            <div className="max-w-md mx-auto">
              <Input
                type="text"
                placeholder="e.g. 2 years, Beginner"
                className="text-center text-lg py-3"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[#02133B]">
              What's your preferred learning style?
            </h2>
            <div className="max-w-md mx-auto">
              <Input
                type="text"
                placeholder="e.g. Visual, Hands-on, Reading"
                className="text-center text-lg py-3"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
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

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-1 mt-16">
            <div
              className="bg-[#02133B] h-1 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-12 pt-8">
            {getStepContent()}

            {/* Next Button */}
            <div className="flex justify-end mt-8">
              <Button
                onClick={handleNext}
                className="bg-[#02133B] hover:bg-[#02133B]/90 text-white font-medium py-3 px-6 rounded-lg flex items-center space-x-2"
              >
                <span>{currentStep === totalSteps ? "Complete" : "Next"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 