import { generateId, Message } from 'ai';
import { createClient, createAdminSupabaseClient } from './supabase';

export interface CareerMessage extends Message {
  step?: string;
}

export interface CareerChat {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a new career chat and returns its ID
 */
export async function createCareerChat(): Promise<string> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated to create a career chat');
  }

  const id = generateId();
  
  // Create new career chat record in database with user_id
  const { error } = await supabase
    .from('career_chats')
    .insert({
      id,
      user_id: user.id,
      title: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create career chat: ${error.message}`);
  }

  return id;
}

/**
 * Loads all messages for a specific career chat
 */
export async function loadCareerChat(id: string): Promise<CareerMessage[]> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated to load career chats');
  }

  // First check if the career chat belongs to the current user
  const { data: chatData, error: chatError } = await supabase
    .from('career_chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (chatError || !chatData) {
    throw new Error('Career chat not found or access denied');
  }

  // Load messages for the career chat
  const { data, error } = await supabase
    .from('career_messages')
    .select('*')
    .eq('chat_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load career chat: ${error.message}`);
  }

  // Convert database format to AI SDK Message format with step
  return (data || []).map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    step: msg.step,
    createdAt: new Date(msg.created_at)
  }));
}

/**
 * Saves career chat messages to database with step tracking
 */
export async function saveCareerChat({
  id,
  messages,
  currentStep
}: {
  id: string;
  messages: CareerMessage[];
  currentStep?: string;
}): Promise<void> {
  const supabase = createClient();
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to save career chats');
    }

    // Convert AI SDK Message format to database format
    const messagesToInsert = messages.map(msg => ({
      id: msg.id || generateId(),
      chat_id: id,
      user_id: user.id,
      role: msg.role,
      content: msg.content,
      step: msg.step || currentStep || null,
      created_at: msg.createdAt?.toISOString() || new Date().toISOString()
    }));

    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from('career_messages')
      .select('id')
      .eq('chat_id', id)
      .eq('user_id', user.id);

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
      .eq('user_id', user.id);

  } catch (error) {
    console.error('Error saving career chat:', error);
    throw error;
  }
}

/**
 * Server-side version of saveCareerChat
 */
export async function saveCareerChatWithUser({
  id,
  userId,
  messages,
  currentStep,
  supabaseClient
}: {
  id: string;
  userId: string;
  messages: CareerMessage[];
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

/**
 * Update career chat title
 */
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

/**
 * Load user's career chats
 */
export async function loadUserCareerChats(): Promise<CareerChat[]> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('career_chats')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load user career chats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get messages for a specific step from a career chat
 */
export async function getCareerChatStepMessages(chatId: string, step: string): Promise<CareerMessage[]> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('career_messages')
    .select('*')
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
    .eq('step', step)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load step messages: ${error.message}`);
  }

  return (data || []).map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    step: msg.step,
    createdAt: new Date(msg.created_at)
  }));
} 