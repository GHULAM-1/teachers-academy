// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useChat, Message } from "@ai-sdk/react";
// import {
//   Card,
//   CardHeader,
//   CardContent,
//   CardFooter,
// } from "@/components/ui/card";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Loader2, Send } from 'lucide-react';
// import Image from "next/image";

// interface StepChatProps {
//   onComplete?: (messages: Message[], recommendation: string) => void;
//   showHero?: (show: boolean) => void;
//   chatId?: string;
//   initialMessages?: Message[];
//   onMessagesUpdate?: (messages: Message[]) => void;
// }

// const TOTAL_QUESTIONS = 8;

// export default function StepChat({ onComplete, showHero, chatId, initialMessages = [], onMessagesUpdate }: StepChatProps) {
//   const [answer, setAnswer] = useState("");
//   const inputRef = useRef<HTMLTextAreaElement>(null);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [showLoader, setShowLoader] = useState(false);
//   const [hasCompleted, setHasCompleted] = useState(false);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const hasStartedRef = useRef(false);

//   console.log('🔄 StepChat component rendered:', { 
//     chatId: chatId?.substring(0, 8) + '...', 
//     initialMessagesCount: initialMessages.length,
//     hasStarted: hasStartedRef.current 
//   });


  
//   // Function to count current user answers (matching backend logic EXACTLY)
//   const getCurrentUserAnswerCount = (currentMessages: any[]) => {
//     return currentMessages.filter((m, i) => {
//       if (m.role !== "user") return false;
//       // Skip the initial trigger messages (matching backend logic EXACTLY)
//       if (i === 0 && (!m.content || m.content.trim() === "" || m.content.trim() === "start" || m.content.trim() === "begin")) return false;
//       return m.content && m.content.trim() !== "";
//     }).length;
//   };

//   const {
//     messages,
//     append,
//     isLoading,
//     error,
//     setMessages,
//   } = useChat({ 
//     maxSteps: 10,
//     api: "/api/chat",
//     id: chatId, // Use provided chatId for persistence
//     initialMessages: [], // Don't use initialMessages here to avoid conflicts
//     sendExtraMessageFields: true, // Send id and createdAt for each message
//     onFinish: (message) => {
//       console.log(`🤖 AI response received: ${message.content.length} chars, Question: ${message.content.trim().endsWith('?')}`);
//       // Don't process completion here - let useEffect handle it after messages array is updated
//     },
//     onError: (error) => {
//       console.error('🚨 useChat error:', error);
//       console.error('🚨 Error details:', JSON.stringify(error, null, 2));
//     }
//   });

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Notify parent of message changes
//   useEffect(() => {
//     if (onMessagesUpdate) {
//       onMessagesUpdate(messages);
//     }
    
//     // Check if streaming has started
//     if (isLoading && messages.length > 0) {
//       const lastMessage = messages[messages.length - 1];
//       if (lastMessage.role === 'assistant' && lastMessage.content && lastMessage.content.length > 0) {
//         setIsStreaming(true);
//       }
//     } else if (!isLoading) {
//       setIsStreaming(false);
//     }
//   }, [messages, onMessagesUpdate, isLoading]);

//   // Force set initial messages when they are provided (for existing chats)
//   useEffect(() => {
//     if (initialMessages.length > 0 && messages.length === 0) {
//       console.log('🔄 StepChat: Setting initial messages from props:', initialMessages.length);
//       setMessages(initialMessages);
//     }
//   }, [initialMessages, messages.length]);

//   useEffect(() => {
//     // Only start new conversation if no initial messages provided and we haven't started yet
//     if (messages.length === 0 && initialMessages.length === 0 && !hasStartedRef.current && !isLoading) {
//       console.log('🚀 StepChat: Auto-starting with "begin" message');
//       hasStartedRef.current = true;
//       append({ role: "user", content: "begin" });
//     }
//   }, [messages.length, initialMessages.length, isLoading]);

//   // Debug error state
//   useEffect(() => {
//     if (error) {
//       console.error('🚨 StepChat error state:', error);
//     }
//   }, [error]);

//   // Calculate userAnswers using the same logic as getCurrentUserAnswerCount for consistency
//   const userAnswers = messages.filter((m, i) => {
//     if (m.role !== "user") return false;
//     // Skip first trigger message if it exists (matching backend logic)
//     if (i === 0 && (!m.content || m.content.trim() === "" || m.content.trim() === "begin")) return false;
//     return m.content && m.content.trim() !== "";
//   });
//   const progress = Math.min(userAnswers.length, TOTAL_QUESTIONS);

//   // Keep these for the fallback timeout effect
//   const assistantMessages = messages.filter((m) => m.role === "assistant");
//   const lastAIMessage = assistantMessages[assistantMessages.length - 1];

//   const handleCompletion = (recommendationText: string) => {
//     if (hasCompleted) return;
    
//     const filteredMessages = messages.filter((m, i) => {
//       // Filter out ALL trigger messages (begin, start, empty) regardless of position
//       if (m.role === "user" && (
//         m.content === "" || 
//         m.content === "begin" || 
//         m.content === "start" ||
//         m.content?.trim() === ""
//       )) {
//         return false;
//       }
//       return true;
//     });
    
//     setHasCompleted(true);
//     if (onComplete) {
//       onComplete(filteredMessages, recommendationText);
//     }
//   };

//   useEffect(() => {
//     // Count user answers accurately after messages array is updated
//     const actualUserAnswers = getCurrentUserAnswerCount(messages);
//     const lastMessage = messages[messages.length - 1];
    
//     console.log(`📊 useEffect check: ${actualUserAnswers}/${TOTAL_QUESTIONS} user answers, last message: ${lastMessage?.role}, loading: ${isLoading}`);
//     console.log(`📋 All messages:`, messages.map((m, i) => `${i}: ${m.role} - "${m.content?.substring(0, 50)}..."`));
    
//     // Show loader when user has answered exactly 8 questions
//     if (actualUserAnswers === TOTAL_QUESTIONS && lastMessage?.role === "user" && !showLoader) {
//       console.log(`✅ User completed ${actualUserAnswers}/${TOTAL_QUESTIONS} questions, showing loader...`);
//       setShowLoader(true);
//     }
    
//     // Check for recommendation after AI responds to 8th question
//     // The backend system prompt ensures that after 8 user responses, the AI gives the final recommendation
//     // So we can trust that any non-question response after 8 answers is the recommendation
//     if (
//       actualUserAnswers === TOTAL_QUESTIONS &&
//       lastMessage?.role === "assistant" &&
//       lastMessage?.content &&
//       !lastMessage.content.trim().endsWith("?") &&
//       lastMessage.content.length > 50 &&
//       !hasCompleted &&
//       !isLoading
//     ) {
//       console.log(`🎯 Final recommendation detected with ${actualUserAnswers} user answers`);
//       console.log(`📄 Recommendation content:`, lastMessage.content);
//       console.log(`🔍 Has CTA_BUTTON:`, lastMessage.content.includes('[CTA_BUTTON:'));
//       handleCompletion(lastMessage.content);
//     }
//   }, [
//     messages,
//     isLoading,
//     hasCompleted,
//     showLoader,
//   ]);

//   // Fallback: If we're stuck on loader for too long, force completion
//   useEffect(() => {
//     if (showLoader && !hasCompleted) {
//       const timeout = setTimeout(() => {
//         const actualUserAnswers = getCurrentUserAnswerCount(messages);
//         // Only force completion if we actually have 8 user answers
//         if (actualUserAnswers === TOTAL_QUESTIONS) {
//           console.log(`⚠️ Loader timeout - forcing completion with ${actualUserAnswers}/${TOTAL_QUESTIONS} answers`);
//           const recommendation = lastAIMessage?.content || 'Based on your responses, I will help you create a personalized learning plan.';
          
//           const filteredMessages = messages.filter((m, i) => {
//             // Filter out ALL trigger messages (begin, start, empty) regardless of position
//             if (m.role === "user" && (
//               m.content === "" || 
//               m.content === "begin" || 
//               m.content === "start" ||
//               m.content?.trim() === ""
//             )) {
//               return false;
//             }
//             return true;
//           });
          
//           setHasCompleted(true);
//           if (onComplete) {
//             onComplete(filteredMessages, recommendation);
//           }
//         } else {
//           console.log(`⚠️ Loader timeout but only ${actualUserAnswers}/${TOTAL_QUESTIONS} answers - not completing`);
//         }
//       }, 15000); // 15 second timeout (increased for safety)

//       return () => clearTimeout(timeout);
//     }
//   }, [showLoader, hasCompleted, lastAIMessage, messages, initialMessages, onComplete]);

//   // Move showHero call to useEffect to avoid setState during render
//   useEffect(() => {
//     if (showLoader && showHero) {
//       showHero(false);
//     }
//   }, [showLoader, showHero]);

//   if (showLoader) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <img src={"/waiting-logo.png"} alt="Teachers Academy" />
//         <h2 className="mt-[32px] text-[25px] font-bold text-[#02133B]">Crafting Your Personalized Plan</h2>
//         <p className="mt-[32px] text-[16px] text-[#02133B]">This will just take a moment...</p>
//         {error && (
//           <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
//             Error: {error.message || 'Something went wrong'}
//           </div>
//         )}
//       </div>
//     );
//   }

//   return (
//     <Card className="max-w-[800px] mx-auto mb-[32px] p-[24px]">
//       <div className="w-full">
//         <div className="text-center font-bold text-[25px] text-[#02133B] mb-2">
//           {progress >= TOTAL_QUESTIONS ? 'Questions Complete!' : 'Choose Your Starting Point'}
//         </div>
//         <div className="text-center text-sm text-[#02133B]/70 mb-2">
//           {progress >= TOTAL_QUESTIONS 
//             ? `All ${TOTAL_QUESTIONS} questions answered! Creating your plan...` 
//             : `Question ${userAnswers.length + 1} of ${TOTAL_QUESTIONS}`
//           }
//         </div>
//         <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden mb-2">
//           <div
//             className="h-1.5 bg-[#02133B] rounded-full transition-all duration-300"
//             style={{ width: `${(progress / TOTAL_QUESTIONS) * 100}%` }}
//           />
//         </div>
//       </div>
//       <CardContent className="p-0">
//         <div
//           className="flex flex-col gap-4 py-2 min-h-[120px] max-h-[446px] overflow-y-auto scroll-smooth"
//         >
//           {messages
//             .filter((m, i) => {
//               // Filter out ALL trigger messages (begin, start, empty) regardless of position
//               if (m.role === "user" && (
//                 m.content === "" || 
//                 m.content === "begin" || 
//                 m.content === "start" ||
//                 m.content?.trim() === ""
//               )) {
//                 return false;
//               }
//               return true;
//             })
//             .map((m, i) =>
//               m.role === "user" ? (
//                 <div key={i} className="self-start ml-8">
//                   <span className="inline-block bg-[#E4EDFF] text-[#02133B] px-4 py-2 rounded-b-[12px] rounded-tr-[12px] text-base font-medium">
//                     {m.content}
//                   </span>
//                 </div>
//               ) : (
//                 <div key={i} className="flex items-start gap-2">
//                     <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} />
//                   <span className="text-base text-black font-normal bg-transparent">
//                     {m.content}
//                   </span>
//                 </div>
//               )
//             )}
          
//           {error && (
//             <div className="mx-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
//               ⚠️ Error: {error.message || 'Something went wrong with the AI response'}
//             </div>
//           )}
          
//           {/* Show "..." when AI is not streaming */}
//           {isLoading && !isStreaming && (
//             <div className="flex items-center gap-2">
//               <Image src="/logo1.png" alt="AI Avatar" width={24} height={24} />
//               <span className="text-base text-black font-normal bg-transparent">
//                 <div className="flex space-x-1">
//                   <div className="w-1 mt-1 h-1 bg-black rounded-full animate-bounce"></div>
//                   <div className="w-1 mt-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                   <div className="w-1 mt-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                 </div>
//               </span>
//             </div>
//           )}
          
//           <div ref={messagesEndRef} />
//         </div>
//         <form
//           onSubmit={async (e) => {
//             e.preventDefault();
//             if (!answer.trim() || isLoading) return;
            
//             // Prevent submission if we already have 8 answers (allow submitting the 8th answer)
//             const currentCount = getCurrentUserAnswerCount(messages);
//             if (currentCount >= TOTAL_QUESTIONS) {
//               console.log('⚠️ Attempted to submit more than 8 answers - blocked');
//               return;
//             }
            
//             console.log(`📝 Submitting answer ${currentCount + 1}/${TOTAL_QUESTIONS}: "${answer.substring(0, 30)}..."`);
            
//             await append({ role: "user", content: answer });
//             setAnswer("");
//             inputRef.current?.focus();
//           }}
//           className="mt-4"
//         >
//           <div className={`border rounded-xl flex items-center px-2 py-1 transition-all ${
//             userAnswers.length >= TOTAL_QUESTIONS 
//               ? 'bg-gray-100 border-gray-300' 
//               : 'bg-white focus-within:ring-1 focus-within:ring-[#02133B]'
//           }`}>
//                       <Textarea
//             ref={inputRef}
//             id="answer"
//             className="resize-none min-h-[40px] border-0 focus:outline-none shadow-none flex-1 text-base"
//             placeholder={userAnswers.length >= TOTAL_QUESTIONS ? "All questions completed!" : `Question ${userAnswers.length + 1} of ${TOTAL_QUESTIONS}`}
//             value={answer}
//             onChange={(e) => setAnswer(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 if (!answer.trim() || isLoading || userAnswers.length >= TOTAL_QUESTIONS) return;
                
//                 const currentCount = getCurrentUserAnswerCount(messages);
//                 if (currentCount >= TOTAL_QUESTIONS) return;
                
//                 // Trigger form submission
//                 const form = e.currentTarget.closest('form');
//                 if (form) {
//                   form.requestSubmit();
//                 }
//               }
//             }}
//             maxLength={280}
//             disabled={isLoading || userAnswers.length >= TOTAL_QUESTIONS}
//             style={{ boxShadow: 'none' }}
//           />
//           <Button
//             type="submit"
//             size="icon"
//             className="ml-2 rounded-full bg-transparent text-[#02133B]"
//             disabled={isLoading || !answer.trim() || userAnswers.length >= TOTAL_QUESTIONS}
//           >
//             <Send className="w-5 h-5 text-[#02133B]" />
//           </Button>
//           </div>
//           <div className="flex justify-between text-xs text-gray-400 mt-1">
//             <span>{answer.length}/280</span>
//             <span>
//               {userAnswers.length >= TOTAL_QUESTIONS 
//                 ? "Waiting for recommendation..." 
//                 : "ESC or Click to cancel"
//               }
//             </span>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }