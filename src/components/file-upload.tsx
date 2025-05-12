import { useState, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { File, Upload, FileText, Image as ImageIcon, Link, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Image from 'next/image';

interface FileUploadProps {
  description: string;
  defaultUploadAsFile?: boolean;
  onUploadSuccess?: (url: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ description, defaultUploadAsFile = false, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadAsFile, setUploadAsFile] = useState<boolean>(defaultUploadAsFile);
  const [manualUrl, setManualUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (file: File | string): boolean => {
    if (typeof file === 'string') {
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
    }
    return file.type.startsWith('image/');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadedUrl(null);

    if (isImage(selectedFile)) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setUploadAsFile(false); // Default to image mode for image files
    } else {
      setPreviewUrl(null);
      setUploadAsFile(true); // Auto-set to file mode for non-image files
    }
  };

  const handleUrlSubmit = () => {
    if (!manualUrl) {
      toast.error('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(manualUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setUploadedUrl(manualUrl);
    if (onUploadSuccess) {
      onUploadSuccess(manualUrl);
    }
    toast.success('URL set successfully!');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/upload?file=${uploadAsFile}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: { url: string; id: string } = await response.json();
      setUploadedUrl(data.url);
      if (onUploadSuccess) {
        onUploadSuccess(data.url);
      }
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error(`Upload failed: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setUploadedUrl(null);

      if (isImage(droppedFile)) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(droppedFile);
        setUploadAsFile(false);
      } else {
        setPreviewUrl(null);
        setUploadAsFile(true);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Card className="max-w-md mx-auto">
      <Toaster richColors position="top-right" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5" />
          File Upload
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">Set URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="space-y-4" onDrop={handleDrop} onDragOver={handleDragOver}>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="file-upload">Select File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="w-full cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload file"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center py-2">or drag and drop files here</p>
              </div>

              {file && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isImage(file) ? (
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>

                  {isImage(file) && previewUrl && (
                    <div className="relative h-48 rounded-md overflow-hidden border">
                      <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full mt-4">
                {isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadAsFile ? 'Upload File' : 'Upload Image'}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="file-url">File URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={manualUrl}
                    onChange={e => setManualUrl(e.target.value)}
                    className="w-full"
                  />
                  <Button variant="outline" size="icon" onClick={handleUrlSubmit} title="Set URL">
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {uploadedUrl && isImage(uploadedUrl) && (
                <div className="relative h-48 rounded-md overflow-hidden border">
                  <Image src={uploadedUrl} alt="Preview" fill className="object-contain" />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {uploadedUrl && (
          <div className="pt-4">
            <Label>Uploaded {isImage(uploadedUrl) ? 'Image' : 'File'}</Label>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                {isImage(uploadedUrl) ? <ImageIcon className="w-3 h-3" /> : <File className="w-3 h-3" />}
                {uploadedUrl}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
