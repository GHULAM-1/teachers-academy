"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowRight,
  ExternalLink,
  Menu,
  MessageCircle,
  ChevronRight,
  Eye,
  Loader2,
  User,
  Linkedin,
  Briefcase,
} from "lucide-react";
import {
  getAllCareerMaterialsFromProfileClient,
  CareerMaterial,
  MaterialType,
  downloadFile,
} from "@/lib/career-materials";
import { getJobSearchTermsFromCareerChatClient } from "@/lib/career-chat-store";
import { createClient } from "@/lib/supabase";
import MaterialCard from "@/components/material-card";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );

  // Step progress configuration
  const STEPS = [
    {
      id: "discover",
      name: "Discover",
      description: "Explore potential career paths",
    },
    {
      id: "create",
      name: "Create Materials",
      description: "Build professional materials",
    },
    {
      id: "apply",
      name: "Apply",
      description: "Apply to jobs and opportunities",
    },
  ];

  const currentStep = "apply"; // This is the apply dashboard
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };

  const handleRedirectToProfile = () => {
    router.push("/user-profile");
  };

  const handleFeelingStuck = () => {
    router.push("/mentor?mode=stuck");
  };

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get the most recent career chat
        const { data: recentChat } = await supabase
          .from("career_chats")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (recentChat) {
          const terms = await getJobSearchTermsFromCareerChatClient(
            recentChat.id
          );
          setJobSearchTerms(terms);
          console.log("🔍 Job search terms from career chat:", terms);

          // If no terms found, automatically generate them
          if (!terms) {
            console.log("🔄 No job search terms found, auto-generating...");
            await handleGenerateJobTerms();
          }
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
        const response = await fetch("/api/motivational-quote");

        if (response.ok) {
          const data = await response.json();
          setMotivationalQuote(
            data.quote ||
              "Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career."
          );
        } else {
          // Fallback quote if API fails
          setMotivationalQuote(
            "Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career."
          );
        }
      } catch (error) {
        console.error("Error fetching motivational quote:", error);
        // Fallback quote
        setMotivationalQuote(
          "Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career."
        );
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get the most recent career chat
      const { data: recentChat } = await supabase
        .from("career_chats")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!recentChat) {
        console.error("No career chat found");
        return;
      }

      // Call API to generate job search terms
      const response = await fetch("/api/career/generate-job-terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {STEPS.map((step, index) => {
              // Determine if this step should be active
              const isActive = index <= currentStepIndex;

              return (
                <div
                  key={step.id}
                  className="flex items-center justify-center flex-1"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isActive
                        ? "bg-[#02133B] text-white border-[#02133B]"
                        : "bg-white text-[#02133B]/50 border-[#02133B]/20"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-3 flex-1 max-w-[210px]">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? "text-[#02133B]" : "text-[#02133B]/50"
                      }`}
                    >
                      {step.name}
                    </div>
                    <div
                      className={`text-xs ${
                        isActive ? "text-[#02133B]/70" : "text-[#02133B]/40"
                      }`}
                    >
                      {step.description}
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex items-center ml-4">
                      <div
                        className={`w-8 h-0.5 ${
                          isActive ? "bg-[#02133B]" : "bg-[#02133B]/20"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="my-8">
          <p className="text-primary-text text-center">
            Track your application here{" "}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col gap-6 w-[75%]">
            {/* Find Jobs */}
            <Card className="bg-white gap-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Find Jobs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobTermsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      Loading job search terms...
                    </p>
                  </div>
                ) : !jobSearchTerms ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-3">
                      {generatingJobTerms
                        ? "Generating personalized job search terms based on your career chat..."
                        : "No job search terms found. Generating personalized terms based on your career chat..."}
                    </p>
                    {generatingJobTerms && (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">
                          Generating...
                        </span>
                      </div>
                    )}
                    {!generatingJobTerms && (
                      <Button
                        variant="outline"
                        onClick={handleGenerateJobTerms}
                        className="w-full"
                      >
                        Generate Job Search Terms
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start py-6 hover:bg-hover-blue"
                      asChild
                      disabled={!userProfile}
                    >
                      <a
                        href={generateJobSearchUrl("linkedin")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="/linked.png"
                          alt=""
                          className="mr-2 h-4 w-4"
                        />
                        LinkedIn
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start py-6 hover:bg-hover-blue"
                      asChild
                      disabled={!userProfile}
                    >
                      <a
                        href={generateJobSearchUrl("indeed")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="/indeed.png"
                          alt=""
                          className="mr-2 h-4 w-4"
                        />
                        Indeed
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start py-6 hover:bg-hover-blue"
                      asChild
                      disabled={!userProfile}
                    >
                      <a
                        href={generateJobSearchUrl("flexjobs")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src="/flex.png" alt="" className="mr-2 h-4 w-4" />
                        FlexJobs
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start py-6 hover:bg-hover-blue"
                      asChild
                      disabled={!userProfile}
                    >
                      <a
                        href={generateJobSearchUrl("google")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="/google.png"
                          alt=""
                          className="mr-2 h-4 w-4"
                        />
                        Google Jobs
                      </a>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Motivation & Mindset */}

            <div>
              <div className="bg-white flex flex-col gap-[32px] rounded-xl p-6">
                <div>
                  <CardHeader className="pb-[16px] pt-0 px-0">
                    <CardTitle className="text-lg font-semibold">
                      Motivation & Mindset
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {quoteLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          Generating inspiration...
                        </p>
                      </div>
                    ) : (
                      <>
                        <blockquote className="text-sm italic text-gray-700 mb-4">
                          "{motivationalQuote}"
                        </blockquote>
                      </>
                    )}
                  </CardContent>
                </div>
                <div>
                  <CardHeader className="pb-[16px] pt-0 px-0">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      Feeling stuck ?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-primary-text pb-4 text-[16px]">
                      Stuck on what's next? Your AI has answers.
                    </p>
                    <Button
                      className="text-primary-gold rounded-[12px] hover:cursor-pointer bg-transparent hover:bg-transparent border-primary-gold border-[1px]"
                      size="lg"
                      onClick={handleFeelingStuck}
                    >
                      Ask AI MENTOR
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[35%] h-full">
            {/* My Materials */}
            <Card className="bg-white h-[666px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  My Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      Loading materials...
                    </p>
                  </div>
                              ) : materials.length > 0 ? (
                <div className="space-y-4">
                  {materials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      title={material.name}
                      lastEdited={material.created_at ? new Date(material.created_at).toLocaleString() : 'Unknown'}
                      content={material.content || ''}
                      materialType={material.type}
                      onEdit={(updatedContent) => {
                        console.log('Material updated:', updatedContent);
                        // Here you can add logic to save the updated content
                      }}
                      onDownload={async (fileType) => {
                        try {
                          console.log(`Downloading ${material.name} as ${fileType}`);
                          const content = material.content || '';
                          const fileName = `${material.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileType}`;
                          
                          await downloadFile(content, fileName, fileType);
                        } catch (error) {
                          console.error('Error downloading file:', error);
                        }
                      }}
                    />
                  ))}
                </div>
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
          </div>
        </div>
      </div>

      {/* Material Content Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent className="w-[600px] px-5 sm:w-[800px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              {selectedMaterial?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedMaterial?.content ? (
              <div className="bg-gray-50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {selectedMaterial.content}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No content available for this material.
                </p>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleRedirectToProfile}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Go to Profile
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
