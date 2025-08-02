import React from "react";

interface QuestionProgressProps {
  currentQuestion: number;
  totalQuestions?: number;
}

export default function QuestionProgress({ 
  currentQuestion, 
  totalQuestions = 8 
}: QuestionProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
      <div className="text-center">
        {/* Question counter */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Question {currentQuestion} of {totalQuestions}
          </h2>
        </div>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-gray-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 