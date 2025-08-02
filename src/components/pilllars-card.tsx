import React from 'react';
import { Briefcase, BookOpen, Award, Rocket } from 'lucide-react';
import Link from 'next/link';

interface PillarsCardProps {
  title: string;
  description: string;
  icon: 'briefcase' | 'book' | 'award' | 'rocket';
  href: string;
  className?: string;
}

const iconMap = {
  briefcase: Briefcase,
  book: BookOpen,
  award: Award,
  rocket: Rocket,
};

export default function PillarsCard({ 
  title, 
  description, 
  icon, 
  href, 
  className = "" 
}: PillarsCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <Link href={href} className="block">
      <div className={`bg-white rounded-[16px]   px-[32px] py-[16px] shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}>
        <div className="flex items-center gap-[32px]">
          {/* Icon */}
          <div className="flex-shrink-0">
            <IconComponent className="w-8 h-8 text-primary-text" />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-primary-text mb-2">
              {title}
            </h3>
            <p className="text-[16px] text-primary-text ">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
