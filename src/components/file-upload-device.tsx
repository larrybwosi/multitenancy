'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import Image from 'next/image';
import { pusherClient } from '@/utils/pusher';
import { Camera, Upload, CheckCircle } from 'lucide-react';

interface QRUploadModalProps {
  trigger?: React.ReactNode;
  onImageUploaded?: (imageUrl: string) => void;
  onClose?: () => void;
}

export function QRUploadModal({ trigger, onImageUploaded, onClose }: QRUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Generate session and setup Pusher when modal opens
  useEffect(() => {
    if (open) {
      initializeSession();
    } else {
      // Clean up when modal closes
      if (sessionId) {
        pusherClient.unsubscribe(`session-${sessionId}`);
      }
      setUploadedImage('');
      setIsConnected(false);
      setIsUploading(false);
    }
  }, [open]);

  const initializeSession = () => {
    // Generate session ID
    const newSessionId = Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);

    // Generate QR code
    const uploadUrl = `${window.location.origin}/upload/${newSessionId}`;
    QRCode.toDataURL(uploadUrl, { width: 300, margin: 2 }).then(setQrCodeUrl).catch(console.error);

    // Setup Pusher connection
    const channel = pusherClient.subscribe(`session-${newSessionId}`);

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
    });

    channel.bind('upload-started', () => {
      setIsUploading(true);
    });

    channel.bind('image-uploaded', (data: { imageUrl: string }) => {
      setUploadedImage(data.imageUrl);
      setIsUploading(false);
    });
  };

  const handleUseImage = () => {
    if (uploadedImage && onImageUploaded) {
      onImageUploaded(uploadedImage);
    }
    setOpen(false);
    onClose?.();
  };

  const resetSession = () => {
    setUploadedImage('');
    setIsUploading(false);

    // Unsubscribe from old channel
    if (sessionId) {
      pusherClient.unsubscribe(`session-${sessionId}`);
    }

    // Initialize new session
    initializeSession();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Camera className="w-4 h-4" />
      Upload from Phone
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Image from Phone
          </DialogTitle>
          <DialogDescription>Scan the QR code with your phone to easily upload an image</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected - Ready to receive uploads' : 'Connecting...'}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code / Upload Result Section */}
            <div className="space-y-6">
              {uploadedImage ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Image uploaded successfully!</span>
                  </div>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <Image src={uploadedImage} alt="Uploaded image" fill className="object-cover" />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleUseImage} className="flex-1">
                      Use This Image
                    </Button>
                    <Button variant="outline" onClick={resetSession}>
                      Upload Another
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  {isUploading && (
                    <div className="text-blue-600 mb-4">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <span className="text-sm font-medium">Processing upload...</span>
                    </div>
                  )}
                  {qrCodeUrl && (
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      <Image src={qrCodeUrl} alt="QR Code" width={250} height={250} className="max-w-full h-auto" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">Scan this QR code with your phone&#39;s camera</p>
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">How it works</h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Scan the QR Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Open your phone&#39;s camera and point it at the QR code
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Choose Your Image</h4>
                    <p className="text-sm text-muted-foreground">Take a new photo or select from your gallery</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Image Appears Here</h4>
                    <p className="text-sm text-muted-foreground">Your image will appear instantly on this screen</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 text-blue-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-blue-800 font-medium text-sm">Note</span>
                    <p className="text-blue-700 text-sm mt-1">
                      Make sure your phone has internet connection for the upload to work.
                    </p>
                  </div>
                </div>
              </div>

              {sessionId && (
                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Session: <span className="font-mono">{sessionId}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

