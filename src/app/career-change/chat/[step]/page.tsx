"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CareerChat from "@/components/career/career-chat";
import { createCareerChat } from "@/lib/career-chat-store";
import { useAuth } from "@/components/auth/auth-provider";

const VALID_STEPS = ['discover', 'compare', 'create', 'make'];

export default function CareerChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = Array.isArray(params.step) ? params.step[0] : params.step;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth');
      return;
    }

    // Validate step parameter
    if (!step || !VALID_STEPS.includes(step)) {
      router.push('/career-change');
      return;
    }

    // Create or get existing chat
    const initializeChat = async () => {
      try {
        // Check if we have a career chat ID stored in localStorage for this session
        const existingChatId = localStorage.getItem('career-chat-id');
        
        if (existingChatId) {
          setChatId(existingChatId);
        } else {
          // Create a new career chat
          const newChatId = await createCareerChat();
          localStorage.setItem('career-chat-id', newChatId);
          setChatId(newChatId);
        }
      } catch (error) {
        console.error('Failed to initialize career chat:', error);
        setError('Failed to start career chat session');
      }
    };

    initializeChat();
  }, [user, loading, step]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#02133B]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => router.push('/career-change')}
          className="bg-[#02133B] text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#02133B]">Starting your career journey...</div>
      </div>
    );
  }

  return <CareerChat chatId={chatId} initialStep={step} />;
} 