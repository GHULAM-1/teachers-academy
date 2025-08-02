"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  saveCareerMaterialToProfileClient,
  MaterialType,
  downloadFile,
  generateFileContent,
} from "@/lib/career-materials";
import { useAuth } from "@/components/auth/auth-provider";
import { Edit, Save, X, Loader2, Check, Download, Pen } from "lucide-react";

interface InlineEditableMaterialProps {
  materialType: MaterialType;
  content: string;
  title: string;
  onSave: (updatedContent: string) => void;
  onCancel: () => void;
}

const materialIcons = {
  resume: "📄",
  cover_letter: "📝",
  linkedin: "💼",
  outreach: "📧",
};

export default function InlineEditableMaterial({
  materialType,
  content,
  title,
  onSave,
  onCancel,
}: InlineEditableMaterialProps) {
  const { user } = useAuth();

  // Extract content without the identifier for editing
  const getContentWithoutIdentifier = (
    content: string,
    materialType: MaterialType
  ) => {
    const identifier = `[${materialType.toUpperCase()}]`;
    if (content.startsWith(identifier)) {
      return content.substring(identifier.length).trim();
    }
    return content;
  };

  const [editedContent, setEditedContent] = useState(
    getContentWithoutIdentifier(content, materialType)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToProfile, setIsSavingToProfile] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      // Save the content without the identifier to the database
      await saveCareerMaterialToProfileClient(
        user.id,
        materialType,
        editedContent,
        title
      );

      // Return the content with the identifier for the chat message
      const identifier = `[${materialType.toUpperCase()}]`;
      const contentWithIdentifier = `${identifier}\n${editedContent}`;
      onSave(contentWithIdentifier);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving material:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(getContentWithoutIdentifier(content, materialType)); // Reset to original content without identifier
    setIsEditing(false);
    onCancel();
  };

  const handleSaveToProfile = async () => {
    if (!user) return;

    try {
      setIsSavingToProfile(true);
      const contentWithoutIdentifier = getContentWithoutIdentifier(
        content,
        materialType
      );
      await saveCareerMaterialToProfileClient(
        user.id,
        materialType,
        contentWithoutIdentifier,
        title
      );
      console.log("Material saved to profile successfully");
    } catch (error) {
      console.error("Error saving material to profile:", error);
    } finally {
      setIsSavingToProfile(false);
    }
  };

  const handleDownload = async (fileType: "txt" | "pdf" | "docx" = "txt") => {
    try {
      const loadingKey = `${materialType}_${fileType}`;
      setDownloadLoading(loadingKey);
      const fileContent = generateFileContent(content, materialType);
      const fileName = `${materialType}_${
        new Date().toISOString().split("T")[0]
      }.${fileType}`;
      await downloadFile(fileContent, fileName, fileType);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setDownloadLoading(null);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-3 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{materialIcons[materialType]}</span>
          <span className="text-sm font-medium text-gray-700">
            Editing {materialType.replace("_", " ")}
          </span>
        </div>
        <div className="border rounded-lg p-3 bg-white">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder={`Edit your ${materialType.replace(
              "_",
              " "
            )} content...`}
            className="min-h-[300px] resize-none text-sm border-0 focus:outline-none shadow-none"
            style={{ boxShadow: "none" }}
          />
          <div className="flex items-center gap-2 justify-between pt-2 border-t border-gray-200">
            <div className="w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="text-xs w-full px-3 py-1 h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
            <div className="w-full">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs w-full px-3 py-1 h-8"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex border-[1px] p-[16px] rounded-[12px] items-center justify-between mb-2">
        <div className="flex  items-center space-x-2">
          <span className="text-lg">{materialIcons[materialType]}</span>
          <span className="text-sm font-medium text-gray-700">
            {materialType.replace("_", " ").toUpperCase()}
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
            className="h-7 px-2 bg-[#F7F8FA] hover:cursor-pointer"
          >
            <Pen className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveToProfile}
            disabled={isSavingToProfile}
            className="h-7 px-2 bg-[#F7F8FA] hover:cursor-pointer"
          >
            {isSavingToProfile ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save to Profile
          </Button>
        </div>
      </div>
      <div className="bg-[#02133B]/10 p-3 rounded-md border">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
          {content}
        </pre>
        <div className="flex space-x-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload("pdf")}
            disabled={downloadLoading !== null}
            className="flex-1 py-3 hover:cursor-pointer"
          >
            {downloadLoading === `${materialType}_pdf` ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload("docx")}
            disabled={downloadLoading !== null}
            className="flex-1 py-3 hover:cursor-pointer"
          >
            {downloadLoading === `${materialType}_docx` ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            DOCX
          </Button>
        </div>
      </div>
    </div>
  );
}
