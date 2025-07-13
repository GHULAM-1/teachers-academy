import { cn } from '@/lib/utils';

interface HeroProps {
  icon?: React.ReactNode;
  greeting?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Hero({ 
  icon,
  greeting = "",
  title = "Welcome to TeachersAcademy.ai",
  subtitle = "What is your goal today?",
  className
}: HeroProps) {
  return (
    <div
      className={cn(
        // Removed gradient classes:
        // "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800",
        "relative my-[32px] text-white rounded-xl p-8 overflow-hidden",
        className
      )}
      style={{
        backgroundImage: "url('/card-bg.png')", // Place your image in public/hero-bg.jpg
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        <div className="mb-2">
          {icon}
          <h1 className="text-2xl font-light text-blue-200">{greeting}</h1>
          <h2 className="text-[56px] font-bold">{title}</h2>
          <p className="text-[25px] text-[#FAFAF6]">{subtitle}</p>
        </div>
      </div>

      {/* Removed decorative gradient background elements */}
    </div>
  );
}