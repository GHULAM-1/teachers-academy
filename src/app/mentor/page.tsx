"use client";

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { generateId } from 'ai';

function MentorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stuckMode = searchParams.get('mode') === 'stuck';
  const supabase = createClient();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      // Prevent multiple executions
      if (isProcessingRef.current) {
        console.log('🔄 Already processing, skipping...');
        return;
      }
      
      isProcessingRef.current = true;
      console.log('🚀 Starting mentor page processing...');
      
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/auth');
          return;
        }

        // Always create a new chat when accessing from sidebar
        const chatId = generateId();
        console.log('🆕 Creating new chat with ID:', chatId);
        
        const { data, error } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            user_id: user.id,
            title: null,
            saved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Failed to create chat:', error);
          router.push('/mentor/chat');
          return;
        }
        
        console.log('✅ Successfully created new chat:', chatId);
        
        // Redirect to the chat
        console.log('🎯 Redirecting to chat:', chatId);
        router.push(`/mentor/chat/${chatId}${stuckMode ? '?mode=stuck' : ''}`);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth');
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleAuth();
  }, [router, supabase, stuckMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
    </div>
  );
}

export default function MentorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-transparent"></div>}>
      <MentorPageContent />
    </Suspense>
  );
}
