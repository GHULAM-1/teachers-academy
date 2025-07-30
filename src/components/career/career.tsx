"use client";

import Hero from "../hero";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards, { FeatureCard } from "../cards";
import { TrendingUp, Heart, FileText, CheckCircle } from 'lucide-react';

export default function Career() {
  const careerChangeCards: FeatureCard[] = [
    {
      id: "discover",
      title: "Discover",
      description:
        "Explore potential career paths and identify opportunities that align with your teaching skills and interests.",
      icon: TrendingUp,
      buttonText: "EXPLORE PATHS",
      buttonHref: "/career-change/chat/discover",
    },
    {
      id: "create",
      title: "Create Materials",
      description:
        "Generate resumes and cover letters tailored to your new career direction with your teaching experience highlighted.",
      icon: FileText,
      buttonText: "CREATE MATERIALS",
      buttonHref: "/career-change/chat/create",
      disabled: true,
    },
    {
      id: "make",
      title: "Make the Leap",
      description:
        "Get an action plan for your job search with concrete steps, timelines, and strategies for career transition.",
      icon: CheckCircle,
      buttonText: "GET ACTION PLAN",
      buttonHref: "/career-change/chat/make",
      disabled: true,
    },
  ];

  return (
    <div className="">
      {/* Hero Section */}
      <Hero
        icon={<CheckCircle className="w-10 h-10 text-white" />}
        title="Career Change"
        subtitle="Transform your teaching experience into your next career opportunity with our step-by-step guidance."
      />

      <Separator className="my-6" />

      {/* Feature Cards */}
      <FeatureCards cards={careerChangeCards}/>
    </div>
  );
}
