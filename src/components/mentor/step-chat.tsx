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
}

const TOTAL_QUESTIONS = 8;

export default function StepChat({ onComplete, showHero }: StepChatProps) {
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const {
    messages,
    append,
    isLoading,
  } = useChat({ 
    api: "/api/chat",
    onFinish: (message) => {
      if (isFinalRecommendation && !hasCompleted) {
        handleCompletion(message.content);
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      append({ role: "user", content: "" });
    }
  }, []);

  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const assistantQuestions = assistantMessages.filter(m => m.content.trim().endsWith("?"));
  const questionCount = assistantQuestions.length;
  const lastAIMessage = assistantMessages[assistantMessages.length - 1];

  const userMessages = messages.filter((m) => m.role === "user");
  const isAfter8thAnswer = questionCount === 8 && messages[messages.length - 1]?.role === "user";
  const isFinalRecommendation = questionCount === 8 && lastAIMessage && !lastAIMessage.content.trim().endsWith("?");

  const handleCompletion = (recommendationText: string) => {
    if (hasCompleted) return;
    
    const filteredMessages = messages.filter(
      (m, i) => !(i === 0 && m.role === "user" && m.content === "")
    );
    
    setHasCompleted(true);
    if (onComplete) {
      onComplete(filteredMessages, recommendationText);
    }
  };

  useEffect(() => {
    if (isAfter8thAnswer) setShowLoader(true);
    if (
      showLoader &&
      isFinalRecommendation &&
      !hasCompleted &&
      lastAIMessage &&
      lastAIMessage.content.trim() !== "" &&
      !isLoading 
    ) {
      handleCompletion(lastAIMessage.content);
    }
  }, [
    isAfter8thAnswer,
    showLoader,
    isFinalRecommendation,
    lastAIMessage,
    hasCompleted,
    messages,
    isLoading,
  ]);

  if (showLoader) {
    showHero && showHero(false);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img src={"/waiting-logo.png"} alt="Teachers Academy" />
        <h2 className="mt-[32px] text-[25px] font-bold text-[#02133B]">Crafting Your Personalized Plan</h2>
        <p className="mt-[32px] text-[16px] text-[#02133B]">This will just take a moment...</p>
      </div>
    );
  }

  const userAnswers = messages.filter(
    (m, i) => m.role === "user" && !(i === 0 && m.content === "")
  );
  const progress = Math.min(userAnswers.length, TOTAL_QUESTIONS);

  return (
    <Card className="max-w-[800px] mx-auto mb-[32px] p-[24px]">
      <div className="w-full">
        <div className="text-center font-bold text-[25px] text-[#02133B] mb-2">Choose Your Starting Point</div>
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
            .filter((m, i) => !(i === 0 && m.role === "user" && m.content === ""))
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
            await append({ role: "user", content: answer });
            setAnswer("");
            inputRef.current?.focus();
          }}
          className="mt-4"
        >
          <div className="border rounded-xl flex items-center px-2 py-1 bg-white transition-shadow focus-within:ring-1 focus-within:ring-[#02133B]">
            <Textarea
              ref={inputRef}
              id="answer"
              className="resize-none min-h-[40px] border-0 focus:outline-none shadow-none flex-1 text-base"
              placeholder="Send a message"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={280}
              disabled={isLoading}
              style={{ boxShadow: 'none' }}
            />
            <Button
              type="submit"
              size="icon"
              className="ml-2 rounded-full bg-transparent text-[#02133B]"
              disabled={isLoading || !answer.trim()}
            >
              <Send className="w-5 h-5 text-[#02133B]" />
            </Button>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{answer.length}/280</span>
            <span>ESC or Click to cancel</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}