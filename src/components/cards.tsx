"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BookOpen,
  TrendingUp,
  Rocket,
  ArrowRight,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonText: string;
  buttonHref?: string;
  onClick?: () => void;
  badge?: string;
}

const defaultCards: FeatureCard[] = [
  {
    id: "chat",
    title: "Chat with Your AI Mentor",
    description:
      "Have a specific question or a unique challenge? Get personalized guidance, brainstorm ideas, and find solutions on any professional topic.",
    icon: MessageSquare,
    buttonText: "START THE CONVERSATION",
    buttonHref: "/mentor",
  },
  {
    id: "course",
    title: "Build Your Online Course",
    description:
      "Transform your teaching expertise into a valuable digital asset. Get a step-by-step blueprint for creating and launching your own successful online course.",
    icon: BookOpen,
    buttonText: "START BUILDING",
    buttonHref: "/course",
  },
  {
    id: "career",
    title: "Chart Your Career Path",
    description:
      "Whether you're aiming for a promotion or exploring a new role, let's map out the actionable steps to achieve your next professional milestone.",
    icon: Award,
    buttonText: "PLAN YOUR NEXT STEP",
    buttonHref: "/career-growth",
  },
  {
    id: "independent",
    title: "Launch Your Teacherpreneur Journey",
    description:
      "Ready to be your own boss? Explore models for tutoring, consulting, or freelancing and build a brand that gives you freedom and impact.",
    icon: Rocket,
    buttonText: "EXPLORE INDEPENDENCE",
    buttonHref: "/independent",
    badge: "Popular",
  },
];

interface FeatureCardsProps {
  cards?: FeatureCard[];
  className?: string;
}

export default function FeatureCards({
  cards = defaultCards,
  className,
}: FeatureCardsProps) {
  const router = useRouter();

  const handleCardClick = (card: FeatureCard) => {
    if (card.onClick) {
      card.onClick();
    } else if (card.buttonHref) {
      router.push(card.buttonHref);
    }
  };

  return (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-2 gap-[16px]", className)}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.id}
            className={cn(
              "group hover:shadow-lg transition-all duration-300 relative border-[#02133B]/20"
            )}
          >
            <CardHeader className="pb-4">
              <div
                className={cn(
                  "w-7 h-7 relative bg-[#E4EDFF] rounded-full flex items-center justify-center mb-4 transition-colors"
                )}
              >
                <div className="absolute ">
                  <Icon className="w-7 h-7 text-[#02133B]" />
                </div>
              </div>

              <CardTitle className="text-[25px] font-bol text-[#02133B]">
                {card.title}
              </CardTitle>

              <CardDescription className="text-[#02133B] text-[16px] leading-relaxed">
                {card.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <button
                className={cn(
                  "transition-all duration-300 hover:cursor-pointer  rounded-[12px]",
                  "bg-[#E4EDFF] hover:bg-[#E4EDFF] text-[#02133B] font-semibold"
                )}
                onClick={() => handleCardClick(card)}
              >
                <div className="flex items-center justify-center px-[16px] py-[12px]">
                  {card.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
