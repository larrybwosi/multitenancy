// src/components/UnauthorizedPage.tsx
'use client'; // Required for hooks like useState, useEffect, useRouter

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Lock, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

// Define props for the component
interface UnauthorizedPageProps {
  /** An optional message to display, e.g., reason for denial */
  message?: string;
  /** The path to redirect to after the countdown (defaults to '/') */
  redirectPath?: string;
  /** The error code to display in the footer (defaults to '401 Unauthorized') */
  errorCode?: string;
}

const UnauthorizedPage = ({
  message,
  redirectPath = '/', // Default redirect path
  errorCode = '401 Unauthorized', // Default error code
}: UnauthorizedPageProps) => {
  const [countdown, setCountdown] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter(); // Hook for navigation

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Cleanup timer on unmount or change
    }
  }, [countdown]);

  // Redirect effect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push(redirectPath); // Redirect to the specified path
    }
  }, [countdown, router, redirectPath]);

  const resetCountdown = () => {
    setIsAnimating(true);
    setCountdown(10);
    // Remove animation class after it finishes
    setTimeout(() => setIsAnimating(false), 500); // Duration should match animation
  };

  const goBack = () => {
    router.back(); // Navigate to the previous page in history
  };

  // Placeholder - you might want to link this to a support modal or page
  const contactSupport = () => {
     console.log('Contact Support clicked - implement navigation or modal');
     // Example: router.push('/support');
     alert('Contact Support functionality not yet implemented.');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans">
      {/* Top decorative gradient bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500"></div>

      <div className="w-full max-w-lg bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        {/* Header Section */}
        <div className="bg-slate-900/80 p-5 border-b border-slate-700">
          <div className="flex items-center justify-center space-x-3">
            <ShieldAlert className="h-7 w-7 text-rose-500 flex-shrink-0" />
            <h1 className="text-2xl font-bold text-slate-100 text-center">
              Unauthorized Access
            </h1>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="p-6 md:p-8 flex flex-col items-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 border-4 border-rose-500/30 shadow-lg">
            <Lock className="h-10 w-10 md:h-12 md:w-12 text-rose-500" />
          </div>

          <h2 className="text-xl md:text-2xl font-semibold mb-3 text-slate-100 text-center">
            Access Denied
          </h2>
          <p className="text-slate-300 text-center mb-6 max-w-md">
            You do not have the necessary permissions to view this page or resource.
            If you believe this is an error, please contact your administrator.
          </p>

          {/* Optional Message Display */}
          {message && (
            <div className="w-full bg-amber-900/40 border border-amber-700/60 rounded-lg p-4 mb-6 text-center shadow-inner">
               <p className="text-sm text-amber-200 flex items-center justify-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>{message}</span>
               </p>
            </div>
          )}

          {/* Countdown Section */}
          <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-lg mb-6 w-full max-w-sm">
            <p className="text-xs text-slate-400 mb-1 text-center">
              Redirecting to {redirectPath === '/' ? 'Homepage' : redirectPath} in:
            </p>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-mono text-emerald-400 tabular-nums">
                {countdown} second{countdown !== 1 ? 's' : ''}
              </div>
              <button
                onClick={resetCountdown}
                aria-label="Reset redirect timer"
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isAnimating ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button
              onClick={goBack}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </button>
            <button
              onClick={contactSupport}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Contact Support
            </button>
          </div>
        </div>

        {/* Footer Section */}
        <div className="bg-slate-900/80 p-3 border-t border-slate-700">
          <p className="text-xs text-center text-slate-500">
            Error Reference: {errorCode}
          </p>
        </div>
      </div>

      {/* Minimalist Footer (Optional - can be removed if handled by a global layout) */}
       <div className="mt-8 text-xs text-slate-500 text-center">
        © {new Date().getFullYear()} Your Application.
      </div>
    </div>
  );
};

export default UnauthorizedPage;