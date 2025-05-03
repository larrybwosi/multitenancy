import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw } from 'lucide-react';

// Mock function for generating a unique session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const QRImageUpload = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, waiting, uploading, uploaded, error

  // Generate a new session ID when the modal is opened
  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setStatus('connecting');

      // Simulate connecting to WebSocket
      setTimeout(() => {
        setStatus('waiting');
        setupMockWebSocket(newSessionId);
      }, 1000);
    }

    // Reset state when modal is closed
    if (!isOpen) {
      setSessionId(null);
      setUploadedImage(null);
      setStatus('idle');
    }
  }, [isOpen, sessionId]);

  // This would be replaced with actual WebSocket implementation
  const setupMockWebSocket = sid => {
    // In a real implementation, this would be:
    // const socket = new WebSocket(`wss://your-server.com/upload-session/${sid}`);

    // For demo, we'll simulate receiving an image after 5 seconds
    console.log(`WebSocket connected for session ${sid}`);

    // Simulate receiving an image from mobile device
    if (process.env.NODE_ENV === 'development') {
      // Only in development/demo mode
      setTimeout(() => {
        setStatus('uploading');

        setTimeout(() => {
          // Simulate receiving base64 image data
          setUploadedImage('/api/placeholder/400/320');
          setStatus('uploaded');
        }, 2000);
      }, 5000);
    }
  };

  const resetSession = () => {
    setUploadedImage(null);
    setSessionId(generateSessionId());
    setStatus('connecting');

    // Simulate connecting to WebSocket again
    setTimeout(() => {
      setStatus('waiting');
      setupMockWebSocket(sessionId);
    }, 1000);
  };

  // Generate QR code URL that points to the upload page with session ID
  const getQRCodeURL = () => {
    // In a real implementation, this would be your actual upload page URL
    const uploadURL = `https://your-app.com/mobile-upload/${sessionId}`;

    // For demo purposes, we'll just encode this URL in a QR code
    // In a real implementation, you'd use a library like qrcode.react
    return uploadURL;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Camera size={16} />
          <span>Upload from Mobile</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{status === 'uploaded' ? 'Image Uploaded' : 'Scan QR Code with Mobile'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6">
          {status === 'connecting' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Establishing secure connection...</p>
            </div>
          )}

          {status === 'waiting' && (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Code */}
              <div className="h-64 w-64 bg-white p-4 border border-gray-200 rounded-md flex items-center justify-center">
                {/* This would use a real QR code library in production */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <rect x="10" y="10" width="180" height="180" fill="none" stroke="black" strokeWidth="1" />
                  <rect x="30" y="30" width="40" height="40" fill="black" />
                  <rect x="130" y="30" width="40" height="40" fill="black" />
                  <rect x="30" y="130" width="40" height="40" fill="black" />
                  <rect x="80" y="80" width="40" height="40" fill="black" />
                  <rect x="130" y="130" width="10" height="10" fill="black" />
                  <rect x="150" y="130" width="20" height="10" fill="black" />
                  <rect x="130" y="150" width="10" height="20" fill="black" />
                </svg>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Session ID: {sessionId}</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  Scan this QR code with your mobile device to upload an image. This code will connect your phone to
                  this screen.
                </p>
              </div>
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Receiving image from mobile device...</p>
            </div>
          )}

          {status === 'uploaded' && uploadedImage && (
            <div className="flex flex-col items-center space-y-4">
              <img src={uploadedImage} alt="Uploaded" className="max-h-64 rounded-md object-contain" />
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Image uploaded successfully from mobile device</p>
                <Button variant="outline" onClick={resetSession} className="mt-2">
                  Upload Another Image
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <p className="text-red-500">Connection error</p>
              <Button variant="outline" onClick={resetSession}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRImageUpload;
