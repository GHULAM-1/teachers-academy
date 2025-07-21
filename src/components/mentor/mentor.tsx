"use client";

import Hero from "../hero";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Message } from "ai/react";
import StepChat from "./step-chat";
import Chat from "./chat";
import { MessageSquare } from "lucide-react";

interface MentorProps {
  chatId?: string;
  initialMessages?: Message[];
}

export default function Mentor({ chatId, initialMessages = [] }: MentorProps) {
  const [showHero, setShowHero] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [initialStepChatMessages, setInitialStepChatMessages] = useState<Message[]>([]);
  const [hasResumedState, setHasResumedState] = useState(false);

  // Analyze initial messages to determine state
  useEffect(() => {
    if (initialMessages.length > 0 && !hasResumedState) {
      setHasResumedState(true);
      
      // Count assistant messages that end with "?" (questions)
      const assistantQuestions = initialMessages
        .filter(m => m.role === 'assistant')
        .filter(m => m.content.trim().endsWith('?'));
      
      const questionsAnswered = assistantQuestions.length;
      
      // Check if we have a final recommendation (8th question answered)
      const lastAssistantMessage = initialMessages
        .filter(m => m.role === 'assistant')
        .pop();
      
      const hasFinalRecommendation = questionsAnswered >= 8 && 
        lastAssistantMessage && 
        !lastAssistantMessage.content.trim().endsWith('?');
      
      if (hasFinalRecommendation) {
        // User completed all 8 questions, show final chat
        setConversationHistory(initialMessages);
        setRecommendation(lastAssistantMessage?.content || '');
        setShowHero(false);
        setShowChat(true);
      } else {
        // User hasn't completed all questions, continue with StepChat
        setInitialStepChatMessages(initialMessages);
        setShowHero(false);
        // showChat remains false, so StepChat will be shown
      }
    }
  }, [initialMessages, hasResumedState]);

  const handleStepComplete = (allMessages: Message[], recommendationText: string) => {
    setConversationHistory(allMessages);
    setRecommendation(recommendationText);
    setShowHero(false);
    setShowChat(true);
  };
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
          onComplete={handleStepComplete} 
          showHero={setShowHero}
          chatId={chatId}
          initialMessages={initialStepChatMessages}
        />
      )}
      {/* Chat */}
      {showChat && (
        <Chat 
          conversationHistory={conversationHistory} 
          recommendation={recommendation}
          chatId={chatId}
        />
      )}
    </div>
  );
}