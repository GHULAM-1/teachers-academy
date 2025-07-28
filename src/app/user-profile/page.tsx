import UserProfileForm from "@/components/profile/user-profile-form";
import MaterialsDisplay from "@/components/career/materials-display";

export default function UserProfilePage() {
  return (
    <div className="p-6 space-y-8">
      <UserProfileForm />
      <MaterialsDisplay />
    </div>
  );
} 