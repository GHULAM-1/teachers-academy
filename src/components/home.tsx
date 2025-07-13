'use client';
import { useState } from 'react';
import StepChat from './mentor/step-chat';
import Chat from './mentor/chat';
import type { Message } from 'ai/react';
import Hero from './hero';
import { Separator } from '@radix-ui/react-separator';
import FeatureCards from './cards';

export default function HomePage() {
  const [mode, setMode] = useState<'step' | 'chat'>('step');
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  const handleStepComplete = (result: string) => {
    setInitialMessages([
      { id: 'ai-result', role: 'assistant', content: result }
    ]);
    setMode('chat');
  };

  return (
    // <div className="min-h-screen bg-gray-100 py-8">
    //   {mode === 'step' ? (
    //     <StepChat onComplete={handleStepComplete} />
    //   ) : (
    //     <Chat initialMessages={initialMessages} />
    //   )}
    // </div>

    <div className="">
      {/* Hero Section */}
      <Hero 
        greeting="Hey James,"
        title="Welcome to TeachersAcademy.ai"
        subtitle="What is your goal today?"
      />
      
      <Separator className="my-6" />
      
      {/* Feature Cards */}
      <FeatureCards />
    </div>

  );
}
