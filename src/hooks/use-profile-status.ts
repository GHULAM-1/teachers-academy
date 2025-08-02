import { useState, useEffect } from 'react';

let profileStatus: boolean | null = null;
let listeners: ((status: boolean | null) => void)[] = [];

export function useProfileStatus() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(profileStatus);

  useEffect(() => {
    // Add this component as a listener
    const listener = (status: boolean | null) => setHasProfile(status);
    listeners.push(listener);
    
    // Cleanup on unmount
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const updateProfileStatus = (status: boolean) => {
    profileStatus = status;
    // Notify all listeners
    listeners.forEach(listener => listener(status));
  };

  return { hasProfile, updateProfileStatus };
} 