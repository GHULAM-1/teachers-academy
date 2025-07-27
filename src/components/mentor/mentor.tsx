"use client";

import Hero from "../hero";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useCallback } from "react";
import { Message } from "ai/react";
import StepChat from "./step-chat";
import Chat from "./chat";
import SaveChatDialog from "./save-chat-dialog";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useChatSaveDialog } from "@/hooks/use-chat-save-dialog";

interface MentorProps {
  chatId?: string;
  initialMessages?: Message[];
}

export default function Mentor({ chatId: propChatId, initialMessages = [] }: MentorProps) {
  // ALL HOOKS MUST BE CALLED FIRST, before any conditional logic
  const [showHero, setShowHero] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [initialStepChatMessages, setInitialStepChatMessages] = useState<Message[]>([]);
  const [hasResumedState, setHasResumedState] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  
  const { user } = useAuth();
  const router = useRouter();
  
  // Use the chatId that comes from the route (same one used by API)
  // For new chats, this will be undefined initially, but useChat will handle it
  const chatId = propChatId;
  
  // Determine if this is an EXISTING chat (loaded from database with initialMessages)
  // If initialMessages are provided as props, this is an existing chat being viewed
  const isExistingChat = initialMessages.length > 0;
  
  // Count meaningful user messages (excluding trigger messages)
  const meaningfulUserMessages = currentMessages.filter((m, i) => {
    if (m.role !== "user") return false;
    // Skip trigger messages
    if (m.content === "begin" || m.content === "start" || m.content?.trim() === "") return false;
    return true;
  });
  const hasMeaningfulMessages = meaningfulUserMessages.length > 0;
  
  // Check if chat has been started (has any messages, including trigger messages)
  const hasChatStarted = currentMessages.length > 0;
  
  // Only show save dialog for NEW chats (not existing ones being viewed)
  // AND only when we have a valid chatId
  const saveDialogChatId = (isExistingChat || !chatId) ? undefined : chatId;
  
  // Always call the hook with consistent parameters
  const shouldShowSaveDialog = hasChatStarted && !isExistingChat && !!chatId;
  
  const { showSaveDialog, handleSaveChoice, triggerSaveDialog } = useChatSaveDialog(
    saveDialogChatId,  // Only for new chats with valid chatId
    shouldShowSaveDialog
  );
  
  // Update current messages when they change (from StepChat or Chat)
  const handleMessagesUpdate = useCallback((messages: Message[]) => {
    // Count meaningful messages directly here to avoid circular dependency
    const meaningful = messages.filter((m, i) => {
      if (m.role !== "user") return false;
      // Skip trigger messages
      if (m.content === "begin" || m.content === "start" || m.content?.trim() === "") return false;
      return true;
    });
    
    console.log('💬 Messages updated. Total:', messages.length, 'Meaningful:', meaningful.length);
    setCurrentMessages(messages);
  }, []);

  // Function to count user answers (matching step-chat logic EXACTLY)
  const getCurrentUserAnswerCount = (messages: Message[]) => {
    return messages.filter((m, i) => {
      if (m.role !== "user") return false;
      // Skip the initial trigger messages (matching backend logic EXACTLY)
      if (i === 0 && (!m.content || m.content.trim() === "" || m.content.trim() === "start" || m.content.trim() === "begin")) return false;
      return m.content && m.content.trim() !== "";
    }).length;
  };

  const handleStepComplete = useCallback((allMessages: Message[], recommendationText: string) => {
    setConversationHistory(allMessages);
    setRecommendation(recommendationText);
    setShowHero(false);
    setShowChat(true);
  }, []);

  console.log('💬 Mentor component:', { 
    propChatId, 
    chatId, 
    isExistingChat: !!propChatId,
    hasValidChatId: !!chatId,
    initialMessagesCount: initialMessages.length 
  });

  // Listen for custom save dialog events from sidebar
  useEffect(() => {
    const handleShowSaveDialog = (event: CustomEvent) => {
      console.log('📡 Received showSaveDialog event');
      console.log('🔍 Event conditions:', { 
        hasChatStarted, 
        isExistingChat, 
        chatId: !!chatId,
        shouldShow: hasChatStarted && !isExistingChat && !!chatId 
      });
      
      if (hasChatStarted && !isExistingChat && chatId) {
        const intendedUrl = event.detail?.intendedUrl;
        console.log('🎯 Intended navigation:', intendedUrl);
        triggerSaveDialog(intendedUrl);
        // Prevent navigation since dialog will show
        // We need to prevent the navigation that's about to happen
        setTimeout(() => {
          window.history.pushState(null, '', window.location.pathname);
        }, 0);
      } else {
        console.log('❌ Dialog not shown - conditions not met, allowing navigation');
      }
    };

    window.addEventListener('showSaveDialog', handleShowSaveDialog as EventListener);
    
    return () => {
      window.removeEventListener('showSaveDialog', handleShowSaveDialog as EventListener);
    };
  }, [hasChatStarted, isExistingChat, chatId, triggerSaveDialog]);

  // Set a global flag for the sidebar to know if we're in a new chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).isNewChat = hasChatStarted && !isExistingChat && !!chatId;
    }

    // Cleanup: clear the flag when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).isNewChat = false;
      }
    };
  }, [hasChatStarted, isExistingChat, chatId]);

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
      console.log(`🔍 User answered: ${userAnswerCount}/8, Has recommendation: ${hasRecommendationMessage}`);
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
        
        // Split conversation: everything from recommendation onwards (what Chat should show)
        const conversationFromRecommendation = recommendationIndex >= 0 
          ? initialMessages.slice(recommendationIndex)
          : [];
        
        console.log(`📋 Conversation split: showing ${conversationFromRecommendation.length} messages from index ${recommendationIndex} onwards`);
        console.log(`📋 Messages being passed to Chat:`, conversationFromRecommendation.map((m, i) => `${i}: ${m.role} - "${m.content?.substring(0, 50)}..."`));
        
        // User completed assessment, show final chat starting from first recommendation
        setConversationHistory(conversationFromRecommendation);
        setRecommendation(recommendationMessage?.content || '');
        setShowHero(false);
        setShowChat(true);
      } else {
        console.log(`📝 Assessment in progress (${userAnswerCount}/8), continuing with StepChat`);
        
        // Filter out trigger messages - match server-side logic exactly
        const filteredMessages = initialMessages.filter((m, index) => {
          // Only filter out the first trigger message (matching server-side logic)
          if (index === 0 && m.role === 'user' && (!m.content || m.content.trim() === '' || m.content.trim() === 'begin' || m.content.trim() === 'start')) {
            return false;
          }
          return true;
        });
        
        console.log(`📋 Filtered ${initialMessages.length - filteredMessages.length} trigger messages for StepChat`);
        
        // User hasn't completed all questions, continue with StepChat
        setInitialStepChatMessages(filteredMessages);
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
          key={chatId} // Ensure consistent rendering
          onComplete={handleStepComplete} 
          showHero={setShowHero}
          chatId={chatId}
          initialMessages={initialStepChatMessages}
          onMessagesUpdate={handleMessagesUpdate}
        />
      )}
      {/* Chat */}
      {showChat && (
        <Chat 
          conversationHistory={conversationHistory} 
          recommendation={recommendation}
          chatId={chatId}
          onMessagesUpdate={handleMessagesUpdate}
        />
      )}

      {/* Save Chat Dialog */}
      <SaveChatDialog
        isOpen={showSaveDialog}
        onSave={() => handleSaveChoice(true)}
        onDiscard={() => handleSaveChoice(false)}
        chatId={chatId}
      />
    </div>
  );
}