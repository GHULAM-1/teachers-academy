import { useEffect, useState, useRef, useCallback } from 'react';

// Extend Window interface for global flags
declare global {
  interface Window {
    isRefreshBlocked?: boolean;
  }
}

export function useCareerChatSaveDialog(chatId: string | undefined, shouldShowDialog: boolean) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const hasShownDialogRef = useRef(false);
  const isLeavingRef = useRef(false);
  const intendedNavigationRef = useRef<string | null>(null);

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch('/api/career/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        console.error('Failed to delete career chat:', await response.text());
      } else {
        console.log('🗑️ Career chat deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting career chat:', error);
    }
  };

  const saveChat = async (chatId: string) => {
    try {
      console.log(`🔄 Calling save API for career chat: ${chatId}`);
      const response = await fetch('/api/career/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      });

      console.log(`📡 Save API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save career chat:', errorText);
        throw new Error(`Save failed: ${errorText}`);
      } else {
        const result = await response.json();
        console.log('✅ Career chat saved successfully:', result);
      }
    } catch (error) {
      console.error('Error saving career chat:', error);
      throw error;
    }
  };

  const handleSaveChoice = useCallback(async (shouldSave: boolean) => {
    console.log('💾 User chose to:', shouldSave ? 'save' : 'delete');
    
    // Clear refresh block flag
    if (typeof window !== 'undefined') {
      window.isRefreshBlocked = false;
    }
    
    // Hide the dialog first
    setShowSaveDialog(false);
    hasShownDialogRef.current = true;
    isLeavingRef.current = true;

    try {
      if (chatId) {
        if (shouldSave) {
          await saveChat(chatId);
        } else {
          await deleteChat(chatId);
        }
      }

      // Wait for the API calls to complete, then navigate
      const targetUrl = intendedNavigationRef.current || '/';
      console.log('🎯 Navigating to:', targetUrl);
      
      // Use a longer delay to ensure API calls complete
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = targetUrl;
          intendedNavigationRef.current = null;
        }
      }, 500);
      
    } catch (error) {
      console.error('Error handling save choice:', error);
      // Even if there's an error, still navigate
      const targetUrl = intendedNavigationRef.current || '/';
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = targetUrl;
          intendedNavigationRef.current = null;
        }
      }, 500);
    }
  }, [chatId]);

  const handleContinueChat = useCallback(() => {
    console.log('🔄 User chose to continue chat');
    
    // Clear refresh block flag
    if (typeof window !== 'undefined') {
      window.isRefreshBlocked = false;
    }
    
    // Just hide the dialog and do nothing else
    setShowSaveDialog(false);
    hasShownDialogRef.current = true;
  }, []);

  // Trigger save dialog when user attempts to leave
  const triggerSaveDialog = useCallback((intendedUrl?: string) => {
    if (!chatId || !shouldShowDialog || hasShownDialogRef.current || isLeavingRef.current) {
      return false;
    }

    if (intendedUrl) {
      intendedNavigationRef.current = intendedUrl;
    }

    console.log('💾 Showing career chat save dialog');
    setShowSaveDialog(true);
    return true;
  }, [chatId, shouldShowDialog]);

  useEffect(() => {
    if (!chatId) {
      console.log('❌ No career chatId, skipping save dialog setup');
      return;
    }

    console.log('🔧 Career chat save dialog hooks active:', { chatId: chatId.substring(0, 8) + '...', shouldShowDialog });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasShownDialogRef.current || isLeavingRef.current) return;

      // If refresh is blocked, always prevent unload
      if (window.isRefreshBlocked) {
        console.log('🔄 Refresh blocked - preventing unload');
        e.preventDefault();
        e.returnValue = 'Please complete your save dialog choice first.';
        return e.returnValue;
      }

      if (shouldShowDialog) {
        console.log('🔄 Preventing page unload - showing save dialog');
        // Just prevent the unload and show a message
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Please use the save dialog.';
        return e.returnValue;
      }
    };

    // Handle keyboard shortcuts for refresh (Ctrl+R, F5, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldShowDialog && !hasShownDialogRef.current && !isLeavingRef.current) {
        // Check for refresh shortcuts
        const isRefresh = 
          (e.ctrlKey && e.key === 'r') || // Ctrl+R
          (e.key === 'F5') || // F5
          (e.ctrlKey && e.key === 'F5'); // Ctrl+F5
        
        if (isRefresh) {
          console.log('🔄 Refresh shortcut detected - showing save dialog');
          e.preventDefault();
          e.stopPropagation();
          intendedNavigationRef.current = '/';
          setShowSaveDialog(true);
          // Set a flag to prevent further refresh attempts
          window.isRefreshBlocked = true;
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatId, shouldShowDialog]);

  return {
    showSaveDialog,
    setShowSaveDialog,
    handleSaveChoice,
    handleContinueChat,
    triggerSaveDialog
  };
} 