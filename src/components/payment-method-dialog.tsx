import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Wallet, X } from "lucide-react";

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentMethodDialog({
  isOpen,
  onClose,
}: PaymentMethodDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");

  const handleProceedToPay = () => {
    console.log("Proceeding to payment...");
    // Handle payment logic here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[700px] px-24 py-12 !max-w-none sm:!max-w-3xl">

        <DialogHeader className="text-center pt-8">
          <DialogTitle className="text-xl font-bold text-[#02133B]">
            Select Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`flex items-center justify-between px-5 py-3 border rounded-lg cursor-pointer ${
                paymentMethod === "card"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Credit / Debit card</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                  paymentMethod === "card"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "card" && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>

            <div
              className={`flex items-center justify-between px-5 py-3 border rounded-lg cursor-pointer ${
                paymentMethod === "wallet"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
              onClick={() => setPaymentMethod("wallet")}
            >
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Digital Wallet</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                  paymentMethod === "wallet"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "wallet" && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Card Details Form */}
          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card holder name
                </label>
                <Input
                  type="text"
                  placeholder="eg. jhonny bhai"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <Input
                  type="text"
                  placeholder="0000 1111 2222 3333"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry date
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="09"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    type="text"
                    placeholder="10"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="w-1/2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Proceed to Pay Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleProceedToPay}
              className="bg-primary-gold hover:cursor-pointer hover:bg-primary-gold text-white font-medium p-[12px] rounded-[8px] "
            >
              Proceed to Pay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 