import { FileText, Image as ImageIcon, File, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionAttachment } from "../types";

type AttachmentDisplayProps = {
  attachments: TransactionAttachment[];
};

const AttachmentDisplay = ({ attachments }: AttachmentDisplayProps) => {
  // Function to get file icon based on file type
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) {
      // Adobe PDF icon (simplified)
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="bg-red-600 rounded w-8 h-8 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs text-gray-500 mt-1">PDF</span>
        </div>
      );
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".png")) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="bg-blue-500 rounded w-8 h-8 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs text-gray-500 mt-1">Image</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-500 rounded w-8 h-8 flex items-center justify-center">
            <File className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs text-gray-500 mt-1">File</span>
        </div>
      );
    }
  };

  // Function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-slate-50 transition-colors"
        >
          <div className="mr-3">{getFileIcon(attachment.name)}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {attachment.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="ml-2 text-blue-600 hover:bg-blue-50 p-1 h-auto"
            asChild
          >
            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentDisplay;
