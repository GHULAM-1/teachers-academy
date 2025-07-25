"use client";

import Hero from "../hero";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Message } from "ai/react";
import StepChat from "./step-chat";
import Chat from "./chat";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MentorProps {
  chatId?: string;
  initialMessages?: Message[];
}

export default function Mentor({ chatId, initialMessages = [] }: MentorProps) {
  const [showHero, setShowHero] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [initialStepChatMessages, setInitialStepChatMessages] = useState<Message[]>([]);
  const [hasResumedState, setHasResumedState] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  // Function to count user answers (matching step-chat logic EXACTLY)
  const getCurrentUserAnswerCount = (messages: Message[]) => {
    return messages.filter((m, i) => {
      if (m.role !== "user") return false;
      // Skip the initial trigger messages (matching backend logic EXACTLY)
      if (i === 0 && (!m.content || m.content.trim() === "" || m.content.trim() === "start" || m.content.trim() === "begin")) return false;
      return m.content && m.content.trim() !== "";
    }).length;
  };

  // Analyze initial messages to determine state
  useEffect(() => {
    if (initialMessages.length > 0 && !hasResumedState) {
      setHasResumedState(true);
      
      // Use the same counting logic as step-chat
      const userAnswerCount = getCurrentUserAnswerCount(initialMessages);
      const lastMessage = initialMessages[initialMessages.length - 1];
      
      console.log(`🔄 Mentor resuming: ${userAnswerCount}/8 user answers, last message: ${lastMessage?.role}`);
      console.log(`📋 All initial messages:`, initialMessages.map((m, i) => `${i}: ${m.role} - "${m.content?.substring(0, 50)}..."`));
      console.log(`📄 Last message content:`, lastMessage?.content);
      console.log(`❓ Last message ends with ?:`, lastMessage?.content?.trim().endsWith('?'));
      console.log(`📏 Last message length:`, lastMessage?.content?.length);
      
      // Check if we have completed the assessment (8 questions) and got any recommendation
      // Once 8 questions are answered AND we have a recommendation, always use Chat mode
      const recommendationMessages = initialMessages.filter(m => 
        m.role === 'assistant' && 
        m.content?.includes('[CTA_BUTTON:')
      );
      
      const hasRecommendationMessage = recommendationMessages.length > 0;
      
      // Log all recommendations found
      console.log(`🎯 Found ${recommendationMessages.length} recommendation messages:`);
      recommendationMessages.forEach((msg, index) => {
        console.log(`📋 Recommendation ${index + 1}:`, msg.content);
        const ctaMatch = msg.content?.match(/\[CTA_BUTTON:([^\]]+)\]/);
        console.log(`🔗 CTA Button ${index + 1}:`, ctaMatch ? ctaMatch[1] : 'None found');
      });
      
      // Must have both: completed 8 questions AND got a recommendation
      const hasCompletedAssessment = userAnswerCount >= 8 && hasRecommendationMessage;
      
      console.log(`🔍 User answered: ${userAnswerCount}/8, Has recommendation: ${hasRecommendationMessage}, Completed: ${hasCompletedAssessment}`);
      
      if (hasCompletedAssessment) {
        console.log(`✅ Assessment completed, showing final chat with recommendation`);
        // Find the first recommendation message with CTA button
        const recommendationMessage = initialMessages.find(m => 
          m.role === 'assistant' && 
          m.content?.includes('[CTA_BUTTON:')
        );
        
        // Find the index of the first recommendation message
        const recommendationIndex = initialMessages.findIndex(m => 
          m.role === 'assistant' && 
          m.content?.includes('[CTA_BUTTON:')
        );
        
        // Split conversation: everything before recommendation vs everything from recommendation onwards
        const conversationBeforeRecommendation = recommendationIndex > 0 
          ? initialMessages.slice(0, recommendationIndex)
          : [];
        
        console.log(`📋 Conversation split: ${conversationBeforeRecommendation.length} messages before recommendation, showing from index ${recommendationIndex}`);
        
        // User completed assessment, show final chat starting from first recommendation
        setConversationHistory(conversationBeforeRecommendation);
        setRecommendation(recommendationMessage?.content || '');
        setShowHero(false);
        setShowChat(true);
      } else {
        console.log(`📝 Assessment in progress (${userAnswerCount}/8), continuing with StepChat`);
        // User hasn't completed all questions, continue with StepChat
        setInitialStepChatMessages(initialMessages);
        setShowHero(false);
        // showChat remains false, so StepChat will be shown
      }
    }
  }, [initialMessages, hasResumedState]);

  // Check if profile is filled
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_name, role_title, students_and_subjects, career_goals")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.preferred_name || !profile.role_title || !profile.students_and_subjects || !profile.career_goals) {
        setNeedsProfile(true);
      }
      setProfileChecked(true);
    };

    checkProfile();
  }, [user]);

  if (!profileChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto text-center">
          <h2 className="text-xl font-bold mb-4 text-[#02133B]">Complete Your Profile</h2>
          <p className="mb-6 text-[#02133B]">Please fill out your profile before talking to the AI Mentor.</p>
          <Button
            onClick={() => router.push("/user-profile")}
            className="w-full bg-[#02133B] text-white hover:bg-[#02133B]/90"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  const handleStepComplete = (allMessages: Message[], recommendationText: string) => {
    setConversationHistory(allMessages);
    setRecommendation(recommendationText);
    setShowHero(false);
    setShowChat(true);
  };
  return (
    <div className="">
      {/* Hero Section */}
      {showHero && (
        <>
          <Hero
            icon={<MessageSquare className="w-10 h-10 text-white" />}
            title="AI Mentor"
            subtitle="What professional challenge or opportunity can I help you with today?"
          />
          
          <Separator className="my-6" />
        </>
      )}
      {/* StepChat or Loader */}
      {!showChat && (
        <StepChat  
          onComplete={handleStepComplete} 
          showHero={setShowHero}
          chatId={chatId}
          initialMessages={initialStepChatMessages}
        />
      )}
      {/* Chat */}
      {showChat && (
        <Chat 
          conversationHistory={conversationHistory} 
          recommendation={recommendation}
          chatId={chatId}
        />
      )}
    </div>
  );
}