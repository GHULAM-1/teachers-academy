import { createClient, createAdminSupabaseClient } from './supabase';
import { Message } from 'ai/react';
import { generateId } from 'ai';

export interface CareerChat {
  id: string;
  user_id: string;
  title?: string;
  saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareerMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  step?: string;
  created_at: string;
}

// Load user's saved career chats
export async function loadUserCareerChats(): Promise<CareerChat[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { return []; }

  const { data, error } = await supabase
    .from('career_chats')
    .select('*')
    .eq('user_id', user.id)
    .eq('saved', true) // Only show saved chats in sidebar
    .order('created_at', { ascending: false });

  if (error) { console.error('Failed to load user career chats:', error); return []; }
  return data || [];
}

// Load user's saved career chats (server-side)
export async function loadUserCareerChatsServer(userId: string): Promise<CareerChat[]> {
  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient
    .from('career_chats')
    .select('*')
    .eq('user_id', userId)
    .eq('saved', true) // Only show saved chats in sidebar
    .order('created_at', { ascending: false });
  if (error) { console.error('Failed to load user career chats (server):', error); return []; }
  return data || [];
}

// Mark a career chat as saved
export async function markCareerChatAsSaved(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { throw new Error('User must be authenticated to mark career chat as saved'); }

  const { error } = await supabase
    .from('career_chats')
    .update({
      saved: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) { throw new Error(`Failed to mark career chat as saved: ${error.message}`); }
}

// Load messages for a specific career chat
export async function loadCareerChatMessages(chatId: string): Promise<CareerMessage[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { return []; }

  const { data, error } = await supabase
    .from('career_messages')
    .select('*')
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) { console.error('Failed to load career chat messages:', error); return []; }
  return data || [];
}

// Load messages for a specific career chat (server-side)
export async function loadCareerChatMessagesServer(chatId: string, userId: string): Promise<CareerMessage[]> {
  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient
    .from('career_messages')
    .select('*')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) { console.error('Failed to load career chat messages (server):', error); return []; }
  return data || [];
}

// Convert CareerMessage to AI SDK Message format
export function careerMessageToMessage(careerMessage: CareerMessage): Message {
  return {
    id: careerMessage.id,
    role: careerMessage.role,
    content: careerMessage.content,
    createdAt: new Date(careerMessage.created_at)
  };
}

// Convert AI SDK Message to CareerMessage format
export function messageToCareerMessage(message: Message, chatId: string, step?: string): Omit<CareerMessage, 'id' | 'user_id' | 'created_at'> {
  return {
    chat_id: chatId,
    role: message.role as 'user' | 'assistant' | 'system',
    content: message.content,
    step: step
  };
}

// Get the current step from the last message
export function getCurrentStepFromMessages(messages: CareerMessage[]): string | undefined {
  if (messages.length === 0) return undefined;
  
  // Find the last message with a step
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].step) {
      return messages[i].step;
    }
  }
  return undefined;
}

// Determine which step to resume based on the last message
export function determineResumeStep(messages: CareerMessage[]): string {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return 'discover';

  // If the last message has a step, use it
  if (lastMessage.step) {
    return lastMessage.step;
  }

  // Otherwise, determine based on message content or position
  // This logic can be enhanced based on your specific step flow
  return 'discover';
}

// Create a new career chat
export async function createCareerChat(): Promise<string> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated to create a career chat');
  }

  const { generateId } = await import('ai');
  const id = generateId();
  
  // Create new career chat record in database with user_id
  const { error } = await supabase
    .from('career_chats')
    .insert({
      id,
      user_id: user.id,
      title: null,
      saved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create career chat: ${error.message}`);
  }

  return id;
}

// Save career chat messages to database with step tracking
export async function saveCareerChatWithUser({
  id,
  userId,
  messages,
  currentStep,
  supabaseClient
}: {
  id: string;
  userId: string;
  messages: any[];
  currentStep?: string;
  supabaseClient?: any;
}): Promise<void> {
  const supabase = supabaseClient || createAdminSupabaseClient();
  
  try {
    // Convert AI SDK Message format to database format
    const messagesToInsert = messages.map(msg => {
      let createdAt: string;
      if (msg.createdAt) {
        if (msg.createdAt instanceof Date) {
          createdAt = msg.createdAt.toISOString();
        } else if (typeof msg.createdAt === 'string') {
          createdAt = msg.createdAt;
        } else if (typeof msg.createdAt === 'number') {
          createdAt = new Date(msg.createdAt).toISOString();
        } else {
          createdAt = new Date().toISOString();
        }
      } else {
        createdAt = new Date().toISOString();
      }

      return {
        id: msg.id || generateId(),
        chat_id: id,
        user_id: userId,
        role: msg.role,
        content: msg.content,
        step: msg.step || currentStep || null,
        created_at: createdAt
      };
    });

    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from('career_messages')
      .select('id')
      .eq('chat_id', id)
      .eq('user_id', userId);

    const existingIds = new Set((existingMessages || []).map((msg: any) => msg.id));
    
    // Only insert messages that don't already exist
    const newMessages = messagesToInsert.filter((msg: any) => !existingIds.has(msg.id));

    if (newMessages.length > 0) {
      const { error } = await supabase
        .from('career_messages')
        .insert(newMessages);

      if (error) {
        throw new Error(`Failed to save career messages: ${error.message}`);
      }
    }

    // Update career chat's updated_at timestamp
    await supabase
      .from('career_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

  } catch (error) {
    console.error('Error saving career chat:', error);
    throw error;
  }
}

// Update career chat title
export async function updateCareerChatTitleWithUser(
  id: string, 
  title: string, 
  userId: string, 
  supabaseClient?: any
): Promise<void> {
  const supabase = supabaseClient || createAdminSupabaseClient();

  const { error } = await supabase
    .from('career_chats')
    .update({
      title, 
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update career chat title: ${error.message}`);
  }
} 