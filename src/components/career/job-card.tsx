"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface JobMatch {
  job: {
    id: string;
    title: string;
    shortDescription: string;
    detailedDescription: string;
    salaryRange: string;
    requirements: string[];
    resources: string[];
  };
  score: number;
  fitLevel: string;
  reasons: string[];
}

interface JobCardProps {
  jobMatch: JobMatch;
  index: number;
  onLearnMore: (jobMatch: JobMatch) => void;
  onSelect: (jobMatch: JobMatch) => void;
}

export default function JobCard({ jobMatch, index, onLearnMore, onSelect }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Safety check for undefined jobMatch
  if (!jobMatch || !jobMatch.job) {
    return null;
  }

  const getFitLevelColor = (fitLevel: string) => {
    switch (fitLevel.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-[#02133B]">
                {jobMatch.job.title}
              </CardTitle>
              <Badge className={getFitLevelColor(jobMatch.fitLevel)}>
                {jobMatch.fitLevel} Match
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {jobMatch.job.shortDescription}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>💰 {jobMatch.job.salaryRange}</span>
              <span>•</span>
              <span>{jobMatch.score}% match</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Detailed Description */}
            <div>
              <h4 className="font-medium text-[#02133B] mb-2">📘 Detailed Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {jobMatch.job.detailedDescription}
              </p>
            </div>

            {/* Why You're a Match */}
            <div>
              <h4 className="font-medium text-[#02133B] mb-2">✅ Why You're a Match</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {jobMatch.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            {jobMatch.job.requirements.length > 0 && (
              <div>
                <h4 className="font-medium text-[#02133B] mb-2">📋 Requirements</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {jobMatch.job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {jobMatch.job.resources.length > 0 && (
              <div>
                <h4 className="font-medium text-[#02133B] mb-2">🔗 Resources</h4>
                <div className="space-y-2">
                  {jobMatch.job.resources.map((resource, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3 w-3 text-gray-500" />
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {resource}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onSelect(jobMatch)}
                className="flex-1 bg-[#02133B] hover:bg-[#02133B]/90"
              >
                Explore This Path
              </Button>
              <Button
                variant="outline"
                onClick={() => onLearnMore(jobMatch)}
                className="flex-1"
              >
                Ask AI About This Job
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {!isExpanded && (
        <CardContent className="pt-0">
                      <div className="flex gap-2">
              <Button
                onClick={() => onSelect(jobMatch)}
                className="flex-1 bg-[#02133B] hover:bg-[#02133B]/90"
              >
                Explore This Path
              </Button>
              <Button
                variant="outline"
                onClick={() => onLearnMore(jobMatch)}
                className="flex-1"
              >
                Ask AI About This Job
              </Button>
            </div>
        </CardContent>
      )}
    </Card>
  );
} 