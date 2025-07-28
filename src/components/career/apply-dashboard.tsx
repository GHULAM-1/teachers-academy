"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ExternalLink,
  Menu,
  MessageCircle,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import {
  getAllCareerMaterialsFromProfileClient,
  CareerMaterial,
  MaterialType,
  downloadFile,
} from "@/lib/career-materials";
import { getJobSearchTermsFromCareerChatClient } from "@/lib/career-chat-store";
import { createClient } from "@/lib/supabase";

interface Material {
  id: string;
  name: string;
  type: "resume" | "cover_letter" | "linkedin" | "outreach";
  version?: string;
  notes?: string;
  created_at?: string;
  file_name?: string;
  content?: string;
}

export default function ApplyDashboard() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [motivationalQuote, setMotivationalQuote] = useState<string>("");
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [jobSearchTerms, setJobSearchTerms] = useState<string | null>(null);
  const [jobTermsLoading, setJobTermsLoading] = useState(true);
  const [generatingJobTerms, setGeneratingJobTerms] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get current user
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No user found");
          return;
        }

        // Fetch user profile for career preferences
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "role_title, career_goals, exploring_opportunities, top_skills, students_and_subjects, job_search_terms"
          )
          .eq("id", user.id)
          .single();

        setUserProfile(profile);

        // Fetch materials
        const userMaterials = await getAllCareerMaterialsFromProfileClient(
          user.id
        );
        console.log("📄 Fetched user materials:", userMaterials);

        // Convert the Record structure to Material array
        const materialsArray: Material[] = [];
        Object.entries(userMaterials).forEach(([type, material]) => {
          if (material) {
            materialsArray.push({
              id: type,
              name: material.title,
              type: type as Material["type"],
              created_at: material.created_at,
              file_name: material.file_name,
              content: material.content,
            });
          }
        });

        setMaterials(materialsArray);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch job search terms from career chat
  useEffect(() => {
    const fetchJobSearchTerms = async () => {
      try {
        setJobTermsLoading(true);
        
        // Get current user
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Get the most recent career chat
        const { data: recentChat } = await supabase
          .from('career_chats')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentChat) {
          const terms = await getJobSearchTermsFromCareerChatClient(recentChat.id);
          setJobSearchTerms(terms);
          console.log("🔍 Job search terms from career chat:", terms);
        }
      } catch (error) {
        console.error("Error fetching job search terms:", error);
      } finally {
        setJobTermsLoading(false);
      }
    };

    fetchJobSearchTerms();
  }, []);

  // Fetch AI-generated motivational quote
  useEffect(() => {
    const fetchMotivationalQuote = async () => {
      try {
        setQuoteLoading(true);
        const response = await fetch('/api/motivational-quote');
        
        if (response.ok) {
          const data = await response.json();
          setMotivationalQuote(data.quote || "Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career.");
        } else {
          // Fallback quote if API fails
          setMotivationalQuote("Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career.");
        }
      } catch (error) {
        console.error("Error fetching motivational quote:", error);
        // Fallback quote
        setMotivationalQuote("Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career.");
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchMotivationalQuote();
  }, []);

  const generateJobSearchUrl = (platform: string) => {
    // Use AI-generated job search term from career chat
    // This is generated by the AI based on the conversation context
    console.log("🔍 AI-generated job term:", jobSearchTerms);
    // Clean the AI-generated term or use fallback
    const jobSearchTerm = jobSearchTerms
      ? jobSearchTerms
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "instructional designer"; // Fallback if no AI term generated yet

    const encodedSearchQuery = encodeURIComponent(jobSearchTerm);
    const location = "Remote"; // Default to remote jobs
    const encodedLocation = encodeURIComponent(location);

    switch (platform) {
      case "linkedin":
        return `https://linkedin.com/jobs/search/?keywords=${encodedSearchQuery}&location=${encodedLocation}&f_WT=2`;
      case "indeed":
        return `https://indeed.com/jobs?q=${encodedSearchQuery}&l=${encodedLocation}&sc=0kf%3Aattr(DSQF7)%3B`;
      case "flexjobs":
        return `https://flexjobs.com/search?search=${encodedSearchQuery}&location=${encodedLocation}`;
      case "google":
        return `https://www.google.com/search?q=${encodedSearchQuery}+jobs+${encodedLocation}&ibp=htl;jobs`;
      default:
        return "";
    }
  };

  const handleGenerateJobTerms = async () => {
    try {
      setGeneratingJobTerms(true);
      
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get the most recent career chat
      const { data: recentChat } = await supabase
        .from('career_chats')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!recentChat) {
        console.error("No career chat found");
        return;
      }

      // Call API to generate job search terms
      const response = await fetch('/api/career/generate-job-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: recentChat.id,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobSearchTerms(data.jobSearchTerms);
        console.log("✅ Generated job search terms:", data.jobSearchTerms);
      } else {
        console.error("Failed to generate job search terms");
      }
    } catch (error) {
      console.error("Error generating job search terms:", error);
    } finally {
      setGeneratingJobTerms(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Apply Dashboard
          </h1>
          <p className="text-gray-600">
            Track your job applications and manage your career materials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find Jobs */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Find Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobTermsLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading job search terms...</p>
                </div>
              ) : !jobSearchTerms ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">
                    No job search terms found. Generate personalized terms based on your career chat.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleGenerateJobTerms}
                    disabled={generatingJobTerms}
                    className="w-full"
                  >
                    {generatingJobTerms ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Job Search Terms'
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                    disabled={!userProfile}
                  >
                    <a
                      href={generateJobSearchUrl("linkedin")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      LinkedIn
                      <span className="ml-2 text-xs text-gray-500">
                        (Filtered)
                      </span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                    disabled={!userProfile}
                  >
                    <a
                      href={generateJobSearchUrl("indeed")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Indeed
                      <span className="ml-2 text-xs text-gray-500">
                        (Filtered)
                      </span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                    disabled={!userProfile}
                  >
                    <a
                      href={generateJobSearchUrl("flexjobs")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      FlexJobs
                      <span className="ml-2 text-xs text-gray-500">
                        (Filtered)
                      </span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                    disabled={!userProfile}
                  >
                    <a
                      href={generateJobSearchUrl("google")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Google Jobs
                      <span className="ml-2 text-xs text-gray-500">
                        (Filtered)
                      </span>
                    </a>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Motivation & Mindset */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Motivation & Mindset
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quoteLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Generating inspiration...</p>
                </div>
              ) : (
                <>
                  <blockquote className="text-sm italic text-gray-700 mb-4">
                    "{motivationalQuote}"
                  </blockquote>
                  <p className="text-xs text-gray-600 mb-4">—AI Career Coach</p>
                </>
              )}
              <Button variant="outline" size="sm" className="w-full">
                Feeling stuck?
              </Button>
            </CardContent>
          </Card>

          {/* My Materials */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                My Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading materials...</p>
                </div>
              ) : materials.length > 0 ? (
                materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-sm">{material.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push("/user-profile");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No materials found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create materials in the Create step
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feeling Stuck */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                Feeling stuck ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="/mentor">
                <Button
                  className="w-full hover:cursor-pointer bg-gray-800 hover:bg-gray-900"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask AI
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
