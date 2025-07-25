"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Send, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { CareerMessage, getCareerChatStepMessages } from "@/lib/career-chat-store";

interface CareerChatProps {
  chatId: string;
  initialStep?: string;
}

const STEPS = [
  { id: 'discover', name: 'Discover', description: 'Explore potential career paths' },
  { id: 'compare', name: 'Compare', description: 'Compare career options' },
  { id: 'create', name: 'Create Materials', description: 'Build professional materials' },
  { id: 'make', name: 'Make the Leap', description: 'Create action plan' }
];

export default function CareerChat({ chatId, initialStep = 'discover' }: CareerChatProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loadingStep, setLoadingStep] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const currentStepInfo = STEPS[currentStepIndex];

  // Use chat hook for current step
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: "/api/career",
    id: chatId,
    body: {
      step: currentStep
    },
    initialMessages: [],
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages for the current step
  useEffect(() => {
    let isMounted = true;
    
    const loadStepMessages = async () => {
      if (!isMounted) return;
      
      setLoadingStep(true);
      try {
        const messages = await getCareerChatStepMessages(chatId, currentStep);
        if (isMounted) {
          setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load step messages:', error);
        if (isMounted) {
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setLoadingStep(false);
        }
      }
    };

    loadStepMessages();
    
    return () => {
      isMounted = false;
    };
  }, [currentStep, chatId, setMessages]);

  const handleStepChange = (newStep: string) => {
    if (newStep !== currentStep) {
      setCurrentStep(newStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      handleStepChange(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      handleStepChange(STEPS[currentStepIndex + 1].id);
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleStartPath = (jobId: string) => {
    // Handle starting a career path - for now, show confirmation
    alert(`Starting path for ${jobId}! This will transition to the next stage of the discovery process.`);
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#02133B]">Career Change Journey</h1>
          <div className="text-sm text-[#02133B]/70">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => handleStepChange(step.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  index <= currentStepIndex
                    ? 'bg-[#02133B] text-white border-[#02133B]'
                    : 'bg-white text-[#02133B]/50 border-[#02133B]/20'
                }`}
              >
                {index + 1}
              </button>
              <div className="ml-3 flex-1">
                <div className={`text-sm font-medium ${
                  index <= currentStepIndex ? 'text-[#02133B]' : 'text-[#02133B]/50'
                }`}>
                  {step.name}
                </div>
                <div className={`text-xs ${
                  index <= currentStepIndex ? 'text-[#02133B]/70' : 'text-[#02133B]/40'
                }`}>
                  {step.description}
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ml-4 ${
                  index < currentStepIndex ? 'bg-[#02133B]' : 'bg-[#02133B]/20'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#02133B]">
            {currentStepInfo.name}
          </h2>
          <p className="text-sm text-[#02133B]/70">
            {currentStepInfo.description}
          </p>
        </div>

        <Button
          onClick={handleNextStep}
          disabled={currentStepIndex === STEPS.length - 1}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <span>Next Step</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded-lg border border-[#02133B]/20 p-6">
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {loadingStep ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[#02133B]/50">Loading step messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-[#02133B]/50 mb-4">
                  Welcome to the {currentStepInfo.name} step!
                </div>
                <div className="text-sm text-[#02133B]/40 mb-6">
                  {currentStep === 'discover' 
                    ? "I'll ask you 8 questions to understand your preferences and match you with potential career paths."
                    : currentStepInfo.description
                  }
                </div>
                <Button
                  onClick={() => {
                    // Use the append function to send the start message
                    append({
                      role: 'user',
                      content: 'start'
                    });
                  }}
                  className="bg-[#02133B] text-white"
                >
                  {currentStep === 'discover' ? 'Begin Discovery' : `Start ${currentStepInfo.name} Step`}
                </Button>
              </div>
            ) : (
              messages
                .filter(message => !(message.role === 'user' && 
                  (message.content === 'start' || 
                   message.content === 'begin' || 
                   message.content?.trim() === '')))
                .map((message, index) => {

                return (
                  <div key={index} className="flex flex-col gap-4">
                    {message.role === "user" ? (
                      // User messages on the RIGHT side
                      <div className="flex justify-end">
                        <div className="mr-8 max-w-[70%]">
                          <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tl-[12px] text-base font-medium">
                            {message.content}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // AI messages on the LEFT side  
                      <div className="flex items-start gap-2 max-w-[80%]">
                        <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} className="mt-1 flex-shrink-0"/>
                        <div className="text-base text-[#02133B] font-normal bg-transparent whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleStepSubmit} className="border-t border-[#02133B]/10 pt-4">
            <div className="border rounded-xl flex items-center px-3 py-2 bg-white transition-shadow focus-within:ring-1 focus-within:ring-[#02133B]">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!input.trim() || isLoading) return;
                    handleStepSubmit(e as any);
                  }
                }}
                placeholder={currentStep === 'discover' 
                  ? "Share your thoughts or ask for clarification..." 
                  : `Ask about ${currentStepInfo.name.toLowerCase()}...`
                }
                className="resize-none min-h-[40px] border-0 focus:outline-none shadow-none flex-1 text-base"
                maxLength={500}
                disabled={isLoading}
                style={{ boxShadow: "none" }}
              />
              <Button
                type="submit"
                size="icon"
                className="ml-2 rounded-full bg-transparent text-[#02133B] hover:bg-[#E4EDFF]"
                disabled={isLoading || !input.trim()}
              >
                <Send className="w-5 h-5 text-[#02133B]" />
              </Button>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{input.length}/500</span>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 