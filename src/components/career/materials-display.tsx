"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllCareerMaterialsFromProfileClient, downloadFile, generateFileContent, MaterialType } from '@/lib/career-materials';
import { useAuth } from '@/components/auth/auth-provider';
import { Download, FileText, FileEdit, Linkedin, Mail, Loader2, Edit } from 'lucide-react';
import EditableMaterial from './editable-material';
import MaterialCard from '@/components/material-card';

interface MaterialsDisplayProps {
  className?: string;
}

const materialIcons = {
  resume: FileText,
  cover_letter: FileEdit,
  linkedin: Linkedin,
  outreach: Mail
};

const materialColors = {
  resume: 'bg-blue-100 text-blue-800',
  cover_letter: 'bg-green-100 text-green-800',
  linkedin: 'bg-purple-100 text-purple-800',
  outreach: 'bg-orange-100 text-orange-800'
};

export default function MaterialsDisplay({ className = '' }: MaterialsDisplayProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Record<MaterialType, any>>({
    resume: null,
    cover_letter: null,
    linkedin: null,
    outreach: null
  });
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading materials for user:', user.id);
      const userMaterials = await getAllCareerMaterialsFromProfileClient(user.id);
      console.log('🔍 Retrieved materials:', userMaterials);
      setMaterials(userMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialType: MaterialType, content: string, fileName: string, fileType: 'txt' | 'pdf' | 'docx' = 'txt') => {
    try {
      const loadingKey = `${materialType}_${fileType}`;
      setDownloadLoading(loadingKey);
      const fileContent = generateFileContent(content, materialType);
      const finalFileName = fileName.replace(/\.txt$/, `.${fileType}`);
      await downloadFile(fileContent, finalFileName, fileType);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = (materialType: MaterialType) => {
    setEditingMaterial(materialType);
  };

  const handleSaveEdit = (materialType: MaterialType, updatedContent: string) => {
    setMaterials(prev => ({
      ...prev,
      [materialType]: {
        ...prev[materialType],
        content: updatedContent,
        created_at: new Date().toISOString()
      }
    }));
    setEditingMaterial(null);
  };

  const handleCancelEdit = () => {
    setEditingMaterial(null);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900">Your Career Materials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasAnyMaterials = Object.values(materials).some(material => material !== null);

  if (!hasAnyMaterials) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900">Your Career Materials</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-center">
              No materials generated yet. Start a career chat to create your resume, cover letter, and other materials!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900">Your Career Materials</h2>
      
      {/* Show editable component if editing */}
      {editingMaterial && materials[editingMaterial] && (
        <EditableMaterial
          materialType={editingMaterial}
          content={materials[editingMaterial].content}
          title={materials[editingMaterial].title}
          onSave={(updatedContent) => handleSaveEdit(editingMaterial, updatedContent)}
          onCancel={handleCancelEdit}
        />
      )}
      
      {/* Show materials grid if not editing */}
      {!editingMaterial && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(materials).map(([type, material]) => {
            if (!material) return null;
            
            const Icon = materialIcons[type as MaterialType];
            const colorClass = materialColors[type as MaterialType];
            
            return (
              <Card key={type} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-lg capitalize">
                        {type.replace('_', ' ')}
                      </CardTitle>
                    </div>
                    <Badge className={colorClass}>
                      {material.title}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(material.created_at)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {material.content.substring(0, 200)}...
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(type as MaterialType)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(type as MaterialType, material.content, material.file_name, 'pdf')}
                      disabled={downloadLoading !== null}
                      className="flex-1"
                    >
                      {downloadLoading === `${type}_pdf` ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(type as MaterialType, material.content, material.file_name, 'docx')}
                      disabled={downloadLoading !== null}
                      className="flex-1"
                    >
                      {downloadLoading === `${type}_docx` ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      DOCX
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 