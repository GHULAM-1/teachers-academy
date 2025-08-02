import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import PaymentMethodDialog from "./payment-method-dialog";

interface PremiumUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumUpgradeDialog({
  isOpen,
  onClose,
}: PremiumUpgradeDialogProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleUpgradeClick = () => {
    setShowPaymentDialog(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-[700px] px-24 py-12 !max-w-none sm:!max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[36px] text-center font-bold text-[#02133B]">
              You've Reached Your Free Limit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 max-w-[500px] mx-auto">
            <p className="text-sm text-center text-[#02133B]">
              You've Reached Your Free Limit. To continue using this feature and
              unlock the full power of the platform, please upgrade to Premium.
              Your plan will include{" "}
            </p>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex text-center gap-3">
                <div className="bg-[#F7F8FA] rounded-[16px] p-3 w-[50%]">
                  <p className="text-sm text-[#005AD1]">
                    Unlimited AI chats and guidance
                  </p>
                </div>
                <div className="bg-[#F7F8FA] rounded-[16px] p-3 w-[50%]">
                  <p className="text-sm text-[#005AD1]">
                    Advanced resume and cover letter creation
                  </p>
                </div>
              </div>

              <div className="bg-[#F7F8FA] rounded-[12px] p-3">
                <p className="text-sm text-[#005AD1]">
                  Full access to all business & passive income modules
                </p>
              </div>
            </div>

            {/* Upgrade Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleUpgradeClick}
                className="bg-primary-gold hover:bg-primary-gold text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 hover:cursor-pointer"
              >
                <span>✨ Upgrade to Premium for $28</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
      />
    </>
  );
}
