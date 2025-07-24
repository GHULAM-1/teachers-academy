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

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("name, address")
        .eq("id", user.id)
        .single();
      if (error && error.code !== "PGRST116") {
        console.error(error);
      }
      if (data) {
        setName(data.name || "");
        setAddress(data.address || "");
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
      name,
      address,
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
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg border border-[#02133B]/20 mt-8">
      <h1 className="text-2xl font-bold mb-4 text-[#02133B]">User Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#02133B] mb-1">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-[#02133B] mb-1">
            Address
          </label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your address"
            required
            className="min-h-[80px]"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="bg-[#02133B] text-white hover:bg-[#02133B]/90">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
} 