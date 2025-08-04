import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeroProps {
  className?: string;
}

export default function Hero({
  className,
}: HeroProps) {
  const router = useRouter();
  return (
    <div
      className={cn(
        // Removed gradient classes:
        // "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800",
        "relative p-[32px] text-white flex items-center justify-center rounded-xl h-[384px] overflow-hidden",
        className
      )}
      style={{
        backgroundImage: "url('/card-bg.png')", // Place your image in public/hero-bg.jpg
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Content */}
      <div className="relative z-10 text-primary-text">
        <div className="mb-2 flex flex-col items-center">
          <h1 className="text-[36px] font-bold mb-[16px]">Welcome</h1>
          <h2 className="text-[16px] mb-[32px] ">
            Your general guide for career advice and feedback
          </h2>
          <Button variant="outline" onClick={() => router.push("/mentor")} className="hover:bg-transparent hover:cursor-pointer bg-transparent border-[2px] border-primary-gold rounded-[8px]">
            <p className="text-[16px] font-semibold text-primary-gold">ASK AI MENTOR</p>
            <ArrowRight className="w-4 h-4 text-primary-gold" />
          </Button>
        </div>
      </div>

      {/* Removed decorative gradient background elements */}
    </div>
  );
}
