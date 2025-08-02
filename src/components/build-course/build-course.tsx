"use client";
import { useState } from "react";
import Chat from "../mentor/chat";
import type { Message } from "ai/react";
import Hero from "../welcome-card";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards, { FeatureCard } from "../cards";
import { ArrowRight, BookOpen, Lightbulb, NotebookText, RocketIcon, Settings } from 'lucide-react';
import { Button } from "../ui/button";
import Header from "../header";

export default function BuildCourse() {


  return (
    <div>
      <div className="sticky top-0 z-50 bg-[#F5F9FC] ">
        <Header isCollapsed={false} title="Passive Income" />
      </div>

      <div className="flex flex-col items-center justify-start">
        <img src="/passive.png" alt="" className="w-[70%] h-[70%]" />
      </div>
      <div className="flex flex-col items-center  justify-start">
        <Button className="bg-primary-gold text-white hover:cursor-pointer hover:bg-primary-gold" onClick={() => {
          window.location.href = "/career-change/chat/discover";
        }}>
          GET STARTED
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>  
  );
}
