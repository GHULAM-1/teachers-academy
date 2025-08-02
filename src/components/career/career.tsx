"use client";

import Hero from "../welcome-card";
import { Separator } from "@radix-ui/react-separator";
import FeatureCards, { FeatureCard } from "../cards";
import {
  TrendingUp,
  Heart,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Header from "../header";
import { Button } from "../ui/button";

export default function Career() {

  return (
    <div>
      <div className="sticky top-0 z-50 bg-[#F5F9FC] ">
        <Header isCollapsed={false} title="Career Change" />
      </div>

      <div className="flex flex-col items-center justify-start">
        <img src="/career.png" alt="" className="w-[70%]" />
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
