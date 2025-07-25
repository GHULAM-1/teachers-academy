"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, Play, ChevronDown, ChevronUp } from "lucide-react";
import { JobMatch } from "@/lib/job-matching";

interface JobCardProps {
  jobMatch: JobMatch;
  onStartPath: (jobId: string) => void;
}

export default function JobCard({ jobMatch, onStartPath }: JobCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { job, fitLevel, reasons, score } = jobMatch;

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'Perfect Fit': return 'bg-green-100 text-green-800 border-green-200';
      case 'Strong Fit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Good Fit': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="border border-[#02133B]/20 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#02133B] mb-2">{job.title}</h3>
          <p className="text-[#02133B]/70 text-sm mb-3">{job.shortDescription}</p>
          <div className="flex items-center space-x-2">
            <Badge className={`${getFitColor(fitLevel)} border font-medium`}>
              {fitLevel}
            </Badge>
            <span className="text-xs text-[#02133B]/50">Match Score: {score}%</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 mb-4">
        <Button
          onClick={() => onStartPath(job.id)}
          className="bg-[#02133B] text-white hover:bg-[#02133B]/90 flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>Start This Path</span>
        </Button>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          className="border-[#02133B]/20 text-[#02133B] hover:bg-[#E4EDFF] flex items-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>Learn More</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="border-t border-[#02133B]/10 pt-4 space-y-4">
          {/* Detailed Description */}
          <div>
            <h4 className="font-medium text-[#02133B] mb-2">📘 What You'll Do</h4>
            <p className="text-sm text-[#02133B]/70 leading-relaxed">{job.detailedDescription}</p>
          </div>

          {/* Salary Range */}
          <div>
            <h4 className="font-medium text-[#02133B] mb-2">💰 Estimated Salary</h4>
            <p className="text-sm text-[#02133B]/70">{job.salaryRange}</p>
          </div>

          {/* Why You're a Match */}
          <div>
            <h4 className="font-medium text-[#02133B] mb-2">✅ Why You're a Great Match</h4>
            <ul className="space-y-1">
              {reasons.map((reason, index) => (
                <li key={index} className="text-sm text-[#02133B]/70 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-medium text-[#02133B] mb-3">🔗 Helpful Resources</h4>
            <div className="space-y-2">
              {job.resources.dayInLifeVideo && (
                <a
                  href={job.resources.dayInLifeVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Watch "Day in the Life" videos</span>
                </a>
              )}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(job.resources.searchQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Google search: {job.resources.searchQuery}</span>
              </a>
              <a
                href={job.resources.jobBoardLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View current job openings</span>
              </a>
              {job.resources.blogPost && (
                <a
                  href={job.resources.blogPost}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Read detailed career guide</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 