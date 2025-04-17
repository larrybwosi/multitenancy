import React from "react";

interface EmailPreviewProps {
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
}

const EmailPreview = ({ organizationName, inviterName, acceptUrl }:EmailPreviewProps) => {
  return (
    <div className="bg-gray-100 min-h-full py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 font-bold text-xl">WP</span>
            </div>
            <h1 className="text-white font-semibold text-xl">
              You&apos;ve been invited to join {organizationName}!
            </h1>
          </div>

          <div className="p-6 md:p-8">
            <p className="text-gray-700 mb-4">Hi there,</p>

            <p className="text-gray-700 mb-6">
              <span className="font-medium text-gray-900">{inviterName}</span>{" "}
              has invited you to join{" "}
              <span className="font-medium text-gray-900">
                {organizationName}
              </span>{" "}
              workspace. Join the team to start collaborating!
            </p>

            <div className="text-center my-8">
              <a
                href={acceptUrl}
                className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Accept Invitation
              </a>
            </div>

            <p className="text-gray-700 mb-4">
              This invitation link will expire in 7 days. If you have any
              questions, please contact us at{" "}
              <a
                href="mailto:support@workspacepro.com"
                className="text-indigo-600 hover:underline"
              >
                support@workspacepro.com
              </a>
              .
            </p>

            <p className="text-gray-700 mb-2">
              If the button above doesn&apos;t work, copy and paste this URL
              into your browser:
            </p>
            <p className="text-center text-sm text-indigo-600 break-all mb-6">
              <a href={acceptUrl} className="hover:underline">
                {acceptUrl}
              </a>
            </p>

            <p className="text-gray-700">
              Best regards,
              <br />
              The {organizationName} Team
            </p>
          </div>

          <div className="bg-gray-50 p-6 text-center border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-2">
              &copy; {new Date().getFullYear()} {organizationName}. All rights
              reserved.
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Our address: 123 Main St, City, Country
            </p>

            <div className="flex justify-center space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                Twitter
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                LinkedIn
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                Instagram
              </a>
            </div>

            <p className="text-gray-400 text-xs">
              If you didn&apos;t request this invitation, please ignore this
              email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
