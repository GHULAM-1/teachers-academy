import React from "react";

export default function CraftingLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
      <div className="text-center">
        {/* Spinner */}
        <div className="mb-6">
          <div className="w-12 h-12 border-4 border-primary-text rounded-full border-t-transparent animate-spin mx-auto"></div>
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-primary-text">
            Crafting Your Personalized Plan
          </h2>
          <p className="text-sm text-primary-text">
            This will just take a moment...
          </p>
        </div>
      </div>
    </div>
  );
} 