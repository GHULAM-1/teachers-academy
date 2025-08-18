"use client";

import { useChat, Message } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Send, TriangleAlert } from "lucide-react";
import Image from "next/image";
import ChatSkeleton from "@/components/ui/chat-skeleton";

interface ChatProps {
  conversationHistory?: Message[];
  chatId?: string;
  onMessagesUpdate?: (messages: Message[]) => void;
  stuckMode?: boolean;
}

export default function Chat({
  conversationHistory = [],
  chatId,
  onMessagesUpdate,
  stuckMode = false,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
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
    }
  }, [conversationHistory, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notify parent of message changes
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }

    // Debug logging for new messages
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        console.log("🆕 New AI Message Received:", {
          messageId: lastMessage.id,
          content: lastMessage.content,
          hasCTAPattern: lastMessage.content?.includes("[CTA_BUTTON:"),
          ctaMatch: lastMessage.content?.match(/\[CTA_BUTTON:([^\]]+)\]/),
          contentLength: lastMessage.content?.length,
          fullMessage: lastMessage,
        });
      }
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
      }
    } else if (!isLoading) {
      setIsStreaming(false);
    }

    // Hide skeleton when we have messages and are not in initial loading
    if (messages.length > 0 && showSkeleton) {
      setShowSkeleton(false);
    }
  }, [messages, onMessagesUpdate, isLoading, showSkeleton]);

  const handleCtaClick = (ctaText: string) => {
    // Redirect based on CTA button text
    switch (ctaText) {
      case "Start Teaching Business":
        window.location.href = "/teaching-business";
        break;
      case "Build Passive Income":
        window.location.href = "/passive-income";
        break;
      case "Explore Career Change":
        window.location.href = "/career-change";
        break;
      default:
        // Fallback to mentor page
        window.location.href = "/mentor";
    }
  };

  // Show skeleton until AI is ready to stream
  if (showSkeleton && messages.length === 0) {
    return <ChatSkeleton />;
  }

  return (
    <div className="max-w-full flex flex-col h-[calc(100vh-200px)] mx-auto">
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

            // Debug logging for CTA detection
            if (m.role === "assistant") {
              console.log(`🔍 Message ${i} CTA Debug:`, {
                messageId: m.id,
                content: m.content,
                hasCTAPattern: m.content?.includes("[CTA_BUTTON:"),
                ctaMatch: m.content?.match(/\[CTA_BUTTON:([^\]]+)\]/),
                contentLength: m.content?.length,
              });
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
                          onClick={() => handleCtaClick(ctaMatch[1])}
                          className="bg-[#E4EDFF] hover:cursor-pointer hover:bg-[#E4EDFF] text-[#02133B] font-semibold px-6 py-2 rounded-[12px] transition-all duration-200 hover:border-[#02133B]/40"
                        >
                          {ctaMatch[1]}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}

                    {/* Debug logging for CTA button display */}
                    {m.role === "assistant" && (
                      <div className="text-xs text-gray-400 ml-4">
                        CTA Debug: hasCTA={hasCTA.toString()}, ctaMatch=
                        {ctaMatch ? ctaMatch[1] : "null"}
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
