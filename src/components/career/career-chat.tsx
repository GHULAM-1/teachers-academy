"use client";

// Extend Window interface for global flags
declare global {
  interface Window {
    isNewCareerChat?: boolean;
  }
}

import { useChat, Message } from "ai/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import Image from "next/image";
import { CareerMessage } from "@/lib/career-chat-store";
import { useCareerChatSaveDialog } from "@/hooks/use-career-chat-save-dialog";
import SaveCareerChatDialog from "./save-career-chat-dialog";
import { TTSPlayer } from "@/components/tts-player";

interface CareerChatProps {
  chatId: string;
  initialStep?: string;
  initialMessages?: Message[];
}

const STEPS = [
  { id: 'discover', name: 'Discover', description: 'Explore potential career paths' },
  { id: 'commit', name: 'Commit', description: 'Commit with confidence to your selected career path' },
  { id: 'create', name: 'Create Materials', description: 'Build professional materials' },
  { id: 'make', name: 'Make the Leap', description: 'Create action plan' }
];

export default function CareerChat({ chatId, initialStep = 'discover', initialMessages = [] }: CareerChatProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loadingStep, setLoadingStep] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<CareerMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const currentStepInfo = STEPS[currentStepIndex];

  // Determine if chat has been started
  const hasChatStarted = currentMessages.length > 0;
  const shouldShowSaveDialog = hasChatStarted && !!chatId;

  // Use career chat save dialog hook
  const { showSaveDialog, handleSaveChoice, triggerSaveDialog } = useCareerChatSaveDialog(
    chatId,
    shouldShowSaveDialog
  );

  // Use chat hook for current step
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: "/api/career",
    id: chatId,
    body: {
      step: currentStep
    },
    initialMessages: initialMessages,
    onFinish: (message) => {
      // Check if the new message has a different step
      const messageWithStep = message as any;
      console.log('🎯 onFinish callback:', { 
        messageStep: messageWithStep.step, 
        currentStep, 
        hasStep: !!messageWithStep.step,
        messageContent: messageWithStep.content?.substring(0, 50) + '...'
      });
      
      if (messageWithStep.step && messageWithStep.step !== currentStep) {
        console.log(`🔄 Step changed from ${currentStep} to ${messageWithStep.step}`);
        setCurrentStep(messageWithStep.step);
        router.replace(`/career-change/chat/${messageWithStep.step}?chatId=${chatId}`);
      }
    }
  });

  // Check for step changes by fetching latest messages from database
  useEffect(() => {
    const checkForStepChanges = async () => {
      try {
        const response = await fetch(`/api/career/check-step?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.currentStep && data.currentStep !== currentStep) {
            console.log(`🔄 Step change detected via API: ${currentStep} → ${data.currentStep}`);
            setCurrentStep(data.currentStep);
            router.replace(`/career-change/chat/${data.currentStep}?chatId=${chatId}`);
          }
        }
      } catch (error) {
        console.error('Error checking step changes:', error);
      }
    };

    // Check for step changes after each message
    if (messages.length > 0) {
      checkForStepChanges();
    }
  }, [messages.length, chatId, currentStep, router]);

  // Update current messages when they change
  const handleMessagesUpdate = useCallback((messages: any[]) => {
    console.log('💬 Career messages updated. Total:', messages.length);
    setCurrentMessages(messages as any);
    
    // Check if any message has a different step than current
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1] as any;
      console.log('🔍 Last message step check:', { 
        lastMessageStep: lastMessage.step, 
        currentStep, 
        hasStep: !!lastMessage.step 
      });
      
      if (lastMessage.step && lastMessage.step !== currentStep) {
        console.log(`🔄 Step changed from ${currentStep} to ${lastMessage.step}`);
        setCurrentStep(lastMessage.step);
        router.replace(`/career-change/chat/${lastMessage.step}?chatId=${chatId}`);
      }
    }
  }, [currentStep, chatId, router]);

  // Listen for custom save dialog events from sidebar
  useEffect(() => {
    const handleShowSaveDialog = (event: CustomEvent) => {
      if (hasChatStarted && chatId) {
        console.log('📡 Received showSaveDialog event for career chat');
        const intendedUrl = event.detail?.intendedUrl;
        console.log('🎯 Intended navigation:', intendedUrl);
        triggerSaveDialog(intendedUrl);
      } else {
        console.log('❌ Career dialog not shown - conditions not met, allowing navigation');
      }
    };

    window.addEventListener('showSaveDialog', handleShowSaveDialog as EventListener);

    return () => {
      window.removeEventListener('showSaveDialog', handleShowSaveDialog as EventListener);
    };
  }, [hasChatStarted, chatId, triggerSaveDialog]);

  // Set a global flag for the sidebar to know if we're in a new career chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).isNewCareerChat = hasChatStarted && !!chatId;
    }

    // Cleanup: clear the flag when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).isNewCareerChat = false;
      }
    };
  }, [hasChatStarted, chatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Convert initial messages to current messages format when they change
  useEffect(() => {
    if (initialMessages.length > 0) {
      console.log(`📚 Received ${initialMessages.length} initial messages for step ${currentStep}`);
      setCurrentMessages(initialMessages as any);
    }
  }, [initialMessages, currentStep]);

  // Update current messages when chat messages change
  useEffect(() => {
    handleMessagesUpdate(messages);
  }, [messages, handleMessagesUpdate]);

  // Step transitions are now handled automatically by the AI
  // No manual navigation needed

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
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  index <= currentStepIndex
                    ? 'bg-[#02133B] text-white border-[#02133B]'
                    : 'bg-white text-[#02133B]/50 border-[#02133B]/20'
                }`}
              >
                {index + 1}
              </div>
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
      <div className="flex items-center justify-center mb-6">
        {/* <Button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button> */}

        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#02133B]">
            {currentStepInfo.name}
          </h2>
          <p className="text-sm text-[#02133B]/70">
            {currentStepInfo.description}
          </p>
        </div>

        {/* <Button
          onClick={handleNextStep}
          disabled={currentStepIndex === STEPS.length - 1}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <span>Next Step</span>
          <ChevronRight className="w-4 h-4" />
        </Button> */}
      </div>
      {/* Chat Area */}
      <div className="bg-white rounded-lg border border-[#02133B]/20 p-6">
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {loadingStep ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[#02133B]/50">
                  Loading step messages...
                </div>
              </div>
            ) : messages.filter(msg => !(msg.role === 'user' && 
              (msg.content === 'start' || 
               msg.content === 'begin' || 
               msg.content?.trim() === ''))).length === 0 ? (
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
                        <div className="flex flex-col gap-2">
                          <div className="text-base text-[#02133B] font-normal bg-transparent whitespace-pre-wrap">
                            {message.content && typeof message.content === 'string' 
                              ? message.content.replace('AUDIO_MESSAGE', '').trim()
                              : message.content
                            }
                          </div>
                          {/* Show TTS player if this is a voice recording response */}
                          {(message as any).hasVoiceRecording || 
                           (message.content && 
                            typeof message.content === 'string' && 
                            message.content.includes('AUDIO_MESSAGE')) && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Voice recording available:</div>
                              <TTSPlayer 
                                text={message.content.replace('AUDIO_MESSAGE', '').trim()} 
                                voice="nova"
                                className="text-sm"
                              />
                            </div>
                          )}
                          
                          {/* Show mindset tools if detected */}
                          {(message as any).hasMindsetTools && (message as any).mindsetTools && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs text-gray-500 mb-2">Mindset tools available:</div>
                              {(message as any).mindsetTools.map((tool: any, index: number) => (
                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="font-medium text-blue-900 mb-1">{tool.name}</div>
                                  <div className="text-sm text-blue-700 mb-2">{tool.description}</div>
                                  <div className="text-xs text-blue-600 mb-2">Format: {tool.format}</div>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{tool.prompt}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Debug: Show detection logic */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-400 mt-1">
                              isVoiceRecording: {(message as any).hasVoiceRecording || 
                               (message.content && 
                                typeof message.content === 'string' && 
                                message.content.includes('AUDIO_MESSAGE')) ? 'true' : 'false'}
                            </div>
                          )}
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



      {/* Save Career Chat Dialog */}
      <SaveCareerChatDialog
        isOpen={showSaveDialog}
        onSave={() => handleSaveChoice(true)}
        onDiscard={() => handleSaveChoice(false)}
        chatId={chatId}
      />
    </div>
  );
} 