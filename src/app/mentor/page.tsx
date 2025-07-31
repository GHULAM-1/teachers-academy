"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { generateId } from 'ai';

export default function MentorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stuckMode = searchParams.get('mode') === 'stuck';
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/auth');
          return;
        }

        // Create new chat
        const id = generateId();
        
        const { data, error } = await supabase
          .from('chats')
          .insert({
            id,
            user_id: user.id,
            title: null,
            saved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to create chat:', error);
          router.push('/mentor/chat');
          return;
        }
        
        // Redirect to the new chat
        router.push(`/mentor/chat/${id}${stuckMode ? '?mode=stuck' : ''}`);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth');
      }
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4EDFF]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02133B] mx-auto mb-4"></div>
        <p className="text-[#02133B] font-medium">Setting up your chat...</p>
      </div>
    </div>
  );
}
