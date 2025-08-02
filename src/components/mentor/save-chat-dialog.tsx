import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface SaveChatDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onContinue?: () => void;
  onClose?: () => void;
  chatId?: string;
}

export default function SaveChatDialog({ isOpen, onSave, onDiscard, onContinue, onClose, chatId }: SaveChatDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="text-center">
          <div className="mb-6">
            {/* Download icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#E4EDFF] mb-4">
              <Download className="h-6 w-6 text-[#02133B]" />
            </div>
            
            <h3 className="text-lg font-medium text-[#02133B] mb-2">
              Save This Mentoring Session
            </h3>
            <p className="text-sm text-gray-600">
              Your chat history will be saved. You can review this conversation at any time.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={onDiscard}
                className="px-6 bg-[#D40000]/15 text-[#D40000] hover:text-[#D40000] hover:cursor-pointer border-red-200 hover:bg-[#D40000]/15"
              >
                Discard
              </Button>
              <Button
                onClick={onSave}
                className="px-6 bg-[#02133B] hover:bg-[#02133B] hover:cursor-pointer text-white"
              >
                Save and Close
              </Button>
            </div>
            {onContinue && (
              <Button
                variant="outline"
                onClick={onContinue}
                className="px-6 border-[#02133B] hover:cursor-pointer text-[#02133B] hover:bg-[#02133B] hover:text-white"
              >
                Continue Chat
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 