"use client";

import Hero from "../hero";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Message } from "ai/react";
import StepChat from "./step-chat";
import Chat from "./chat";
import { MessageSquare } from "lucide-react";

export default function Mentor() {
  const [showHero, setShowHero] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');

  const handleStepComplete = (allMessages: Message[], recommendationText: string) => {
    setConversationHistory(allMessages);
    setRecommendation(recommendationText);
    setShowHero(false);
    setShowChat(true);
  };
  console.log(conversationHistory);
  console.log(recommendation);
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
        <StepChat onComplete={handleStepComplete} showHero={setShowHero} />
      )}
      {/* Chat */}
      {showChat && (
        <Chat 
          conversationHistory={conversationHistory} 
          recommendation={recommendation} 
        />
      )}
    </div>
  );
}