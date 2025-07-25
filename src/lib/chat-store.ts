import { generateId, Message } from 'ai';
import { createClient, createAdminSupabaseClient, Chat, ChatMessage } from './supabase';

/**
 * Creates a new chat and returns its ID
 * Following AI SDK pattern: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 */
export async function createChat(): Promise<string> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated to create a chat');
  }

  const id = generateId(); // generate a unique chat ID using AI SDK helper
  
  // Create new chat record in database with user_id
  const { error } = await supabase
    .from('chats')
    .insert({
      id,
      user_id: user.id,
      title: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create chat: ${error.message}`);
  }

  return id;
}

/**
 * Loads all messages for a specific chat
 * Following AI SDK pattern: returns Message[] format
 */
export async function loadChat(id: string): Promise<Message[]> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated to load chats');
  }

  // First check if the chat belongs to the current user
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (chatError || !chatData) {
    throw new Error('Chat not found or access denied');
  }

  // Load messages for the chat
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', id)
    .eq('user_id', user.id) // Extra security check
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load chat: ${error.message}`);
  }

  // Convert database format to AI SDK Message format
  return (data || []).map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: new Date(msg.created_at)
  }));
}

/**
 * Saves chat messages to database
 * Following AI SDK pattern: accepts {id, messages} object
 */
export async function saveChat({
  id,
  messages
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  const supabase = createClient();
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to save chats');
    }

    // Convert AI SDK Message format to database format
    const messagesToInsert = messages.map(msg => ({
      id: msg.id || generateId(),
      chat_id: id,
      user_id: user.id, // Add user_id to each message
      role: msg.role,
      content: msg.content,
      created_at: msg.createdAt?.toISOString() || new Date().toISOString()
    }));

    // NEVER delete existing messages - only insert new ones that don't exist
    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', id)
      .eq('user_id', user.id);

    const existingIds = new Set((existingMessages || []).map((msg: any) => msg.id));
    
    // Only insert messages that don't already exist
    const newMessages = messagesToInsert.filter((msg: any) => !existingIds.has(msg.id));

    if (newMessages.length > 0) {
      const { error } = await supabase
        .from('messages')
        .insert(newMessages);

      if (error) {
        throw new Error(`Failed to save messages: ${error.message}`);
      }
    }

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id); // Only update user's own chats

  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

/**
 * Additional functions for chat history sidebar
 */

/**
 * Load all user's chats for sidebar display
 */
export async function loadUserChats(): Promise<Chat[]> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // Return empty array instead of throwing error for better UX
    console.warn('User not authenticated for loadUserChats');
    return [];
  }

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', user.id) // Only load current user's chats
    .order('created_at', { ascending: false }); // Order by creation date, newest first

  if (error) {
    console.error('Failed to load user chats:', error);
    return [];
  }

  return data || [];
}

/**
 * Server-side version for getting user chats (used in components)
 */
export async function loadUserChatsServer(userId: string): Promise<Chat[]> {
  const adminClient = createAdminSupabaseClient();

  const { data, error } = await adminClient
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load user chats (server):', error);
    return [];
  }

  return data || [];
}
// ghulam
/**
 * Update chat title (auto-generated from first message)
 */
export async function updateChatTitle(id: string, title: string): Promise<void> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User must be authenticated to update chat title');
  }

  const { error } = await supabase
    .from('chats')
    .update({ 
      title, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', user.id); // Only update user's own chats

  if (error) {
    throw new Error(`Failed to update chat title: ${error.message}`);
  }
}

/**
 * Server-side version of updateChatTitle that accepts userId directly
 */
export async function updateChatTitleWithUser(
  id: string, 
  title: string, 
  userId: string, 
  supabaseClient?: any
): Promise<void> {
  const supabase = supabaseClient || createAdminSupabaseClient();

  const { error } = await supabase
    .from('chats')
    .update({ 
      title, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', userId); // Only update user's own chats

  if (error) {
    throw new Error(`Failed to update chat title: ${error.message}`);
  }
}

/**
 * Server-side version of saveChat that accepts userId directly
 * Used from API routes where we already have the authenticated user
 */
export async function saveChatWithUser({
  id,
  userId,
  messages,
  supabaseClient
}: {
  id: string;
  userId: string;
  messages: Message[];
  supabaseClient?: any;
}): Promise<void> {
  // Use provided client or create admin client for RLS bypass
  const supabase = supabaseClient || createAdminSupabaseClient();
  
  try {
    // Convert AI SDK Message format to database format
    const messagesToInsert = messages.map(msg => {
      // Handle different date formats
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
        user_id: userId, // Use provided userId instead of checking auth
        role: msg.role,
        content: msg.content,
        created_at: createdAt
      };
    });

    // NEVER delete existing messages - only insert new ones that don't exist
    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', id)
      .eq('user_id', userId);

    const existingIds = new Set((existingMessages || []).map((msg: any) => msg.id));
    
    // Only insert messages that don't already exist
    const newMessages = messagesToInsert.filter((msg: any) => !existingIds.has(msg.id));

    if (newMessages.length > 0) {
      const { error } = await supabase
        .from('messages')
        .insert(newMessages);

      if (error) {
        throw new Error(`Failed to save messages: ${error.message}`);
      }
    }

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId); // Only update user's own chats

  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
} 