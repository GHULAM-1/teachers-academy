import Hero from "../hero";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards, { FeatureCard } from "../cards";
import { Users, Award, User, Rocket, Compass, Badge } from 'lucide-react';

export default function Career() {
  const careerGrowthCards: FeatureCard[] = [
    {
      id: "ladder",
      title: "Climb the Career Ladder",
      description:
        "Focus on advancing within your current system. Let's create a strategy for leadership roles, department head positions, or administrative promotions.",
      icon: Users,
      buttonText: "PLAN MY PROMOTION",
      buttonHref: "/promotion",
    },
    {
      id: "specialize",
      title: "Specialize and Certify",
      description:
        "Become the go-to expert in a high-demand area. We can explore valuable certifications, new teaching frameworks, or tech skills to boost your profile.",
      icon: Award,
      buttonText: "FIND MY SPECIALTY",
      buttonHref: "/specialty",
    },
    {
      id: "brand",
      title: "Build Your Professional Brand",
      description:
        "Move beyond the classroom to become a recognized voice in education. Let's work on networking, conference presentations, or writing for publications.",
      icon: User,
      buttonText: "GROW MY INFLUENCE",
      buttonHref: "/influence",
    },
    {
      id: "horizons",
      title: "Explore New Horizons",
      description:
        "Your skills are valuable in many fields. Let's explore alternative career paths like corporate training, instructional design, or EdTech consulting.",
      icon: Compass,
      buttonText: "MAP MY PIVOT",
      buttonHref: "/pivot",
    },
  ];

  return (
    <div className="">
      {/* Hero Section */}
      <Hero
        icon={<Award className="w-10 h-10 text-white" />}
        title="Career Growth"
        subtitle="Let's map out the concrete steps to your next promotion, position, or professional milestone."
      />

      <Separator className="my-6" />

      {/* Feature Cards */}
      <FeatureCards cards={careerGrowthCards}/>
    </div>
  );
}
