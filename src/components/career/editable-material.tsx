"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { saveCareerMaterialToProfileClient, MaterialType } from '@/lib/career-materials';
import { useAuth } from '@/components/auth/auth-provider';
import { Edit, Save, X, Loader2 } from 'lucide-react';

interface EditableMaterialProps {
  materialType: MaterialType;
  content: string;
  title: string;
  onSave: (updatedContent: string) => void;
  onCancel: () => void;
}

const materialIcons = {
  resume: '📄',
  cover_letter: '📝',
  linkedin: '💼',
  outreach: '📧'
};

const materialColors = {
  resume: 'bg-blue-100 text-blue-800',
  cover_letter: 'bg-green-100 text-green-800',
  linkedin: 'bg-purple-100 text-purple-800',
  outreach: 'bg-orange-100 text-orange-800'
};

export default function EditableMaterial({
  materialType,
  content,
  title,
  onSave,
  onCancel
}: EditableMaterialProps) {
  const { user } = useAuth();
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      await saveCareerMaterialToProfileClient(user.id, materialType, editedContent, title);
      onSave(editedContent);
    } catch (error) {
      console.error('Error saving material:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content); // Reset to original content
    onCancel();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{materialIcons[materialType]}</span>
            <CardTitle className="text-lg capitalize">
              Edit {materialType.replace('_', ' ')}
            </CardTitle>
          </div>
          <Badge className={materialColors[materialType]}>
            {title}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Content
          </label>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder={`Edit your ${materialType.replace('_', ' ')} content...`}
            className="min-h-[400px] resize-none"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 