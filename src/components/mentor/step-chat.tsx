"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, Message } from "ai/react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from 'lucide-react';
import Image from "next/image";

interface StepChatProps {
  onComplete?: (messages: Message[], recommendation: string) => void;
  showHero?: (show: boolean) => void;
  chatId?: string;
  initialMessages?: Message[];
}

const TOTAL_QUESTIONS = 8;

export default function StepChat({ onComplete, showHero, chatId, initialMessages = [] }: StepChatProps) {
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);


  
  // Function to count current user answers (matching backend logic)
  const getCurrentUserAnswerCount = (currentMessages: any[]) => {
    return currentMessages.filter((m, i) => {
      if (m.role !== "user") return false;
      // Skip first empty message if it exists (matching backend logic)
      if (i === 0 && (!m.content || m.content.trim() === "")) return false;
      return m.content && m.content.trim() !== "";
    }).length;
  };

  const {
    messages,
    append,
    isLoading,
  } = useChat({ 
    api: "/api/chat",
    id: chatId, // Use provided chatId for persistence
    initialMessages, // Load existing messages if resuming
    sendExtraMessageFields: true, // Send id and createdAt for each message
    onFinish: (message) => {
      console.log(`🤖 AI response received: ${message.content.length} chars, Question: ${message.content.trim().endsWith('?')}`);
      // Don't process completion here - let useEffect handle it after messages array is updated
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Only start new conversation if no initial messages provided
    if (messages.length === 0 && initialMessages.length === 0) {
      append({ role: "user", content: "" });
    }
  }, []);

  // Calculate userAnswers using the same logic as getCurrentUserAnswerCount for consistency
  const userAnswers = messages.filter((m, i) => {
    if (m.role !== "user") return false;
    // Skip first empty message if it exists (matching backend logic)
    if (i === 0 && (!m.content || m.content.trim() === "")) return false;
    return m.content && m.content.trim() !== "";
  });
  const progress = Math.min(userAnswers.length, TOTAL_QUESTIONS);

  // Keep these for the fallback timeout effect
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const lastAIMessage = assistantMessages[assistantMessages.length - 1];

  const handleCompletion = (recommendationText: string) => {
    if (hasCompleted) return;
    
    const filteredMessages = messages.filter((m, i) => {
      // Only filter out first empty message if we're starting a new chat
      if (initialMessages.length > 0) {
        return true; // Show all messages when resuming
      }
      return !(i === 0 && m.role === "user" && m.content === "");
    });
    
    setHasCompleted(true);
    if (onComplete) {
      onComplete(filteredMessages, recommendationText);
    }
  };

  useEffect(() => {
    // Count user answers accurately after messages array is updated
    const actualUserAnswers = getCurrentUserAnswerCount(messages);
    const lastMessage = messages[messages.length - 1];
    
    console.log(`📊 useEffect check: ${actualUserAnswers}/${TOTAL_QUESTIONS} user answers, last message: ${lastMessage?.role}, loading: ${isLoading}`);
    
    // Show loader when user has answered exactly 8 questions
    if (actualUserAnswers === TOTAL_QUESTIONS && lastMessage?.role === "user" && !showLoader) {
      console.log(`✅ User completed ${actualUserAnswers}/${TOTAL_QUESTIONS} questions, showing loader...`);
      setShowLoader(true);
    }
    
    // Check for recommendation after AI responds to 8th question
    // The backend system prompt ensures that after 8 user responses, the AI gives the final recommendation
    // So we can trust that any non-question response after 8 answers is the recommendation
    if (
      actualUserAnswers === TOTAL_QUESTIONS &&
      lastMessage?.role === "assistant" &&
      lastMessage?.content &&
      !lastMessage.content.trim().endsWith("?") &&
      lastMessage.content.length > 50 &&
      !hasCompleted &&
      !isLoading
    ) {
      console.log(`🎯 Final recommendation detected with ${actualUserAnswers} user answers, completing...`);
      handleCompletion(lastMessage.content);
    }
  }, [
    messages,
    isLoading,
    hasCompleted,
    showLoader,
  ]);

  // Fallback: If we're stuck on loader for too long, force completion
  useEffect(() => {
    if (showLoader && !hasCompleted) {
      const timeout = setTimeout(() => {
        const actualUserAnswers = getCurrentUserAnswerCount(messages);
        // Only force completion if we actually have 8 user answers
        if (actualUserAnswers === TOTAL_QUESTIONS) {
          console.log(`⚠️ Loader timeout - forcing completion with ${actualUserAnswers}/${TOTAL_QUESTIONS} answers`);
          const recommendation = lastAIMessage?.content || 'Based on your responses, I will help you create a personalized learning plan.';
          
          const filteredMessages = messages.filter((m, i) => {
            if (initialMessages.length > 0) {
              return true;
            }
            return !(i === 0 && m.role === "user" && m.content === "");
          });
          
          setHasCompleted(true);
          if (onComplete) {
            onComplete(filteredMessages, recommendation);
          }
        } else {
          console.log(`⚠️ Loader timeout but only ${actualUserAnswers}/${TOTAL_QUESTIONS} answers - not completing`);
        }
      }, 15000); // 15 second timeout (increased for safety)

      return () => clearTimeout(timeout);
    }
  }, [showLoader, hasCompleted, lastAIMessage, messages, initialMessages, onComplete]);

  // Move showHero call to useEffect to avoid setState during render
  useEffect(() => {
    if (showLoader && showHero) {
      showHero(false);
    }
  }, [showLoader, showHero]);

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img src={"/waiting-logo.png"} alt="Teachers Academy" />
        <h2 className="mt-[32px] text-[25px] font-bold text-[#02133B]">Crafting Your Personalized Plan</h2>
        <p className="mt-[32px] text-[16px] text-[#02133B]">This will just take a moment...</p>
      </div>
    );
  }

  return (
    <Card className="max-w-[800px] mx-auto mb-[32px] p-[24px]">
      <div className="w-full">
        <div className="text-center font-bold text-[25px] text-[#02133B] mb-2">
          {progress >= TOTAL_QUESTIONS ? 'Questions Complete!' : 'Choose Your Starting Point'}
        </div>
        <div className="text-center text-sm text-[#02133B]/70 mb-2">
          {progress >= TOTAL_QUESTIONS 
            ? `All ${TOTAL_QUESTIONS} questions answered! Creating your plan...` 
            : `Question ${userAnswers.length + 1} of ${TOTAL_QUESTIONS} • Progress: ${progress}/${TOTAL_QUESTIONS}`
          }
        </div>
        <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-1.5 bg-[#02133B] rounded-full transition-all duration-300"
            style={{ width: `${(progress / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>
      <CardContent className="p-0">
        <div
          className="flex flex-col gap-4 py-2 min-h-[120px] max-h-[446px] overflow-y-auto scroll-smooth"
        >
          {messages
            .filter((m, i) => {
              // Only filter out the first empty message if we're starting a new chat
              // Don't filter when resuming from existing chat (initialMessages.length > 0)
              if (initialMessages.length > 0) {
                return true; // Show all messages when resuming
              }
              return !(i === 0 && m.role === "user" && m.content === "");
            })
            .map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="self-start ml-8">
                  <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tr-[12px] text-base font-medium">
                    {m.content}
                  </span>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                    <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} />
                  <span className="text-base text-black font-normal bg-transparent">
                    {m.content}
                  </span>
                </div>
              )
            )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!answer.trim() || isLoading) return;
            
            // Prevent submission if we already have 8 answers (allow submitting the 8th answer)
            const currentCount = getCurrentUserAnswerCount(messages);
            if (currentCount >= TOTAL_QUESTIONS) {
              console.log('⚠️ Attempted to submit more than 8 answers - blocked');
              return;
            }
            
            console.log(`📝 Submitting answer ${currentCount + 1}/${TOTAL_QUESTIONS}: "${answer.substring(0, 30)}..."`);
            
            await append({ role: "user", content: answer });
            setAnswer("");
            inputRef.current?.focus();
          }}
          className="mt-4"
        >
          <div className={`border rounded-xl flex items-center px-2 py-1 transition-all ${
            userAnswers.length >= TOTAL_QUESTIONS 
              ? 'bg-gray-100 border-gray-300' 
              : 'bg-white focus-within:ring-1 focus-within:ring-[#02133B]'
          }`}>
                      <Textarea
            ref={inputRef}
            id="answer"
            className="resize-none min-h-[40px] border-0 focus:outline-none shadow-none flex-1 text-base"
            placeholder={userAnswers.length >= TOTAL_QUESTIONS ? "All questions completed!" : `Question ${userAnswers.length + 1} of ${TOTAL_QUESTIONS}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={280}
            disabled={isLoading || userAnswers.length >= TOTAL_QUESTIONS}
            style={{ boxShadow: 'none' }}
          />
          <Button
            type="submit"
            size="icon"
            className="ml-2 rounded-full bg-transparent text-[#02133B]"
            disabled={isLoading || !answer.trim() || userAnswers.length >= TOTAL_QUESTIONS}
          >
            <Send className="w-5 h-5 text-[#02133B]" />
          </Button>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{answer.length}/280</span>
            <span>
              {userAnswers.length >= TOTAL_QUESTIONS 
                ? "Waiting for recommendation..." 
                : "ESC or Click to cancel"
              }
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}