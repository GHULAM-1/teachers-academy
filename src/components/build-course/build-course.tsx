"use client";
import { useState } from "react";
import StepChat from "../mentor/step-chat";
import Chat from "../mentor/chat";
import type { Message } from "ai/react";
import Hero from "../hero";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards, { FeatureCard } from "../cards";
import { BookOpen, Lightbulb, NotebookText, RocketIcon, Settings } from 'lucide-react';

export default function BuildCourse() {
  const buildCourseCards: FeatureCard[] = [
    {
      id: "chat",
      title: "Find Your Perfect Course Idea",
      description:
        "A profitable course solves a specific problem. Let's brainstorm your unique niche and validate your idea to ensure there are students ready to enroll.",
      icon: Lightbulb,
      buttonText: "VALIDATE MY IDEA",
      buttonHref: "/mentor",
    },
    {
      id: "course",
      title: "Outline Your Curriculum",
      description:
        "Transform your expertise into a clear, step-by-step learning path. We will map out your modules, lessons, and projects for an amazing student experience.",
      icon: NotebookText,
      buttonText: "DESIGN MY CURRICULUM",
      buttonHref: "/course",
    },
    {
      id: "career",
      title: "Choose Your Tech Stack",
      description:
        " From recording your first video to getting paid, let's navigate the technology. We'll find the simplest tools to host, deliver, and sell your online course.",
      icon: Settings,
      buttonText: "SELECT MY TOOLS",
      buttonHref: "/career-growth",
    },
    {
      id: "independent",
      title: " Plan Your Course Launch",
      description:
        "Creating a great course is only half the battle. Let's build a powerful marketing strategy to attract your ideal students and ensure a successful launch.",
      icon: RocketIcon,
      buttonText: "PREPARE MY LAUNCH",
      buttonHref: "/independent",
      badge: "Popular",
    },
  ];

  return (
    <div className="">
      {/* Hero Section */}
      <Hero
        icon={<BookOpen className="w-10 h-10 text-white" />}
        title="Build Your Course"
        subtitle="Let's turn your unique knowledge into a valuable digital asset. Where should we begin?"
      />

      <Separator className="my-6" />

      {/* Feature Cards */}
      <FeatureCards  cards={buildCourseCards}/>
    </div>
  );
}
