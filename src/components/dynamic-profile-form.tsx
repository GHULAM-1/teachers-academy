"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";

interface Question {
  id: string;
  question: string;
  placeholder: string;
  field: string;
}

interface DynamicProfileFormProps {
  questions: Question[];
  onComplete: () => void;
  onBack: () => void;
}

export default function DynamicProfileForm({
  questions,
  onComplete,
  onBack,
}: DynamicProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleNext = async () => {
    if (!answers[currentQuestion.field]) {
      return; // Don't proceed if answer is empty
    }

    if (isLastStep) {
      // Save all answers to database
      await saveProfileData();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleInputChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.field]: value
    }));
  };

  const saveProfileData = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...answers,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving profile:', error);
        return;
      }

      console.log('Profile saved successfully');
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = ((currentStep + 1) / questions.length) * 100;

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
          {/* Progress Bar */}
          <div className="w-full max-w-lg bg-white h-2 rounded-full mt-16 mb-8">
            <div
              className="bg-[#02133B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

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
          <div className="text-center  space-y-8 px-8 flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-[#02133B] leading-tight">
              {currentQuestion.question}
            </h2>
            
            <div className="max-w-md mx-auto w-full">
              <Input
                type="text"
                value={answers[currentQuestion.field] || ""}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="text-center text-lg py-4 px-6 w-full"
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="absolute bottom-8 right-8">
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.field] || isSubmitting}
              className="bg-[#02133B] hover:bg-[#02133B]/90 text-white font-medium py-3 px-6 rounded-lg flex items-center space-x-2"
            >
              <span>{isSubmitting ? "Saving..." : (isLastStep ? "Complete" : "Next")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 