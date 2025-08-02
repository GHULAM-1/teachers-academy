import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Download,
  Edit,
  FileText,
  FileDown,
  Linkedin,
  Mail,
  Newspaper,
  Pen,
} from "lucide-react";

interface MaterialCardProps {
  title: string;
  lastEdited: string;
  content: string;
  materialType: "resume" | "cover_letter" | "linkedin" | "outreach";
  onEdit?: (content: string) => void;
  onDownload?: (fileType: "pdf" | "docx") => void;
}

const materialIcons = {
  resume: <Newspaper />,
  cover_letter: <FileText />,
  linkedin: <Linkedin />,
  outreach: <Mail />,
};

export default function MaterialCard({
  title,
  lastEdited,
  content,
  materialType,
  onEdit,
  onDownload,
}: MaterialCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleSave = () => {
    onEdit?.(editedContent);
    setIsEditOpen(false);
  };

  const handleDownload = (fileType: "pdf" | "docx") => {
    onDownload?.(fileType);
  };

  return (
    <>
      <Card className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-[16px] justify-between">
          <div>
            <span className="text-2xl text-primary-gold">
              {materialIcons[materialType]}
            </span>
          </div>
          <div className="flex flex-col gap-[16px] items-start space-x-3">
            <div className="m-0">
              <h3 className="font-semibold text-primary-text mb-[12px] text-base">
                {title}
              </h3>
              <p className="text-[13px] text-primary-text">
                Last edited: {lastEdited}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="h-8 px-3 hover:cursor-pointer bg-[#F7F8FA] border-gray-300 hover:bg-gray-50"
              >
                <Pen className="h-4 w-4 mr-1" />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 hover:cursor-pointer bg-[#F7F8FA] border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload("pdf")} className="hover:cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload("docx")} className="hover:cursor-pointer">
                    <FileDown className="h-4 w-4 mr-2" />
                    Download as DOC
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Sidebar */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="w-[600px] sm:w-[800px] px-6 rounded-tl-xl rounded-bl-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-lg">{materialIcons[materialType]}</span>
              Edit {title}
            </SheetTitle>
          </SheetHeader>
                    <div className="mt-6 space-y-4 h-full flex flex-col">
            <div className="space-y-2 flex-1 h-[60%]">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-[96%] bg-[#02133B]/10 min-h-[380px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-text"
                placeholder={`Edit your ${materialType.replace(
                  "_",
                  " "
                )} content...`}
              />
            </div>
            
            <div className="flex items-center justify-center space-x-2 pt-4 pb-6 mt-auto w-full">
              <Button variant="outline" className="hover:cursor-pointer flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button className="hover:cursor-pointer flex-1" onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
