'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function UploadPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/upload/client?sessionId=${sessionId}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('Upload successful! You can close this page.');
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        setUploadStatus('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-500/25 transform rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">📸</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Upload Your Photo
          </h1>
          <p className="text-gray-600 text-lg">Capture the moment or choose from gallery</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-violet-500/10 p-6 border border-white/20">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-4">
            {/* Camera Button */}
            <button
              onClick={handleCameraCapture}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-5 px-6 rounded-2xl font-semibold text-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {!isUploading && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className="text-white font-semibold">{isUploading ? 'Uploading...' : 'Take Photo'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 px-4 text-sm text-gray-500 bg-white/50 rounded-full">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Gallery Upload */}
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <div
                className={`relative w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-violet-400 bg-violet-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/50'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-semibold text-lg mb-1">Choose from Gallery</p>
                  <p className="text-gray-500 text-sm">or drag and drop your image here</p>
                  <p className="text-gray-400 text-xs mt-2">PNG, JPG, GIF up to 10MB</p>
                </div>

                {dragActive && (
                  <div className="absolute inset-0 bg-violet-100/80 rounded-2xl flex items-center justify-center">
                    <div className="text-violet-600 font-semibold text-lg">Drop your image here!</div>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Status Message */}
          {uploadStatus && (
            <div
              className={`mt-6 p-4 rounded-2xl text-center font-semibold transition-all duration-300 ${
                uploadStatus.includes('successful')
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : uploadStatus.includes('failed')
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-violet-100 text-violet-700 border border-violet-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {uploadStatus.includes('successful') && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {uploadStatus.includes('failed') && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {uploadStatus.includes('Uploading') && (
                  <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{uploadStatus}</span>
              </div>
            </div>
          )}

          {/* Session Info */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-600">
                Session: <span className="font-mono font-semibold">{sessionId.slice(-8)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">Your photos are processed securely and privately</p>
        </div>
      </div>
    </div>
  );
}
