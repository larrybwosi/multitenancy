'use client'
import { QRUploadModal } from "@/components/file-upload-device";
import { Button } from "@/components/ui";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Example usage in a form
export default function ExampleFormWithQRUpload() {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Example Form</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium">Profile Image</label>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Image URL"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <QRUploadModal
            onImageUploaded={setImageUrl}
            trigger={
              <Button variant="outline" type="button">
                <Camera className="w-4 h-4 mr-2" />
                Upload from Phone
              </Button>
            }
          />
        </div>
        {imageUrl && (
          <div className="mt-3">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
              <Image src={imageUrl} alt="Selected image" fill className="object-cover" />
            </div>
          </div>
        )}
      </div>

      <Button>Save Form</Button>
    </div>
  );
}
