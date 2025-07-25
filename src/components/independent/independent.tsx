"use client";

import Hero from "../hero";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards, { FeatureCard } from "../cards";
import { User, Rocket, FileDown, Building2, Video } from 'lucide-react';

export default function Independent() {
  const independentCards: FeatureCard[] = [
    {
      id: "tutor",
      title: "Become a Private Tutor or Coach",
      description:
        "This is the most direct path to generating income. Let's define your ideal student, structure your pricing and packages, and set up a client booking system.",
      icon: User,
      buttonText: "BUILD MY PRACTICE",
      buttonHref: "/practice",
    },
    {
      id: "digital-products",
      title: "Sell Your Digital Products",
      description:
        "Move beyond trading time for money. We can brainstorm and outline digital products like ebooks, templates, lesson plans, or paid workshops.",
      icon: FileDown,
      buttonText: "CREATE MY PRODUCT",
      buttonHref: "/product",
    },
    {
      id: "consulting",
      title: "Offer Consulting or B2B Training",
      description:
        "Leverage your expertise to help schools or businesses. Let's package your skills into a high-value consulting offer or a corporate training workshop.",
      icon: Building2,
      buttonText: "DEVELOP MY OFFER",
      buttonHref: "/offer",
    },
    {
      id: "content-creator",
      title: "Become a Content Creator",
      description:
        "Build an audience around your passion. We can create a strategy for a YouTube channel, blog, or podcast that can be monetized through ads, sponsorships, or affiliates.",
      icon: Video,
      buttonText: "GROW MY AUDIENCE",
      buttonHref: "/audience",
    },
  ];

  return (
    <div className="">
      {/* Hero Section */}
      <Hero
        icon={<Rocket className="w-10 h-10 text-white" />}
        title="Go Independent"
        subtitle="Ready to build a business that gives you both freedom and impact? Let's take the first step."
      />

      <Separator className="my-6" />

      {/* Feature Cards */}
      <FeatureCards cards={independentCards}/>
    </div>
  );
}
