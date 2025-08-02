import React from "react";

export default function ChatSkeleton() {
  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-200px)] mx-auto mt-10">
      <div className="flex flex-col gap-4 py-2 flex-1 overflow-y-auto scroll-smooth">
        
        {/* Skeleton message */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2">
            {/* Avatar skeleton */}
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            
            {/* Message content skeleton */}
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Empty space for chat area */}
        <div className="flex-1"></div>
      </div>

      {/* Input field - no skeleton, show actual input */}
      <div className="w-full px-4 mt-4">
        <div className="border rounded-xl flex items-center px-3 py-2 bg-white">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Send a message..." 
              className="w-full border-0 focus:outline-none text-base"
              disabled
            />
          </div>
          <div className="ml-2 w-5 h-5 bg-gray-400 rounded-full"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0/280</span>
          <span>ESC or Click to cancel</span>
        </div>
      </div>
    </div>
  );
} 