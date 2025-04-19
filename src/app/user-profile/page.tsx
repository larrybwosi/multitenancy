import React, { useState } from "react";
import { User, Member, Organization } from "@prisma/client";

interface UserWithMember extends User {
  members: (Member & {
    organization: Organization;
  })[];
  activeOrganization?: Organization;
}

const UserProfilePage = () => {
  const [userData, setUserData] = useState<UserWithMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err.message || "An error occurred while fetching user data");
    } finally {
      setLoading(false);
    }
  };

  const updateActiveOrganization = async (orgId: string) => {
    try {
      const response = await fetch("/api/user/set-active-org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update active organization");
      }

      // Refresh user data to get the updated active organization
      await fetchUserData();
    } catch (err) {
      setError(err.message || "Failed to update active organization");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex justify-center items-center h-screen">
        Please sign in to view your profile
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        No user data found
      </div>
    );
  }

  const activeMember = userData.members.find(
    (member) => member.organizationId === userData.activeOrganizationId
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center">
            <div className="relative">
              <img
                src={userData.image || "/default-avatar.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white"
              />
              <span className="absolute bottom-0 right-0 bg-green-500 rounded-full w-6 h-6 border-2 border-white"></span>
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold">
                {userData.name || userData.username || "No name"}
              </h1>
              <p className="text-blue-100">{userData.email}</p>
              {activeMember && (
                <div className="mt-2 flex items-center">
                  <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                    {activeMember.role}
                  </span>
                  <span className="ml-2 text-blue-100">
                    at {userData.activeOrganization?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Organization Selector */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Organizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.members.map((member) => (
                <div
                  key={member.organizationId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    member.organizationId === userData.activeOrganizationId
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    updateActiveOrganization(member.organizationId)
                  }
                >
                  <div className="flex items-center">
                    {member.organization.logo ? (
                      <img
                        src={member.organization.logo}
                        alt={member.organization.name}
                        className="w-10 h-10 rounded-md mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-indigo-100 flex items-center justify-center mr-3">
                        <span className="text-indigo-600 font-medium">
                          {member.organization.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">
                        {member.organization.name}
                      </h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  {member.organizationId === userData.activeOrganizationId && (
                    <div className="mt-2 text-xs text-indigo-600 font-medium">
                      Active Organization
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Organization Details */}
          {activeMember && userData.activeOrganization && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                {userData.activeOrganization.name} Details
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">
                      Organization Information
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-500">Name:</span>{" "}
                        <span className="font-medium">
                          {userData.activeOrganization.name}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Slug:</span>{" "}
                        <span className="font-medium">
                          {userData.activeOrganization.slug}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Joined:</span>{" "}
                        <span className="font-medium">
                          {new Date(
                            activeMember.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">
                      Your Membership
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-500">Role:</span>{" "}
                        <span className="font-medium capitalize">
                          {activeMember.role.toLowerCase()}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Status:</span>{" "}
                        <span
                          className={`font-medium ${
                            activeMember.isActive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {activeMember.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                      {activeMember.currentLocation && (
                        <p>
                          <span className="text-gray-500">
                            Current Location:
                          </span>{" "}
                          <span className="font-medium">
                            {activeMember.currentLocation.name}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {userData.activeOrganization.description && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600">
                      {userData.activeOrganization.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Account Details
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Name:</span>{" "}
                      <span className="font-medium">
                        {userData.name || "Not set"}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Username:</span>{" "}
                      <span className="font-medium">
                        {userData.username || "Not set"}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="font-medium">{userData.email}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Email Verified:</span>{" "}
                      <span className="font-medium">
                        {userData.emailVerified ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Account Status
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span
                        className={`font-medium ${
                          userData.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {userData.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Role:</span>{" "}
                      <span className="font-medium capitalize">
                        {userData.role.toLowerCase()}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Account Created:</span>{" "}
                      <span className="font-medium">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Last Updated:</span>{" "}
                      <span className="font-medium">
                        {new Date(userData.updatedAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
