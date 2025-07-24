"use client";

import { useChat, Message } from "ai/react";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, Send } from "lucide-react";
import Image from "next/image";

interface ChatProps {
  conversationHistory?: Message[];
  recommendation?: string;
  chatId?: string;
}

export default function Chat({
  conversationHistory = [],
  recommendation,
  chatId,
}: ChatProps) {
  const [displayedRecommendation, setDisplayedRecommendation] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showRecommendation, setShowRecommendation] = useState(true);
  const [ctaButton, setCtaButton] = useState<string | null>(null);
  const [cleanRecommendation, setCleanRecommendation] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      id: chatId, // Use chatId for persistence
      initialMessages: conversationHistory,
    });

  useEffect(() => {
    if (!recommendation) return;

    const ctaMatch = recommendation.match(/\[CTA_BUTTON:([^\]]+)\]/);
    if (ctaMatch) {
      setCtaButton(ctaMatch[1]);
      const cleaned = recommendation
        .replace(/\[CTA_BUTTON:[^\]]+\]\s*/, "")
        .trim();
      setCleanRecommendation(cleaned);
    } else {
      setCtaButton(null);
      setCleanRecommendation(recommendation.trim());
    }
  }, [recommendation]);

  useEffect(() => {
    if (!cleanRecommendation || !showRecommendation) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setDisplayedRecommendation("");
    setIsTyping(true);

    let index = 0;
    const typeSpeed = 30;

    const typeWriter = () => {
      if (index < cleanRecommendation.length) {
        setDisplayedRecommendation(cleanRecommendation.slice(0, index + 1));
        index++;
        typingTimeoutRef.current = setTimeout(typeWriter, typeSpeed);
      } else {
        setIsTyping(false);
      }
    };

    setTimeout(typeWriter, 50);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [cleanRecommendation, showRecommendation]);

  const newMessages = messages.slice(conversationHistory.length);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedRecommendation, newMessages, isLoading]);
  const handleCtaClick = () => {
    // Check the recommendation text to determine which path was recommended
    const recommendationLower = cleanRecommendation.toLowerCase();
    
    if (recommendationLower.includes("passive income")) {
      window.location.href = "/passive-income";
    } else if (recommendationLower.includes("career change")) {
      window.location.href = "/career-change";
    } else if (recommendationLower.includes("teaching business")) {
      window.location.href = "/teaching";
    } else {
      // Default fallback - could be improved based on button text
      window.location.href = "/mentor";
    }
  };

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-200px)] mx-auto mt-10">
      <div className="flex flex-col gap-4 py-2 flex-1 overflow-y-auto scroll-smooth">
        {showRecommendation && cleanRecommendation && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} />
              <span className="text-base text-[#02133B] font-normal bg-transparent">
                {displayedRecommendation}
              </span>
            </div>

            {!isTyping && ctaButton && (
              <div className="flex justify-start ml-4">
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
        )}

        {newMessages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="self-end mr-8">
              <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tl-[12px] text-base font-medium">
                {m.content}
              </span>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} className="mt-1"/>
              <span className="text-base text-[#02133B] font-normal bg-transparent">
                {m.content}
              </span>
            </div>
          )
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
