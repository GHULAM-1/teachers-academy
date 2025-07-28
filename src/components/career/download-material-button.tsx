"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadFile, generateFileContent, MaterialType } from '@/lib/career-materials';

interface DownloadMaterialButtonProps {
  content: string;
  materialType: MaterialType;
  fileName?: string;
  className?: string;
}

export default function DownloadMaterialButton({ 
  content, 
  materialType, 
  fileName,
  className = '' 
}: DownloadMaterialButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const defaultFileName = `${materialType}_${new Date().toISOString().split('T')[0]}`;
  const finalFileName = fileName || defaultFileName;

  const handleDownload = async (fileType: 'txt' | 'pdf' | 'docx' = 'txt') => {
    try {
      setLoading(fileType);
      const fileContent = generateFileContent(content, materialType);
      const finalFileNameWithExt = `${finalFileName}.${fileType}`;
      await downloadFile(fileContent, finalFileNameWithExt, fileType);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleDownload('pdf')}
        disabled={loading !== null}
        className="text-xs"
      >
        {loading === 'pdf' ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Download className="h-3 w-3 mr-1" />
        )}
        PDF
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleDownload('docx')}
        disabled={loading !== null}
        className="text-xs"
      >
        {loading === 'docx' ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Download className="h-3 w-3 mr-1" />
        )}
        DOCX
      </Button>
    </div>
  );
} 