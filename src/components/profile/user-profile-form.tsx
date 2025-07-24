"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

export default function UserProfileForm() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [preferredName, setPreferredName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [studentsAndSubjects, setStudentsAndSubjects] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [exploringOpportunities, setExploringOpportunities] = useState("");
  const [additionalActivities, setAdditionalActivities] = useState("");
  const [topSkills, setTopSkills] = useState("");
  const [biggestObstacle, setBiggestObstacle] = useState("");
  const [weeklyTimeCommitment, setWeeklyTimeCommitment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error && error.code !== "PGRST116") {
        console.error(error);
      }
      if (data) {
        setPreferredName(data.preferred_name || "");
        setRoleTitle(data.role_title || "");
        setStudentsAndSubjects(data.students_and_subjects || "");
        setCareerGoals(data.career_goals || "");
        setExploringOpportunities(data.exploring_opportunities || "");
        setAdditionalActivities(data.additional_activities || "");
        setTopSkills(data.top_skills || "");
        setBiggestObstacle(data.biggest_obstacle || "");
        setWeeklyTimeCommitment(data.weekly_time_commitment || "");
      }
    };
    loadProfile();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      preferred_name: preferredName,
      role_title: roleTitle,
      students_and_subjects: studentsAndSubjects,
      career_goals: careerGoals,
      exploring_opportunities: exploringOpportunities,
      additional_activities: additionalActivities,
      top_skills: topSkills,
      biggest_obstacle: biggestObstacle,
      weekly_time_commitment: weeklyTimeCommitment,
      updated_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/mentor");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border border-[#02133B]/20 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-[#02133B]">Complete Your Profile</h1>
      <p className="text-sm text-[#02133B]/70 mb-6">
        Help us understand your background and goals so we can provide personalized guidance.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="preferredName" className="block text-sm font-medium text-[#02133B] mb-2">
            What would you prefer to be called?
          </label>
          <Input
            id="preferredName"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Your preferred name"
            required
          />
        </div>

        <div>
          <label htmlFor="roleTitle" className="block text-sm font-medium text-[#02133B] mb-2">
            What's your current role or title, and how long have you been in education?
          </label>
          <Textarea
            id="roleTitle"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g., High School Math Teacher for 5 years, Elementary Principal for 3 years"
            required
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="studentsAndSubjects" className="block text-sm font-medium text-[#02133B] mb-2">
            What kind of students or subjects do you usually teach or support?
          </label>
          <Textarea
            id="studentsAndSubjects"
            value={studentsAndSubjects}
            onChange={(e) => setStudentsAndSubjects(e.target.value)}
            placeholder="e.g., 9th-12th grade Algebra and Geometry, K-5 all subjects, Special needs students"
            required
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="careerGoals" className="block text-sm font-medium text-[#02133B] mb-2">
            What are your top 1–2 goals for your career or income over the next year?
          </label>
          <Textarea
            id="careerGoals"
            value={careerGoals}
            onChange={(e) => setCareerGoals(e.target.value)}
            placeholder="e.g., Increase income by $10k, Move into administration, Start tutoring business"
            required
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="exploringOpportunities" className="block text-sm font-medium text-[#02133B] mb-2">
            Why are you exploring new opportunities right now?
          </label>
          <Textarea
            id="exploringOpportunities"
            value={exploringOpportunities}
            onChange={(e) => setExploringOpportunities(e.target.value)}
            placeholder="e.g., Need extra income, Want career change, Looking for professional growth"
            required
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="additionalActivities" className="block text-sm font-medium text-[#02133B] mb-2">
            Are you doing anything beyond your main job — like freelancing, tutoring, selling materials, or job searching?
          </label>
          <Textarea
            id="additionalActivities"
            value={additionalActivities}
            onChange={(e) => setAdditionalActivities(e.target.value)}
            placeholder="e.g., Private tutoring on weekends, Selling lesson plans on TPT, Looking for admin positions"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="topSkills" className="block text-sm font-medium text-[#02133B] mb-2">
            What skills, talents, or experiences do you feel most confident about?
          </label>
          <Textarea
            id="topSkills"
            value={topSkills}
            onChange={(e) => setTopSkills(e.target.value)}
            placeholder="e.g., Classroom management, Curriculum design, Technology integration, Public speaking"
            required
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="biggestObstacle" className="block text-sm font-medium text-[#02133B] mb-2">
            What's been your biggest obstacle in trying to grow, change, or earn more?
          </label>
          <Textarea
            id="biggestObstacle"
            value={biggestObstacle}
            onChange={(e) => setBiggestObstacle(e.target.value)}
            placeholder="e.g., Limited time, Don't know where to start, Lack of connections, Need more credentials"
            required
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label htmlFor="weeklyTimeCommitment" className="block text-sm font-medium text-[#02133B] mb-2">
            How much time per week can you realistically invest in your growth right now?
          </label>
          <Input
            id="weeklyTimeCommitment"
            value={weeklyTimeCommitment}
            onChange={(e) => setWeeklyTimeCommitment(e.target.value)}
            placeholder="e.g., 2-3 hours per week, 1 hour on weekends, 30 minutes daily"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-[#02133B] text-white hover:bg-[#02133B]/90 py-3"
        >
          {loading ? "Saving Profile..." : "Complete Profile & Continue"}
        </Button>
      </form>
    </div>
  );
} 