"use client";

import { useChat, Message } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Send } from "lucide-react";
import Image from "next/image";

interface PersistentChatProps {
  id: string;
  initialMessages: Message[];
}

/**
 * Persistent Chat Component following AI SDK pattern
 * https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 */
export default function PersistentChat({
  id,
  initialMessages,
}: PersistentChatProps) {
  const [ctaButton, setCtaButton] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Following AI SDK pattern: useChat with id and initialMessages
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      id, // Chat ID for persistence
      initialMessages, // Load existing messages
      sendExtraMessageFields: true, // Send id and createdAt for each message
      onFinish: () => {
        // Trigger sidebar refresh when a message is sent and processed
        // Add small delay to ensure database operations complete
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chatUpdated'));
        }, 500);
      },
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Trigger sidebar refresh when a new chat is loaded
  useEffect(() => {
    // If this is a new chat (no initial messages), trigger chat created event
    if (initialMessages.length === 0) {
      window.dispatchEvent(new CustomEvent('chatCreated'));
    }
  }, [id, initialMessages.length]);

  // Check for CTA buttons in AI responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      const ctaMatch = lastMessage.content.match(/\[CTA_BUTTON:([^\]]+)\]/);
      if (ctaMatch) {
        setCtaButton(ctaMatch[1]);
      }
    }
  }, [messages]);

  const handleCtaClick = () => {
    if (ctaButton === "Build Your Course") {
      window.location.href = "/build-course";
    } else if (ctaButton === "Chart Your Career Path") {
      window.location.href = "/career";
    } else if (ctaButton === "Go Independent") {
      window.location.href = "/independent";
    }
  };

  // Clean message content by removing CTA button markup
  const cleanContent = (content: string) => {
    return content.replace(/\[CTA_BUTTON:[^\]]+\]\s*/, "").trim();
  };

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-200px)] mx-auto mt-10">
      <div className="flex flex-col gap-4 py-2 flex-1 overflow-y-auto scroll-smooth">
        {messages.map((message, i) =>
          message.role === "user" ? (
            <div key={message.id || i} className="self-end mr-8">
              <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tl-[12px] text-base font-medium">
                {message.content}
              </span>
            </div>
          ) : (
            <div key={message.id || i} className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Image 
                  src="/logo1.png" 
                  alt="AI Avatar" 
                  width={24} 
                  height={24} 
                  className="mt-1"
                />
                <span className="text-base text-[#02133B] font-normal bg-transparent">
                  {cleanContent(message.content)}
                </span>
              </div>
              
              {/* Show CTA button if this message contains one */}
              {message.content.includes('[CTA_BUTTON:') && (
                <div className="flex justify-start ml-8">
                  <Button
                    onClick={handleCtaClick}
                    className="bg-[#E4EDFF] hover:cursor-pointer hover:bg-[#E4EDFF] text-[#02133B] font-semibold px-6 py-2 rounded-[12px] transition-all duration-200 hover:border-[#02133B]/40"
                  >
                    {ctaButton}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )
        )}

        {isLoading && (
          <div className="flex items-start gap-2">
            <Image 
              src="/logo1.png" 
              alt="AI Avatar" 
              width={24} 
              height={24} 
              className="mt-1"
            />
            <span className="text-base text-[#02133B] font-normal bg-transparent">
              Thinking...
            </span>
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