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
import DownloadMaterialButton from "./download-material-button";
import InlineEditableMaterial from "./inline-editable-material";
import { Edit } from "lucide-react";
import ChatSkeleton from "@/components/ui/chat-skeleton";

interface CareerChatProps {
  chatId: string;
  initialStep?: string;
  initialMessages?: Message[];
}

const STEPS = [
  {
    id: "discover",
    name: "Discover",
    description: "Explore potential career paths",
  },
  {
    id: "create",
    name: "Create Materials",
    description: "Build professional materials",
  },
  {
    id: "apply",
    name: "Apply",
    description: "Apply to jobs and opportunities",
  },
];

export default function CareerChat({
  chatId,
  initialStep = "discover",
  initialMessages = [],
}: CareerChatProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loadingStep, setLoadingStep] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<CareerMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const currentStepInfo = STEPS[currentStepIndex] || STEPS[0]; // Fallback to first step if not found

  // Handle commit step - show discover UI
  const displayStepInfo = currentStep === "commit" ? STEPS[0] : currentStepInfo;

  // Determine if this is an EXISTING chat (loaded from database with initialMessages)
  // If initialMessages are provided as props, this is an existing chat being viewed
  const isExistingChat = initialMessages.length > 0;

  // Determine if chat has been started
  const hasChatStarted = currentMessages.length > 0;
  
  // Only show save dialog for NEW chats (not existing ones being viewed)
  // AND only when we have a valid chatId
  const shouldShowSaveDialog = hasChatStarted && !isExistingChat && !!chatId;

  // Use career chat save dialog hook
  const {
    showSaveDialog,
    handleSaveChoice,
    handleContinueChat,
    triggerSaveDialog,
  } = useCareerChatSaveDialog(chatId, shouldShowSaveDialog);

  // Use chat hook for current step
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/career",
    id: chatId,
    body: {
      step: currentStep,
    },
    initialMessages: [], // Don't use initialMessages here to avoid conflicts
    onFinish: (message) => {
      // Check if the new message has a different step
      const messageWithStep = message as any;
      console.log("🎯 onFinish callback:", {
        messageStep: messageWithStep.step, 
        currentStep, 
        hasStep: !!messageWithStep.step,
        messageContent: messageWithStep.content?.substring(0, 50) + "...",
      });
      
      if (messageWithStep.step && messageWithStep.step !== currentStep) {
        console.log(
          `🔄 Step changed from ${currentStep} to ${messageWithStep.step}`
        );
        setCurrentStep(messageWithStep.step);
        router.replace(
          `/career-change/chat/${messageWithStep.step}?chatId=${chatId}`
        );
      }
    },
  });

  // Debug chat ID
  useEffect(() => {
    console.log("💬 Career Chat component initialized with chatId:", chatId);
  }, [chatId]);

  // Add initial trigger message to start AI conversation
  useEffect(() => {
    console.log("🔍 Career Chat useEffect check:", {
      messagesLength: messages.length,
      hasStarted: hasStartedRef.current,
      chatId: chatId?.substring(0, 8) + "...",
    });

    if (messages.length === 0 && !hasStartedRef.current && !isLoading) {
      console.log('🚀 Career Chat: Auto-starting with "begin" message');
      hasStartedRef.current = true;

      // Check if there's already a "begin" message in the messages array
      const hasBeginMessage = messages.some((m) => m.content === "begin");
      if (!hasBeginMessage) {
        append({ role: "user", content: "begin" });
      } else {
        console.log('⚠️ "begin" message already exists, skipping...');
      }
    }
  }, [messages.length, chatId, isLoading, append]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle streaming and skeleton states
  useEffect(() => {
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
  }, [messages, isLoading, showSkeleton]);

  // Function to update a specific message content
  const updateMessageContent = (messageId: string, newContent: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    );
  };

  // Check for step changes by fetching latest messages from database
  useEffect(() => {
    const checkForStepChanges = async () => {
      try {
        const response = await fetch(`/api/career/check-step?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`🔍 Step check result:`, { 
            apiStep: data.currentStep, 
            currentStep, 
            isDifferent: data.currentStep !== currentStep,
          });
          if (data.currentStep && data.currentStep !== currentStep) {
            console.log(
              `🔄 Step change detected via API: ${currentStep} → ${data.currentStep}`
            );
            setCurrentStep(data.currentStep);
            router.replace(
              `/career-change/chat/${data.currentStep}?chatId=${chatId}`
            );
          }
        }
      } catch (error) {
        console.error("Error checking step changes:", error);
      }
    };

    // Check for step changes after each message
    if (messages.length > 0) {
      checkForStepChanges();
    }
  }, [messages.length, chatId, currentStep, router]);

  // Also check for step changes when isLoading changes (after AI response)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const checkForStepChanges = async () => {
        try {
          const response = await fetch(
            `/api/career/check-step?chatId=${chatId}`
          );
          if (response.ok) {
            const data = await response.json();
            console.log(`🔍 Post-response step check:`, { 
              apiStep: data.currentStep, 
              currentStep, 
              isDifferent: data.currentStep !== currentStep,
            });
            if (data.currentStep && data.currentStep !== currentStep) {
              console.log(
                `🔄 Step change detected after response: ${currentStep} → ${data.currentStep}`
              );
              setCurrentStep(data.currentStep);
              router.replace(
                `/career-change/chat/${data.currentStep}?chatId=${chatId}`
              );
            }
          }
        } catch (error) {
          console.error("Error checking step changes after response:", error);
        }
      };
      
      // Add a small delay to ensure the database has been updated
      setTimeout(checkForStepChanges, 500);
    }
  }, [isLoading, messages.length, chatId, currentStep, router]);

  // Update current messages when they change
  const handleMessagesUpdate = useCallback(
    (messages: any[]) => {
      console.log("💬 Career messages updated. Total:", messages.length);
    setCurrentMessages(messages as any);
    
    // Check if any message has a different step than current
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1] as any;
        console.log("🔍 Last message step check:", {
        lastMessageStep: lastMessage.step, 
        currentStep, 
          hasStep: !!lastMessage.step,
      });
      
      if (lastMessage.step && lastMessage.step !== currentStep) {
          console.log(
            `🔄 Step changed from ${currentStep} to ${lastMessage.step}`
          );
        setCurrentStep(lastMessage.step);
          router.replace(
            `/career-change/chat/${lastMessage.step}?chatId=${chatId}`
          );
        }
      }
    },
    [currentStep, chatId, router]
  );

  // Handle streaming state
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.content) {
        setIsStreaming(true);
      } else {
        setIsStreaming(false);
      }
    }
  }, [messages]);

  // Listen for custom save dialog events from sidebar
  useEffect(() => {
    const handleShowSaveDialog = (event: CustomEvent) => {
      if (hasChatStarted && !isExistingChat && chatId) {
        console.log("📡 Received showSaveDialog event for career chat");
        const intendedUrl = event.detail?.intendedUrl;
        console.log("🎯 Intended navigation:", intendedUrl);
        triggerSaveDialog(intendedUrl);
      } else {
        console.log(
          "❌ Career dialog not shown - conditions not met, allowing navigation"
        );
      }
    };

    window.addEventListener(
      "showSaveDialog",
      handleShowSaveDialog as EventListener
    );

    return () => {
      window.removeEventListener(
        "showSaveDialog",
        handleShowSaveDialog as EventListener
      );
    };
  }, [hasChatStarted, isExistingChat, chatId, triggerSaveDialog]);

  // Set a global flag for the sidebar to know if we're in a new career chat
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).isNewCareerChat = hasChatStarted && !isExistingChat && !!chatId;
    }

    // Cleanup: clear the flag when component unmounts
    return () => {
      if (typeof window !== "undefined") {
        (window as any).isNewCareerChat = false;
      }
    };
  }, [hasChatStarted, isExistingChat, chatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Force set initial messages when they are provided (for existing chats)
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      console.log(
        `🔄 CareerChat: Setting initial messages from props: ${initialMessages.length} for step ${currentStep}`
      );
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length, setMessages, currentStep]);

  // Convert initial messages to current messages format when they change
  useEffect(() => {
    if (initialMessages.length > 0) {
      console.log(
        `📚 Received ${initialMessages.length} initial messages for step ${currentStep}`
      );
      setCurrentMessages(initialMessages as any);
    }
  }, [initialMessages, currentStep]);

  // Update current messages when chat messages change
  useEffect(() => {
    handleMessagesUpdate(messages);
    
    // Check if streaming has started
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === "assistant" &&
        lastMessage.content &&
        lastMessage.content.length > 0
      ) {
        setIsStreaming(true);
      }
    } else if (!isLoading) {
      setIsStreaming(false);
    }
  }, [messages, handleMessagesUpdate, isLoading]);

  // Step transitions are now handled automatically by the AI
  // No manual navigation needed

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleStartPath = (jobId: string) => {
    // Handle starting a career path - for now, show confirmation
    alert(
      `Starting path for ${jobId}! This will transition to the next stage of the discovery process.`
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col h-[calc(100vh-80px)]">
      {/* Progress Bar - Fixed at top */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          {STEPS.map((step, index) => {
            // Determine if this step should be active
            const isActive =
              index <= currentStepIndex ||
              (currentStep === "commit" && step.id === "discover");
            
            return (
              <div
                key={step.id}
                className="flex items-center justify-center flex-1"
              >
                <div
                  className={`flex items-center justify-center  w-10 h-10 rounded-full border-2 transition-all ${
                    isActive
                      ? "bg-[#02133B] text-white border-[#02133B]"
                      : "bg-white text-[#02133B]/50 border-[#02133B]/20"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3 flex-1 max-w-[210px]">
                  <div
                    className={`text-sm font-medium ${
                      isActive ? "text-[#02133B]" : "text-[#02133B]/50"
                    }`}
                  >
                    {step.name}
                  </div>
                  <div
                    className={`text-xs ${
                      isActive ? "text-[#02133B]/70" : "text-[#02133B]/40"
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex items-center ml-4">
                    <div
                      className={`w-8 h-0.5 ${
                        isActive ? "bg-[#02133B]" : "bg-[#02133B]/20"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center mb-6 flex-shrink-0">
        {/* Navigation buttons removed for now */}
      </div>

      {/* Show skeleton until AI is ready to stream */}
      {showSkeleton &&
      messages.filter(
        (msg) =>
          !(
            msg.role === "user" &&
            (msg.content === "start" ||
              msg.content === "begin" ||
              msg.content?.trim() === "")
          )
      ).length === 0 ? (
        <ChatSkeleton />
      ) : (
        /* Chat Area */
        <div className="bg-white rounded-lg border border-[#02133B]/20 p-6 flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-300px)]">
          <div className="space-y-4">
            {messages
              .filter(
                (message) =>
                  !(
                    message.role === "user" &&
                    (message.content === "start" ||
                      message.content === "begin" ||
                      message.content?.trim() === "")
                  )
              )
                .map((message, index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-4 w-[80%] mx-auto"
                  >
                    {message.role === "user" ? (
                      // User messages on the RIGHT side
                      <div className="flex justify-end">
                        <div className="mr-8 ">
                          <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tl-[12px] text-base font-medium">
                            {message.content}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // AI messages on the LEFT side  
                      <div className="flex items-start gap-2">
                        <Image
                          src="/logo1.png"
                          alt="AI Avatar"
                          width={24}
                          height={24}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex flex-col gap-2">
                          {/* Show original message content only if it's not a material that we're displaying with the editable component */}
                          {(() => {
                            const content =
                              typeof message.content === "string"
                                ? message.content
                                : "";
                            const isMaterial =
                              content.includes("[RESUME]") ||
                              content.includes("[COVER_LETTER]") ||
                              content.includes("[LINKEDIN]") ||
                              content.includes("[OUTREACH]");
                            
                            // Don't show the original content if it's a material (we'll show it in the editable component)
                            if (isMaterial) {
                              return null;
                            }
                            
                            return (
                              <div className="text-base text-[#02133B] font-normal bg-transparent whitespace-pre-wrap">
                                {content.replace("AUDIO_MESSAGE", "").trim()}
                              </div>
                            );
                          })()}
                          
                          {/* Show download buttons for generated materials */}
                          {currentStep === "create" &&
                            message.role === "assistant" &&
                            message.content &&
                            (() => {
                              const content =
                                typeof message.content === "string"
                                  ? message.content
                                  : "";
                              
                              // Detect material type using the same identifiers as the API
                              let materialType:
                                | "resume"
                                | "cover_letter"
                                | "linkedin"
                                | "outreach"
                                | null = null;
                              if (content.includes("[RESUME]")) {
                                materialType = "resume";
                              } else if (content.includes("[COVER_LETTER]")) {
                                materialType = "cover_letter";
                              } else if (content.includes("[LINKEDIN]")) {
                                materialType = "linkedin";
                              } else if (content.includes("[OUTREACH]")) {
                                materialType = "outreach";
                              }
                              
                              return materialType ? (
                                <InlineEditableMaterial
                                  materialType={materialType}
                                  content={content}
                                  title={`${materialType
                                    .replace("_", " ")
                                    .toUpperCase()}`}
                                  onSave={(updatedContent) => {
                                    // Update the message content in the chat
                                    console.log(
                                      "Material updated:",
                                      updatedContent
                                    );
                                    updateMessageContent(
                                      message.id,
                                      updatedContent
                                    );
                                  }}
                                  onCancel={() => {
                                    console.log("Edit cancelled");
                                  }}
                                />
                              ) : null;
                            })()}
                          {/* Show TTS player if this is a voice recording response */}
                          {(message as any).hasVoiceRecording || 
                           (message.content && 
                              typeof message.content === "string" &&
                              message.content.includes("AUDIO_MESSAGE") && (
                            <div className="mt-2">
                                  <div className="text-xs text-gray-500 mb-1">
                                    Voice recording available:
                                  </div>
                              <TTSPlayer 
                                    text={message.content
                                      .replace("AUDIO_MESSAGE", "")
                                      .trim()}
                                voice="nova"
                                className="text-sm"
                              />
                            </div>
                              ))}
                          
                          {/* Show mindset tools if detected */}
                          {(message as any).hasMindsetTools &&
                            (message as any).mindsetTools && (
                            <div className="mt-3 space-y-2">
                                <div className="text-xs text-gray-500 mb-2">
                                  Mindset tools available:
                                </div>
                                {(message as any).mindsetTools.map(
                                  (tool: any, index: number) => (
                                    <div
                                      key={index}
                                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                                    >
                                      <div className="font-medium text-blue-900 mb-1">
                                        {tool.name}
                                      </div>
                                      <div className="text-sm text-blue-700 mb-2">
                                        {tool.description}
                                      </div>
                                      <div className="text-xs text-blue-600 mb-2">
                                        Format: {tool.format}
                                      </div>
                                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {tool.prompt}
                                      </div>
                                    </div>
                                  )
                                )}
                            </div>
                          )}
                          {/* Debug: Show detection logic */}
                          {process.env.NODE_ENV === "development" && (
                            <div className="text-xs text-gray-400 mt-1">
                              isVoiceRecording:{" "}
                              {(message as any).hasVoiceRecording ||
                               (message.content && 
                                typeof message.content === "string" &&
                                message.content.includes("AUDIO_MESSAGE"))
                                ? "true"
                                : "false"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            {/* Show "..." when AI is not streaming */}
            {isLoading && !isStreaming && (
              <div className="flex items-center gap-2 w-[80%] mx-auto">
                <Image
                  src="/logo1.png"
                  alt="AI Avatar"
                  width={24}
                  height={24}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex flex-col gap-2">
                  <div className="text-base text-[#02133B] font-normal bg-transparent">
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
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Form - Fixed at bottom */}
      <form
        onSubmit={handleStepSubmit}
        className="border-t border-[#02133B]/10 pt-4 w-[80%] mx-auto flex-shrink-0"
      >
            <div className="border rounded-xl flex items-center px-3 py-2 bg-white transition-shadow focus-within:ring-1 focus-within:ring-[#02133B]">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!input.trim() || isLoading) return;
                    handleStepSubmit(e as any);
                  }
                }}
            placeholder={
              currentStep === "discover"
                  ? "Share your thoughts or ask for clarification..." 
                  : `Ask about ${displayStepInfo.name.toLowerCase()}...`
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

      {/* Save Career Chat Dialog */}
      <SaveCareerChatDialog
        isOpen={showSaveDialog}
        onSave={() => handleSaveChoice(true)}
        onDiscard={() => handleSaveChoice(false)}
        onContinue={handleContinueChat}
        chatId={chatId}
      />
    </div>
  );
} 
