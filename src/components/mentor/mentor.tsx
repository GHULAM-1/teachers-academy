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

  // Analyze initial messages to determine state
  useEffect(() => {
    if (initialMessages.length > 0 && !hasResumedState) {
      setHasResumedState(true);
      
      // Count assistant messages that end with "?" (questions)
      const assistantQuestions = initialMessages
        .filter(m => m.role === 'assistant')
        .filter(m => m.content.trim().endsWith('?'));
      
      const questionsAnswered = assistantQuestions.length;
      
      // Check if we have a final recommendation (8th question answered)
      const lastAssistantMessage = initialMessages
        .filter(m => m.role === 'assistant')
        .pop();
      
      const hasFinalRecommendation = questionsAnswered >= 8 && 
        lastAssistantMessage && 
        !lastAssistantMessage.content.trim().endsWith('?');
      
      if (hasFinalRecommendation) {
        // User completed all 8 questions, show final chat
        setConversationHistory(initialMessages);
        setRecommendation(lastAssistantMessage?.content || '');
        setShowHero(false);
        setShowChat(true);
      } else {
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