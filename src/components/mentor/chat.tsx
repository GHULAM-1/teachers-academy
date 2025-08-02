"use client";

import { useChat, Message } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowRight, Send, TriangleAlert } from "lucide-react";
import Image from "next/image";
import ChatSkeleton from "@/components/ui/chat-skeleton";
import QuestionProgress from "@/components/ui/question-progress";
import CraftingLoader from "@/components/ui/crafting-loader";

interface ChatProps {
  conversationHistory?: Message[];
  recommendation?: string;
  chatId?: string;
  onMessagesUpdate?: (messages: Message[]) => void;
  stuckMode?: boolean;
}

export default function Chat({
  conversationHistory = [],
  recommendation,
  chatId,
  onMessagesUpdate,
  stuckMode = false,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showCraftingLoader, setShowCraftingLoader] = useState(false);
  const [hasShownCraftingLoader, setHasShownCraftingLoader] = useState(false);
  const [hasRecommendation, setHasRecommendation] = useState(false);
  const hasStartedRef = useRef(false);

  // Let Vercel AI SDK handle everything - conversation history already contains messages from 1st recommendation onwards
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    reload,
    append,
  } = useChat({
    api: stuckMode ? "/api/chat/stuck" : "/api/chat",
    id: chatId,
    initialMessages: [], // Don't use initialMessages here to avoid conflicts
  });

  // Debug chat ID
  useEffect(() => {
    console.log("💬 Chat component initialized with chatId:", chatId);
  }, [chatId]);

  // Add initial trigger message to start AI conversation (based on working stepchat logic)
  useEffect(() => {
    console.log("🔍 Chat useEffect check:", {
      messagesLength: messages.length,
      conversationHistoryLength: conversationHistory.length,
      hasStarted: hasStartedRef.current,
      chatId: chatId?.substring(0, 8) + "...",
    });

    if (
      messages.length === 0 &&
      !conversationHistory.length &&
      !hasStartedRef.current &&
      !isLoading
    ) {
      console.log('🚀 Chat: Auto-starting with "begin" message');
      hasStartedRef.current = true;

      // Reset crafting loader state for new chats
      setHasShownCraftingLoader(false);
      setShowCraftingLoader(false);

      // Check if there's already a "begin" message in the messages array
      const hasBeginMessage = messages.some((m) => m.content === "begin");
      if (!hasBeginMessage) {
        append({ role: "user", content: "begin" });
      } else {
        console.log('⚠️ "begin" message already exists, skipping...');
      }
    }
  }, [messages.length, conversationHistory.length, chatId, isLoading]);

  // Force set conversation history when it's provided (for existing chats)
  useEffect(() => {
    if (conversationHistory.length > 0 && messages.length === 0) {
      console.log(
        "🔄 Chat: Setting conversation history from props:",
        conversationHistory.length
      );
      setMessages(conversationHistory);

      // Reset crafting loader state for existing chats
      setHasShownCraftingLoader(false);
      setShowCraftingLoader(false);
    }
  }, [conversationHistory, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notify parent of message changes and track questions
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }

    // Count user messages (excluding trigger messages)
    const userMessages = messages.filter(
      (m) => m.role === "user" && m.id !== "hidden-trigger"
    );

    // Update question count and check for recommendation
    if (userMessages.length <= 8) {
      console.log("🔢 Chat: Updating question count to:", userMessages.length);
      setCurrentQuestion(userMessages.length);
    } else {
      // If we have more than 8 user messages, we're in recommendation phase
      console.log(
        "🔢 Chat: In recommendation phase, setting question count to 8"
      );
      setCurrentQuestion(8);
    }

    // Check if recommendation is complete (after 8 questions and AI has given final response)
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastAssistantMessage =
      assistantMessages[assistantMessages.length - 1];
    const hasRecommendationNow =
      userMessages.length >= 8 &&
      assistantMessages.length >= 9 && // 9th AI message is the recommendation
      lastAssistantMessage &&
      lastAssistantMessage.content &&
      !isLoading; // Only set recommendation when AI is done responding

    // Update hasRecommendation state
    setHasRecommendation(!!hasRecommendationNow);

    console.log("🔍 Recommendation check:", {
      userMessagesLength: userMessages.length,
      hasRecommendationNow,
      currentQuestion,
      showCraftingLoader,
      hasRecommendation: !!hasRecommendationNow,
    });

    // Hide crafting loader when recommendation is complete
    if (hasRecommendationNow && showCraftingLoader) {
      console.log("🎯 Hiding crafting loader - recommendation complete");
      setShowCraftingLoader(false);
    }

    // Show crafting loader only once after 8th question
    console.log("🔍 Crafting loader trigger check:", {
      userMessagesLength: userMessages.length,
      hasShownCraftingLoader,
      shouldTrigger: userMessages.length >= 8 && !hasShownCraftingLoader,
    });

    // Show crafting loader when we reach exactly 8 questions
    if (
      userMessages.length === 8 &&
      !hasShownCraftingLoader &&
      !hasRecommendation
    ) {
      console.log("🎯 Showing crafting loader after 8th question");
      setShowCraftingLoader(true);
      setHasShownCraftingLoader(true);
      setShowSkeleton(false);
    }

    // Also show crafting loader when AI starts responding after 8 questions
    if (
      userMessages.length >= 8 &&
      isLoading &&
      !hasShownCraftingLoader &&
      !hasRecommendation
    ) {
      console.log(
        "🎯 Showing crafting loader when AI starts responding after 8th question"
      );
      setShowCraftingLoader(true);
      setHasShownCraftingLoader(true);
      setShowSkeleton(false);
    }

    // Check if streaming has started
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === "assistant" &&
        lastMessage.content &&
        lastMessage.content.length > 0
      ) {
        setIsStreaming(true);
        setShowSkeleton(false); // Hide skeleton when AI starts streaming
        // Keep crafting loader visible while AI is streaming
      }
    } else if (!isLoading) {
      setIsStreaming(false);
      // Don't hide crafting loader - let it stay visible until recommendation is complete
    }

    // Hide skeleton when we have messages and are not in initial loading
    if (messages.length > 0 && showSkeleton) {
      setShowSkeleton(false);
    }
  }, [messages, onMessagesUpdate, isLoading, showCraftingLoader, showSkeleton]);

  const handleCtaClick = () => {
    // Check the recommendation text to determine which path was recommended
    const recommendationLower = (recommendation || "").toLowerCase();

    if (recommendationLower.includes("passive income")) {
      window.location.href = "/passive-income";
    } else if (recommendationLower.includes("career change")) {
      window.location.href = "/career-change";
    } else if (recommendationLower.includes("teaching business")) {
      window.location.href = "/teaching";
    } else {
      window.location.href = "/mentor";
    }
  };

  // Show skeleton until AI is ready to stream
  if (showSkeleton && messages.length === 0) {
    return <ChatSkeleton />;
  }

  // Show crafting loader after 8 questions (but not when we have a recommendation)
  console.log("🔍 Crafting loader check:", {
    showCraftingLoader,
    hasRecommendation,
    shouldShow: showCraftingLoader && !hasRecommendation,
  });
  if (showCraftingLoader && !hasRecommendation) {
    return <CraftingLoader />;
  }

  return (
    <div className="max-w-full flex flex-col h-[calc(100vh-200px)] mx-auto">
      {/* Fixed Question Progress Bar - Show only for first 8 questions and not after completion */}
      {(() => {
        const shouldShow =
          currentQuestion < 8 && currentQuestion >= 0 && !hasRecommendation;
        console.log("🔍 Progress bar check:", {
          currentQuestion,
          hasRecommendation,
          shouldShow,
        });
        return shouldShow;
      })() && (
        <div className="w-full max-w-[1200px] mx-auto p-4 bg-white rounded-lg flex-shrink-0">
          <div className="w-full max-w-xl mx-auto">
            <div className="text-center">
              <h3 className="text-[16px] text-primary-text">
                Question {currentQuestion} of 8
              </h3>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-text rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestion / 8) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Chat Messages Area */}
      <div className="flex flex-col bg-white rounded-lg gap-4 py-2 flex-1 overflow-y-auto scroll-smooth w-full">
        <div className="px-4 py-4 bg-white max-w-[800px] mx-auto w-full">
          {/* Show messages in hierarchy - one by one */}
          {messages.map((m, i) => {
            // Hide trigger messages from user display
            if (
              m.id === "hidden-trigger" ||
              (m.role === "user" &&
                (m.content === "begin" ||
                  m.content === "start" ||
                  m.content?.trim() === ""))
            ) {
              return null;
            }

            // Clean CTA button text from message content for display
            const displayContent =
              m.role === "assistant" && m.content?.includes("[CTA_BUTTON:")
                ? m.content.replace(/\[CTA_BUTTON:[^\]]+\]\s*/, "").trim()
                : m.content;

            const hasCTA =
              m.role === "assistant" && m.content?.includes("[CTA_BUTTON:");
            const ctaMatch = hasCTA
              ? m.content?.match(/\[CTA_BUTTON:([^\]]+)\]/)
              : null;

            return (
              <div key={i} className="flex flex-col gap-4 mb-4">
                {m.role === "user" ? (
                  // User messages on the RIGHT side
                  <div className="flex justify-end">
                    <div className="mr-8">
                      <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tl-[12px] text-base font-medium">
                        {displayContent}
                      </span>
                    </div>
                  </div>
                ) : (
                  // AI messages on the LEFT side
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-2">
                      <Image
                        src="/logo1.png"
                        alt="AI Avatar"
                        width={24}
                        height={24}
                        className="mt-1"
                      />
                      <div className="text-base text-[#02133B] font-normal bg-transparent whitespace-pre-wrap">
                        {displayContent}
                      </div>
                    </div>

                    {/* Show CTA button for messages with CTA */}
                    {hasCTA && ctaMatch && (
                      <div className="flex justify-start ml-4">
                        <Button
                          onClick={handleCtaClick}
                          className="bg-[#E4EDFF] hover:cursor-pointer hover:bg-[#E4EDFF] text-[#02133B] font-semibold px-6 py-2 rounded-[12px] transition-all duration-200 hover:border-[#02133B]/40"
                        >
                          {ctaMatch[1]}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Error Display - Show inline with messages */}
          {error && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2">
                <Image
                  src="/logo1.png"
                  alt="AI Avatar"
                  width={24}
                  height={24}
                  className="mt-1"
                />
                <div className="flex items-start gap-3 p-4 bg-[#FF0000]/10 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>
                        <TriangleAlert className="w-4 h-4 text-[#DA0000]" />
                      </span>
                      <span className="text-[#DA0000] font-medium">
                        It seems there was a temporary issue connecting to our
                        servers.
                      </span>
                    </div>
                    <p className="text-[#DA0000] text-sm">
                      Please try again in a moment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show "..." when AI is not streaming */}
          {isLoading && !isStreaming && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo1.png"
                  alt="AI Avatar"
                  width={24}
                  height={24}
                  className="mt-1"
                />
                <span className="text-base text-[#02133B] font-normal bg-transparent">
                  <div className="flex space-x-1">
                    <div className="w-1 mt-1 h-1 bg-[#02133B] rounded-full animate-bounce"></div>
                    <div
                      className="w-1 mt-1 h-1 bg-[#02133B] rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 mt-1 h-1 bg-[#02133B] rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-[70%] bg-transparent px-4 mt-4 mx-auto"
      >
        <div className="border rounded-xl flex items-center px-3 py-2 bg-white transition-shadow focus-within:ring-1 focus-within:ring-[#02133B]">
          <Textarea
            id="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || isLoading) return;

                // Trigger form submission
                const form = e.currentTarget.closest("form");
                if (form) {
                  form.requestSubmit();
                }
              }
            }}
            placeholder="Send a message"
            className="resize-none min-h-[40px] border-0 focus:outline-none shadow-none flex-1 text-base"
            maxLength={280}
            disabled={isLoading}
            style={{ boxShadow: "none" }}
          />
          <Button
            type="submit"
            size="icon"
            className="ml-2 rounded-full bg-transparent text-[#02133B]"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-5 h-5 text-[#02133B]" />
          </Button>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{input.length}/280</span>
          <span>ESC or Click to cancel</span>
        </div>
      </form>
    </div>
  );
}
