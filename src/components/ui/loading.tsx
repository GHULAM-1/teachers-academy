import React from "react";

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = "This will just take a moment..." }: LoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="text-center flex flex-col items-center justify-center">
        <div className="relative mx-auto mb-6">
          {/* Circular spinner */}
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-blue rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium text-lg text-center">{message}</p>
      </div>
    </div>
  );
} 