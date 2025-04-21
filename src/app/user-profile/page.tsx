"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Mail,
  User,
  Building,
  Shield,
  Calendar,
  Edit,
  Settings,
  Users,
  Bell,
  Lock,
  Activity,
  Briefcase,
  Award,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";
import { format } from "date-fns";
import { Plus, FileText } from "lucide-react";

// Define types based on Prisma schema
interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DEVELOPER" | "CLIENT" | "MEMBER";
  isActive: boolean;
  createdAt: string;
  activeOrganizationId: string | null;
}

interface Member {
  id: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "CASHIER" | "REPORTER";
  isActive: boolean;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
  };
}

interface UserProfileResponse {
  user: User;
  member: Member | null;
}

// Role config for better display
const roleConfig = {
  // User roles
  SUPER_ADMIN: { color: "bg-purple-100 text-purple-800", icon: Shield },
  ADMIN: { color: "bg-red-100 text-red-800", icon: Shield },
  DEVELOPER: { color: "bg-blue-100 text-blue-800", icon: Code },
  CLIENT: { color: "bg-green-100 text-green-800", icon: User },
  MEMBER: { color: "bg-gray-100 text-gray-800", icon: User },
  
  // Member roles
  OWNER: { color: "bg-amber-100 text-amber-800", icon: Crown },
  MANAGER: { color: "bg-indigo-100 text-indigo-800", icon: Briefcase },
  EMPLOYEE: { color: "bg-cyan-100 text-cyan-800", icon: Briefcase },
  CASHIER: { color: "bg-emerald-100 text-emerald-800", icon: DollarSign },
  REPORTER: { color: "bg-fuchsia-100 text-fuchsia-800", icon: LineChart },
};

// Mock data for additional sections
const activityData = [
  { action: "Updated profile picture", date: "2025-04-18T14:23:00Z" },
  { action: "Changed password", date: "2025-04-10T09:15:00Z" },
  { action: "Joined organization", date: "2025-03-20T11:30:00Z" },
];

const statsData = {
  projectsCompleted: 12,
  tasksCompleted: 87,
  hoursLogged: 340,
  progressPercentage: 75,
};

// Missing lucide icons import
import { Code, Crown, DollarSign, LineChart } from "lucide-react";

// Enhanced types for better form handling
interface ContactInfo {
  phone: string;
  location: string;
  website: string;
}

interface ProfileSettings {
  bio: string;
  socialLinks: {
    twitter: string;
    linkedin: string;
    github: string;
  };
  contactInfo: ContactInfo;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    bio: "",
    socialLinks: {
      twitter: "",
      linkedin: "",
      github: ""
    },
    contactInfo: {
      phone: "",
      location: "",
      website: ""
    }
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data: UserProfileResponse = await response.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching your profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-36 w-full mb-6 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-screen md:h-[calc(100vh-12rem)] md:col-span-1" />
          <Skeleton className="h-96 md:h-[calc(100vh-12rem)] md:col-span-3" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 text-red-500 justify-center p-8 bg-red-50 rounded-lg shadow">
          <AlertCircle className="h-8 w-8" />
          <p className="text-lg font-medium">{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

  const { user, member } = profile;
  
  // Determine appropriate role configs
  const userRoleConfig = roleConfig[user.role] || { color: "bg-gray-100 text-gray-800", icon: User };
  const memberRoleConfig = member?.role ? roleConfig[member.role] || { color: "bg-gray-100 text-gray-800", icon: User } : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Profile Header Banner */}
      <div className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <div className="container mx-auto px-6 h-full flex items-end">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mb-16 md:-mb-12">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || "User"}
              />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                {user.name?.[0] || user.email[0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white p-4 rounded-lg shadow-md md:mb-4 flex flex-col md:flex-row items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {user.name || "Unnamed User"}
                </h1>
                <p className="text-gray-500 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  @{user.username || "No username"}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={userRoleConfig.color}>
                  <span className="flex items-center gap-1">
                    <userRoleConfig.icon className="h-3 w-3" />
                    {user.role}
                  </span>
                </Badge>
                {member && (
                  <Badge className={memberRoleConfig?.color}>
                    <span className="flex items-center gap-1">
                      {/* <memberRoleConfig?.icon className="h-3 w-3" /> */}
                      {member.role}
                    </span>
                  </Badge>
                )}
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to account for overlapping avatar */}
      <div className="h-16 md:h-12"></div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <Card className="shadow-md sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button 
                    variant={activeTab === "overview" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("overview")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Overview
                  </Button>
                  <Button 
                    variant={activeTab === "organization" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("organization")}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Organization
                  </Button>
                  <Button 
                    variant={activeTab === "activity" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("activity")}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Activity
                  </Button>
                  <Button 
                    variant={activeTab === "settings" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </nav>
                
                <Separator className="my-4" />
                
                {/* Quick Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  {member && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Member since {format(new Date(member.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                {/* Stats */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Stats</h3>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <p className="text-xl font-bold text-blue-700">{statsData.projectsCompleted}</p>
                      <p className="text-xs text-blue-600">Projects</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <p className="text-xl font-bold text-green-700">{statsData.tasksCompleted}</p>
                      <p className="text-xs text-green-600">Tasks</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <p className="text-xl font-bold text-purple-700">{statsData.hoursLogged}</p>
                      <p className="text-xs text-purple-600">Hours</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <div className="flex justify-center">
                        <span className="text-xl font-bold text-amber-700">{statsData.progressPercentage}%</span>
                      </div>
                      <p className="text-xs text-amber-600">Progress</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* User Profile Card */}
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      User Profile
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                          <p className="text-lg font-medium">{user.name || "Not set"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                          <p className="text-lg font-medium">{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Username</h3>
                          <p className="text-lg font-medium">@{user.username || "Not set"}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">User Role</h3>
                          <Badge className={`${userRoleConfig.color} mt-1`}>
                            <span className="flex items-center gap-1">
                              <userRoleConfig.icon className="h-3 w-3" />
                              {user.role}
                            </span>
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                          <Badge variant={user.isActive ? "success" : "destructive"} className="mt-1">
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                          <p className="text-lg font-medium">{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-700">Progress</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Profile Completion</span>
                          <span className="font-medium">{statsData.progressPercentage}%</span>
                        </div>
                        <Progress value={statsData.progressPercentage} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activityData.map((activity, index) => (
                        <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Activity className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-gray-500">{format(new Date(activity.date), "MMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "organization" && (
              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {member ? (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                          <div className="relative h-24 w-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {member.organization.logo ? (
                              <Image
                                src={member.organization.logo}
                                alt={`${member.organization.name} logo`}
                                layout="fill"
                                objectFit="cover"
                              />
                            ) : (
                              <span className="text-4xl font-bold text-gray-400">
                                {member.organization.name[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold">{member.organization.name}</h2>
                            <p className="text-gray-500 font-medium">@{member.organization.slug}</p>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                              <Badge className={memberRoleConfig?.color}>
                                <span className="flex items-center gap-1">
                                  {/* <memberRoleConfig?.icon className="h-3 w-3" /> */}
                                  {member.role}
                                </span>
                              </Badge>
                              <Badge variant={member.isActive ? "success" : "destructive"}>
                                {member.isActive ? "Active Member" : "Inactive Member"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">About</h3>
                          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                            {member.organization.description || "No description available for this organization."}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">Membership Details</h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Role</span>
                                <span className="font-medium">{member.role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className="font-medium">{member.isActive ? "Active" : "Inactive"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Joined</span>
                                <span className="font-medium">{format(new Date(member.createdAt), "MMMM d, yyyy")}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">Organization Metrics</h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Projects</span>
                                <span className="font-medium">8 Active</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Team Size</span>
                                <span className="font-medium">12 Members</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Founded</span>
                                <span className="font-medium">January 2023</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Building className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">No Organization Membership</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                          You are not currently a member of any organization. Join an organization to collaborate with team members.
                        </p>
                        <Button>
                          <Users className="mr-2 h-4 w-4" />
                          Browse Organizations
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Activity History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                      <div className="space-y-8 relative">
                        {[...activityData, ...activityData].map((activity, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="bg-white z-10 border-4 border-blue-100 rounded-full h-8 w-8 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <p className="font-medium">{activity.action}</p>
                                <p className="text-sm text-gray-500">{format(new Date(activity.date), "MMMM d, yyyy 'at' h:mm a")}</p>
                              </div>
                              <p className="text-gray-600 mt-2 text-sm">
                                {activity.action.includes("profile") ? 
                                  "You updated your profile information to keep your account details current." :
                                  activity.action.includes("password") ?
                                    "You changed your account password for better security." :
                                    "You joined a new organization and gained access to its resources."
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="account">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </TabsTrigger>
                    <TabsTrigger value="security">
                      <Lock className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" value={user.email} disabled className="w-full p-2 border rounded-md bg-gray-50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <input type="text" value={user.username || ""} className="w-full p-2 border rounded-md" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" value={user.name || ""} className="w-full p-2 border rounded-md" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <input type="tel" placeholder="Your phone number" className="w-full p-2 border rounded-md" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Bio</label>
                            <textarea rows={3} placeholder="Tell us about yourself" className="w-full p-2 border rounded-md"></textarea>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button>Save Changes</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="security">
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Password</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Current Password</label>
                              <input type="password" className="w-full p-2 border rounded-md" />
                            </div>
                            <div></div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">New Password</label>
                              <input type="password" className="w-full p-2 border rounded-md" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                              <input type="password" className="w-full p-2 border rounded-md" />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button>Update Password</Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div>
                              <p className="font-medium">Protect your account with 2FA</p>
                              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                            </div>
                            <Button variant="outline">Enable 2FA</Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">Session Management</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-medium">Current Session</p>
                                <p className="text-sm text-gray-600">Chrome on Windows • Atlanta, USA</p>
                              </div>
                              <Badge variant="success">Active</Badge>
                            </div>
                            <Button variant="destructive" size="sm">Sign Out of All Devices</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="notifications">
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Email Notifications</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Account Updates</p>
                                <p className="text-sm text-gray-600">Receive emails about account security and changes</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" checked className="rounded" />
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Organization Invites</p>
                                <p className="text-sm text-gray-600">Receive emails when you&apos;re invited to an organization</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" checked className="rounded" />
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Project Updates</p>
                                <p className="text-sm text-gray-600">Receive emails about projects you&apos;re involved in</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" className="rounded" />
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Marketing & Newsletters</p>
                                <p className="text-sm text-gray-600">Receive emails about new features and updates</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" className="rounded" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">In-App Notifications</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Task Assignments</p>
                                <p className="text-sm text-gray-600">Notify when you&apos;re assigned to a task</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" checked className="rounded" />
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Comments & Mentions</p>
                                <p className="text-sm text-gray-600">Notify when you&apos;re mentioned in comments</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" checked className="rounded" />
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Project Status Changes</p>
                                <p className="text-sm text-gray-600">Notify when project status changes</p>
                              </div>
                              <div className="flex items-center h-6">
                                <input type="checkbox" className="rounded" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button>Save Preferences</Button>
                        </div>
                      </CardContent>
                    </Card>
                                      </TabsContent>
                </Tabs>

                {/* Additional Settings Sections */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Achievements & Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-medium">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Project Management</Badge>
                          <Badge variant="outline">Team Leadership</Badge>
                          <Badge variant="outline">UI/UX Design</Badge>
                          <Badge variant="outline">Frontend Development</Badge>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Add Skill
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <h3 className="font-medium">Certifications</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                              <p className="font-medium">Project Management Professional (PMP)</p>
                              <p className="text-sm text-gray-600">Issued: June 2024 • Expires: June 2027</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                              <p className="font-medium">Certified Scrum Master (CSM)</p>
                              <p className="text-sm text-gray-600">Issued: March 2023 • No Expiry</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button variant="outline" className="mt-2">
                          <Plus className="h-4 w-4 mr-1" /> Add Certification
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <h3 className="font-medium">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <MapPin className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">Location</p>
                              <p className="text-sm text-gray-600">San Francisco, CA</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <Phone className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">Phone</p>
                              <p className="text-sm text-gray-600">(555) 123-4567</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <Globe className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">Website</p>
                              <p className="text-sm text-gray-600">example.com</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <Mail className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">Email</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
