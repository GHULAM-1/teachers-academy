import { useEffect, useState, useRef, useCallback } from 'react';

export function useChatSaveDialog(chatId: string | undefined, hasMeaningfulMessages: boolean) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const hasShownDialogRef = useRef(false);
  const isLeavingRef = useRef(false);
  const intendedNavigationRef = useRef<string | null>(null);


  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch('/api/chat/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        console.error('Failed to delete chat:', await response.text());
      } else {
        console.log('✅ Chat deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const saveChat = async (chatId: string) => {
    try {
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        console.error('Failed to save chat:', await response.text());
      } else {
        console.log('✅ Chat saved successfully');
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const handleSaveChoice = useCallback(async (shouldSave: boolean) => {
    setShowSaveDialog(false);
    hasShownDialogRef.current = true;
    isLeavingRef.current = true;

    if (chatId) {
      if (shouldSave) {
        await saveChat(chatId);
      } else {
        await deleteChat(chatId);
      }
    }

    // Navigate to the intended destination or home page
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const targetUrl = intendedNavigationRef.current || '/';
        console.log('🎯 Navigating to:', targetUrl);
        window.location.href = targetUrl;
        intendedNavigationRef.current = null;
      }
    }, 200);
  }, [chatId]);

  // Trigger save dialog when user attempts to leave
  const triggerSaveDialog = useCallback((intendedUrl?: string) => {    
    if (!chatId || !hasMeaningfulMessages || hasShownDialogRef.current || isLeavingRef.current) {
      return false;
    }
    
    if (intendedUrl) {
      intendedNavigationRef.current = intendedUrl;
    }
    
    console.log('💾 Showing save dialog');
    setShowSaveDialog(true);
    return true;
  }, [chatId, hasMeaningfulMessages]);

  useEffect(() => {    
    if (!chatId) {
      console.log('❌ No chatId, skipping save dialog setup');
      return;
    }
    
    console.log('🔧 Save dialog hooks active:', { chatId: chatId.substring(0, 8) + '...', hasMeaningfulMessages });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {      
      if (hasShownDialogRef.current || isLeavingRef.current) return;
      
      if (hasMeaningfulMessages) {
        console.log('🔄 Showing browser dialog for page refresh/close');
        // For browser close/refresh, we'll redirect to home
        intendedNavigationRef.current = '/';
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to save this conversation?';
        return e.returnValue;
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatId, hasMeaningfulMessages]);

  return {
    showSaveDialog,
    setShowSaveDialog,
    handleSaveChoice,
    triggerSaveDialog
  };
} 