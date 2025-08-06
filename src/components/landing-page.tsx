"use client";
import React from "react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/auth");
  };

  const handleSignUp = () => {
    router.push("/auth");
  };

  return (
    <div className="overflow-hidden bg-white">
      {/* Header */}
      <header className="bg-white border-b fixed border-gray-200 top-0 z-50 w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Teachers Next"
                className=""
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleSignIn}
                className="text-blue-600 hover:cursor-pointer hover:text-blue-700"
              >
                LOG IN
              </Button>
              <Button
                onClick={handleSignUp}
                className="bg-blue-600 hover:cursor-pointer hover:bg-blue-700 text-white"
              >
                SIGN UP
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <WavyBackground
        className="max-w-4xl mx-auto"
        colors={["#cfe9ff", "#cfe9ff"]}
        blur={10}
        waveWidth={350}
        waveHeight={350}
        speed="slow"
      >
        <div className="text-center">
          {/* Trust Indicator */}
          <p className="text-sm text-blue-600 font-medium mb-4">
            TRUSTED BY OVER 500K TEACHERS!
          </p>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            Transform your <br />
            <span className="text-blue-600">teaching career</span> <br /> Without the
            stress.
          </h1>

          {/* Sub-headline */}

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-gray-700">AI-Powered Mentorship</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-gray-700">Career Development</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-gray-700">Skill Building</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-gray-700">And Much More...</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleSignUp}
            className="bg-blue-600 hover:cursor-pointer hover:bg-blue-700 text-white text-lg px-8 py-3"
          >
            SIGN UP FOR FREE
          </Button>

          {/* Social Proof */}
          <div className="mt-8">
            <div className="flex justify-center space-x-2 mb-3">
              <img src="/people.png"  alt="" className=" h-10" />
            </div>
            <p className="text-gray-600 italic text-center text-base">
              "I got opportunities from top schools and  organizations <br /> reaching
              out to me already!!"
            </p>
          </div>
        </div>
      </WavyBackground>
    </div>
  );
}
