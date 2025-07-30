import { Button } from "@/components/ui/button";

interface SaveChatDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onContinue?: () => void;
  chatId?: string;
}

export default function SaveChatDialog({ isOpen, onSave, onDiscard, onContinue, chatId }: SaveChatDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#E4EDFF] mb-4">
              <svg className="h-6 w-6 text-[#02133B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#02133B] mb-2">
              Save this conversation?
            </h3>
            <p className="text-sm text-gray-600">
              Do you want to save this mentoring session to your chat history? If you don't save it, the conversation will be permanently deleted.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 justify-center">
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={onDiscard}
                className="px-6"
              >
                Delete Chat
              </Button>
              <Button
                onClick={onSave}
                className="px-6 bg-[#02133B] hover:bg-[#02133B]/90"
              >
                Save Chat
              </Button>
            </div>
            {onContinue && (
              <Button
                variant="ghost"
                onClick={onContinue}
                className="px-6 text-gray-600 hover:text-gray-800"
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