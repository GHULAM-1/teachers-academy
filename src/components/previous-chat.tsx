'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { useAuth } from './auth/auth-provider';
import { createClient } from '@/lib/supabase';
import { Chat } from '@/lib/supabase';
import { loadUserChats } from '@/lib/chat-store';
import Link from 'next/link';

export default function PreviousChat() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function fetchChats() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userChats = await loadUserChats();
        // Use mock data for testing instead of real data
        setChats(userChats);
        // setChats(userChats); // Uncomment this to use real data
      } catch (error) {
        console.error('Error loading chats:', error);
        // Fallback to mock data
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChats();
  }, [user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Generate chat title with incremental number
  const generateChatTitle = (index: number) => {
    return `AI MENTOR CHAT ${index + 1}`;
  };

  return (
    <div className="bg-white rounded-[16px] h-[271.96px] p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary-text">Previous Chats</h3>
          {chats.length > 0 && (
            <span className="text-sm text-primary-text/60">{chats.length} chats</span>
          )}
        </div>

        {/* Chat List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-text border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="w-8 h-8 text-primary-text/40 mb-2" />
            <p className="text-primary-text/60 text-sm">
              Your conversations would<br />
              show up here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.slice(0, 3).map((chat, index) => (
              <Link key={chat.id} href={`/mentor/chat/${chat.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-primary-text/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-primary-text/60" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary-text">
                        {generateChatTitle(index)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary-text/40" />
                        <span className="text-xs text-primary-text/40">
                          {formatDate(chat.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-primary-text/40">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
