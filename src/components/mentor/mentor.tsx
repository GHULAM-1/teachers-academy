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
  
  const { showSaveDialog, handleSaveChoice, handleContinueChat, triggerSaveDialog } = useChatSaveDialog(
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

  // SOLID MESSAGE-BASED APPROACH
  useEffect(() => {
    if (initialMessages.length > 0 && !hasResumedState) {
      setHasResumedState(true);
      
      // Count user answers (excluding trigger messages)
      const userAnswerCount = getCurrentUserAnswerCount(initialMessages);
      
      // Count total assistant messages
      const assistantMessageCount = initialMessages.filter(m => m.role === 'assistant').length;
      
      console.log(`🔍 SOLID LOGIC: ${userAnswerCount}/8 answers, ${assistantMessageCount} assistant messages`);
      
      // SIMPLE RULE: If we have 8+ answers, show Chat with full conversation. Otherwise, show StepChat.
      if (userAnswerCount >= 8) {
        console.log(`✅ SOLID: Showing Chat mode (assessment complete)`);
        
        // Pass the entire conversation to Chat
        const chatMessages = initialMessages;
        
        console.log(`📋 Chat messages: ${chatMessages.length} total messages`);
        
        setConversationHistory(chatMessages);
        setRecommendation(chatMessages[0]?.content || '');
        setShowHero(false);
        setShowChat(true);
      } else {
        console.log(`📝 SOLID: Showing StepChat mode (assessment in progress)`);
        
        // Filter out trigger messages for StepChat
        const filteredMessages = initialMessages.filter(m => {
          if (m.role === 'user' && (!m.content || m.content.trim() === '' || m.content.trim() === 'begin' || m.content.trim() === 'start')) {
            return false;
          }
          return true;
        });
        
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
        onContinue={handleContinueChat}
        chatId={chatId}
      />
    </div>
  );
}