"use client";
import { useState } from "react";
import Chat from "./mentor/chat";
import type { Message } from "ai/react";
import Hero from "./welcome-card";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards from "./cards";
import PillarsCard from "./pilllars-card";
import UserCard from "./user-card";
import PreviousChat from "./previous-chat";
import Header from "./header";

export default function HomePage() {
  const pillars = [
    {
      title: "Build Your Passive Income",
      description:
        "Turn your expertise into a profitable course with AI assistance.",
      icon: "briefcase" as const,
      href: "/mentor?mode=passive-income",
    },
    {
      title: "Change Your Career",
      description:
        "Get an AI-powered roadmap for your transition to a new role.",
      icon: "award" as const,
      href: "/mentor?mode=career-change",
    },
    {
      title: "Launch Your Teaching Business",
      description: 'Become a "teacherpreneur" with your AI business co-pilot.',
      icon: "book" as const,
      href: "/mentor?mode=teaching-business",
    },
  ];
  return (
    <div>
      <div>
        <Header isCollapsed={false} />
      </div>
      <div className="bg-transparent flex shadow-2xl justify-between pb-[32px] gap-[24px] mt-[32px]">
        {/* Hero Section */}
        <div className="flex flex-col justify-between gap-[24px] w-[70%]">
          <Hero />
          <div className="flex flex-col gap-[24px]">
            {pillars.map((pillar, index) => (
              <PillarsCard
                key={index}
                description={pillar.description}
                title={pillar.title}
                icon={pillar.icon}
                href={pillar.href}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-[24px] w-[30%]">
          <UserCard />
          <PreviousChat />
        </div>
        {/* <Separator className="my-6" /> */}

        {/* Feature Cards */}
        {/* <FeatureCards /> */}
      </div>
    </div>
  );
}
