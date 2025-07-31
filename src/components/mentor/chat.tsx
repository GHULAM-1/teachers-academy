"use client";

import { useChat, Message } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Send } from "lucide-react";
import Image from "next/image";

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
  
  // Let Vercel AI SDK handle everything - conversation history already contains messages from 1st recommendation onwards
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, reload } = useChat({
    api: stuckMode ? "/api/chat/stuck" : "/api/chat",
    id: chatId,
    initialMessages: [], // Don't use initialMessages here to avoid conflicts
  });

  // Add initial stuck message when in stuck mode
  useEffect(() => {
    if (stuckMode && messages.length === 0) {
      const initialMessage = {
        id: "stuck-init",
        role: "user" as const,
        content: "I'm feeling stuck in my career transition and need help getting unstuck. I've already chosen a career path but I'm struggling with the next steps.",
      };
      setMessages([initialMessage]);
    }
  }, [stuckMode, messages.length, setMessages]);

  // Trigger AI response after initial message is added
  useEffect(() => {
    if (stuckMode && messages.length === 1 && messages[0].role === 'user') {
      // Use reload to trigger AI response
      setTimeout(() => {
        reload();
      }, 200);
    }
  }, [stuckMode, messages, reload]);

  // Force set conversation history when it's provided (for existing chats)
  useEffect(() => {
    if (conversationHistory.length > 0 && messages.length === 0) {
      console.log('🔄 Chat: Setting conversation history from props:', conversationHistory.length);
      setMessages(conversationHistory);
    }
  }, [conversationHistory, messages.length, setMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notify parent of message changes
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
    
    // Check if streaming has started
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content && lastMessage.content.length > 0) {
        setIsStreaming(true);
      }
    } else if (!isLoading) {
      setIsStreaming(false);
    }
  }, [messages, onMessagesUpdate, isLoading]);

  const handleCtaClick = () => {
    // Check the recommendation text to determine which path was recommended
    const recommendationLower = (recommendation || '').toLowerCase();
    
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

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-200px)] mx-auto mt-10">
      <div className="flex flex-col gap-4 py-2 flex-1 overflow-y-auto scroll-smooth">
        
        {/* Show all messages - Vercel AI SDK handles streaming automatically */}
        {messages.map((m, i) => {
          // Clean CTA button text from message content for display
          const displayContent = m.role === 'assistant' && m.content?.includes('[CTA_BUTTON:') 
            ? m.content.replace(/\[CTA_BUTTON:[^\]]+\]\s*/, '').trim()
            : m.content;

          const hasCTA = m.role === 'assistant' && m.content?.includes('[CTA_BUTTON:');
          const ctaMatch = hasCTA ? m.content?.match(/\[CTA_BUTTON:([^\]]+)\]/) : null;

          return (
            <div key={i} className="flex flex-col gap-4">
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
                    <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} className="mt-1"/>
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

        {/* Show "..." when AI is not streaming */}
        {isLoading && !isStreaming && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} className="mt-1"/>
              <span className="text-base text-[#02133B] font-normal bg-transparent">
                <div className="flex space-x-1">
                  <div className="w-1 mt-1 h-1 bg-[#02133B] rounded-full animate-bounce"></div>
                  <div className="w-1 mt-1 h-1 bg-[#02133B] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 mt-1 h-1 bg-[#02133B] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="w-full px-4 mt-4">
        <div className="border rounded-xl flex items-center px-3 py-2 bg-white transition-shadow focus-within:ring-1 focus-within:ring-[#02133B]">
          <Textarea
            id="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || isLoading) return;
                
                // Trigger form submission
                const form = e.currentTarget.closest('form');
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
