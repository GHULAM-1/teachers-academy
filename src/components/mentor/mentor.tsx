"use client";

import { useState, useEffect, useCallback } from "react";
import { Message } from "ai/react";
import Chat from "./chat";
import SaveChatDialog from "./save-chat-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useChatSaveDialog } from "@/hooks/use-chat-save-dialog";
import Header from "../header";
import ChatSkeleton from "@/components/ui/chat-skeleton";

interface MentorProps {
  chatId?: string;
  initialMessages?: Message[];
  stuckMode?: boolean;
}

export default function Mentor({
  chatId: propChatId,
  initialMessages = [],
  stuckMode = false,
}: MentorProps) {
  // ALL HOOKS MUST BE CALLED FIRST, before any conditional logic
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
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
    if (
      m.content === "begin" ||
      m.content === "start" ||
      m.content?.trim() === ""
    )
      return false;
    return true;
  });
  const hasMeaningfulMessages = meaningfulUserMessages.length > 0;

  // Check if chat has been started (has any messages, including trigger messages)
  const hasChatStarted = currentMessages.length > 0;

  // Only show save dialog for NEW chats (not existing ones being viewed)
  // AND only when we have a valid chatId
  // AND not in stuck mode
  const saveDialogChatId =
    isExistingChat || !chatId || stuckMode ? undefined : chatId;

  // Always call the hook with consistent parameters
  const shouldShowSaveDialog =
    hasChatStarted && !isExistingChat && !!chatId && !stuckMode;

  const {
    showSaveDialog,
    handleSaveChoice,
    handleContinueChat,
    triggerSaveDialog,
  } = useChatSaveDialog(
    saveDialogChatId, // Only for new chats with valid chatId
    shouldShowSaveDialog
  );

  // Update current messages when they change (from StepChat or Chat)
  const handleMessagesUpdate = useCallback((messages: Message[]) => {
    // Count meaningful messages directly here to avoid circular dependency
    const meaningful = messages.filter((m, i) => {
      if (m.role !== "user") return false;
      // Skip trigger messages
      if (
        m.content === "begin" ||
        m.content === "start" ||
        m.content?.trim() === ""
      )
        return false;
      return true;
    });

    console.log(
      "💬 Messages updated. Total:",
      messages.length,
      "Meaningful:",
      meaningful.length
    );
    setCurrentMessages(messages);
  }, []);



  // Listen for custom save dialog events from sidebar
  useEffect(() => {
    const handleShowSaveDialog = (event: CustomEvent) => {
      console.log("📡 Received showSaveDialog event");
      console.log("🔍 Event conditions:", {
        hasChatStarted,
        isExistingChat,
        chatId: !!chatId,
        shouldShow: hasChatStarted && !isExistingChat && !!chatId,
      });

      if (hasChatStarted && !isExistingChat && chatId) {
        const intendedUrl = event.detail?.intendedUrl;
        console.log("🎯 Intended navigation:", intendedUrl);
        triggerSaveDialog(intendedUrl);
        // Prevent navigation since dialog will show
        // We need to prevent the navigation that's about to happen
        setTimeout(() => {
          window.history.pushState(null, "", window.location.pathname);
        }, 0);
      } else {
        console.log(
          "❌ Dialog not shown - conditions not met, allowing navigation"
        );
      }
    };

    window.addEventListener(
      "showSaveDialog",
      handleShowSaveDialog as EventListener
    );

    return () => {
      window.removeEventListener(
        "showSaveDialog",
        handleShowSaveDialog as EventListener
      );
    };
  }, [hasChatStarted, isExistingChat, chatId, triggerSaveDialog]);

  // Set a global flag for the sidebar to know if we're in a new chat
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).isNewChat = hasChatStarted && !isExistingChat && !!chatId;
    }

    // Cleanup: clear the flag when component unmounts
    return () => {
      if (typeof window !== "undefined") {
        (window as any).isNewChat = false;
      }
    };
  }, [hasChatStarted, isExistingChat, chatId]);

  // Handle initial messages and show chat
  useEffect(() => {
    if (initialMessages.length > 0 && !hasResumedState) {
      setHasResumedState(true);
      setConversationHistory(initialMessages);
      
      // Show loading for a moment, then show chat
      setTimeout(() => {
        setIsLoading(false);
        setShowChat(true);
      }, 1000);
    } else {
      // For new chats, show loading briefly then show chat with default trigger
      setTimeout(() => {
        setIsLoading(false);
        setShowChat(true);
      }, 1500);
    }
  }, [initialMessages, hasResumedState]);

  // Check if profile is filled
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "preferred_name, role_title, students_and_subjects, career_goals"
        )
        .eq("id", user.id)
        .single();

      if (
        !profile ||
        !profile.preferred_name ||
        !profile.role_title ||
        !profile.students_and_subjects ||
        !profile.career_goals
      ) {
        setNeedsProfile(true);
      }
      setProfileChecked(true);
    };

    checkProfile();
  }, [user]);


  if (needsProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto text-center">
          <h2 className="text-xl font-bold mb-4 text-[#02133B]">
            Complete Your Profile
          </h2>
          <p className="mb-6 text-[#02133B]">
            Please fill out your profile before talking to the AI Mentor.
          </p>
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
      <Header isCollapsed={false} title="AI Mentor" />

      {/* Show skeleton loading or chat */}
      {isLoading ? (
        <ChatSkeleton />
      ) : (
        <Chat
          conversationHistory={stuckMode ? [] : conversationHistory}
          chatId={chatId}
          onMessagesUpdate={handleMessagesUpdate}
          stuckMode={stuckMode}
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
