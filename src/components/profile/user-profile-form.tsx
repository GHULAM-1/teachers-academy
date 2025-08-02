"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { FileText, Pen } from "lucide-react";
import { getAllCareerMaterialsFromProfileClient } from "@/lib/career-materials";
import MaterialCard from "../material-card";

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
  
  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const userMaterials = await getAllCareerMaterialsFromProfileClient(user.id);
          console.log("📄 Fetched user materials:", userMaterials);

          // Convert the Record structure to Material array
          const materialsArray: any[] = [];
          Object.entries(userMaterials).forEach(([type, material]) => {
            if (material) {
              materialsArray.push({
                id: type,
                name: material.title,
                type: type as any,
                created_at: material.created_at,
                file_name: material.file_name,
                content: material.content,
              });
            }
          });

          setMaterials(materialsArray);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

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

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveEdit = (field: string) => {
    switch (field) {
      case 'preferredName':
        setPreferredName(editValue);
        break;
      case 'roleTitle':
        setRoleTitle(editValue);
        break;
      case 'studentsAndSubjects':
        setStudentsAndSubjects(editValue);
        break;
      case 'careerGoals':
        setCareerGoals(editValue);
        break;
      case 'exploringOpportunities':
        setExploringOpportunities(editValue);
        break;
      case 'additionalActivities':
        setAdditionalActivities(editValue);
        break;
      case 'topSkills':
        setTopSkills(editValue);
        break;
      case 'biggestObstacle':
        setBiggestObstacle(editValue);
        break;
      case 'weeklyTimeCommitment':
        setWeeklyTimeCommitment(editValue);
        break;
    }
    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

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
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-4">
        {/* Left Column - Profile Questions */}
        <div className="space-y-4 w-[70%]">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question Cards */}
            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    What would you prefer to be called?
                  </h3>
                  {editingField === 'preferredName' ? (
                    <div className="space-y-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter your preferred name"
                        className="text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('preferredName')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {preferredName || <span className="text-gray-400 italic">Not provided</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'preferredName' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('preferredName', preferredName)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    What's your current role or title, and how long have you been in education?
                  </h3>
                  {editingField === 'roleTitle' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., High School Math Teacher for 5 years, Elementary Principal for 3 years"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('roleTitle')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {roleTitle || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'roleTitle' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('roleTitle', roleTitle)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    What kind of students or subjects do you usually teach or support?
                  </h3>
                  {editingField === 'studentsAndSubjects' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., 9th-12th grade Algebra and Geometry, K-5 all subjects, Special needs students"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('studentsAndSubjects')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {studentsAndSubjects || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'studentsAndSubjects' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('studentsAndSubjects', studentsAndSubjects)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    What are your top 1-2 goals for your career or income over the next year?
                  </h3>
                  {editingField === 'careerGoals' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., Increase income by $10k, Move into administration, Start tutoring business"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('careerGoals')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {careerGoals || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'careerGoals' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('careerGoals', careerGoals)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    Why are you exploring new opportunities right now?
                  </h3>
                  {editingField === 'exploringOpportunities' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., Need extra income, Want career change, Looking for professional growth"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('exploringOpportunities')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {exploringOpportunities || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'exploringOpportunities' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('exploringOpportunities', exploringOpportunities)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    Are you doing anything beyond your main job — like freelancing, tutoring, selling materials, or job searching?
                  </h3>
                  {editingField === 'additionalActivities' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., Private tutoring on weekends, Selling lesson plans on TPT, Looking for admin positions"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('additionalActivities')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {additionalActivities || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'additionalActivities' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('additionalActivities', additionalActivities)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    What skills, talents, or experiences do you feel most confident about?
                  </h3>
                  {editingField === 'topSkills' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., Classroom management, Curriculum design, Technology integration, Public speaking"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('topSkills')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {topSkills || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'topSkills' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('topSkills', topSkills)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    What's been your biggest obstacle in trying to grow, change, or earn more?
                  </h3>
                  {editingField === 'biggestObstacle' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., Limited time, Don't know where to start, Lack of connections, Need more credentials"
                        className="text-sm min-h-[80px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('biggestObstacle')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {biggestObstacle || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'biggestObstacle' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('biggestObstacle', biggestObstacle)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#02133B] mb-2">
                    How much time per week can you realistically invest in your growth right now?
                  </h3>
                  {editingField === 'weeklyTimeCommitment' ? (
                    <div className="space-y-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., 2-3 hours per week, 1 hour on weekends, 30 minutes daily"
                        className="text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('weeklyTimeCommitment')}
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {weeklyTimeCommitment || <span className="text-gray-400 italic">Turn your expertise into a profitable course with AI assistance.</span>}
                    </p>
                  )}
                </div>
                {editingField !== 'weeklyTimeCommitment' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEdit('weeklyTimeCommitment', weeklyTimeCommitment)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

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

        {/* Right Column - Career Materials */}
        <div className="space-y-4 w-[30%] bg-white rounded-lg p-4">
          <FileText className="h-8 w-8 text-primary-gold" />
          <h2 className="text-xl font-semibold text-[#02133B]">Your Career Materials</h2>
          
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Loading materials...</p>
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
                      
                      // Import and use the downloadFile function
                      const { downloadFile } = await import('@/lib/career-materials');
                      await downloadFile(content, fileName, fileType);
                    } catch (error) {
                      console.error('Error downloading file:', error);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="">
              <div className="flex items-center gap-3 mb-4">
              </div>
              <p className="text-sm text-primary-text">
                No materials generated yet. Start a career chat to create your resume, cover letter, and other materials!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 