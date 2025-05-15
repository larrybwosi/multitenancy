'use client'
import { useState } from "react";
import {
  User,
  Lock,
  LogIn,
  MapPin,
  CheckCircle,
  Building,
  Calendar,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { signIn } from "@/lib/auth/authClient";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { appService } from "@/store/service";

const CheckInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  

  const currentWarehouse = useAppStore((state) => state.currentWarehouse);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {data:session, error } = await signIn.email({
        email,
        password,
        rememberMe: true
      })
      const user = session?.user
      if (error || !session) {
        console.error("Login failed:", error);
        toast.error("Login failed. Please check your credentials.", {
          description: error.message,
        });
        throw error;
      }

      const result = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryLocationId: currentWarehouse?.id,
          memberToCheckInId: user?.id,
          actingMemberId: user?.id,
        }),
      });
      const data = await result.json();
      console.log(data);

      if(data?.organization) {appService.setOrganization(data.organization);}
      if(data?.warehouse) {appService.setCurrentWarehouse(data.warehouse);}
      if (result.ok) {
        setShowSuccess(true);
        toast.success("Check-in successful!");
        // Delay 2 seconds before redirecting
        await Promise.resolve( setTimeout(() => {}, 2000));
        router.push("/dashboard");
      } else {
        toast.error("Check-in failed. Please try again.",{
          description: data.error || "An unknown error occurred.",
        });
      }
      
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error("Check-in failed. Please try again.");
    } finally {
      setIsLoading(false);
      setEmail("");
      setPassword("");
      
    }
  };

  // Get current date for display
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Left side - Illustration and branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-12 flex-col justify-between items-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-40 right-20 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white"></div>
        </div>

        <div className="w-full relative z-10">
          <div className="flex items-center mb-12">
            <div className="bg-white/20 p-2 rounded-lg mr-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">SpotCheck</h1>
          </div>

          <div className="mt-16 flex flex-col items-center justify-center">
            <div className="w-3/4 aspect-square bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-10 shadow-lg p-6">
              <Image
                src="/check-in.png"
                alt="Check-in Illustration"
                width={450}
                height={450}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-4">
              Welcome to Our Business Hub
            </h2>
            <p className="text-indigo-100 text-center max-w-md">
              Experience seamless check-ins at any of our premium locations with
              our state-of-the-art system.
            </p>

            <div className="mt-8 flex items-center justify-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full max-w-sm">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-200" />
                <span className="text-sm text-white">{currentDate}</span>
              </div>
              <div className="h-4 w-px bg-indigo-300/50"></div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-200" />
                <span className="text-sm text-white">{currentTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-indigo-200 relative z-10">
          © 2025 SpotCheck. All rights reserved.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo (visible only on mobile) */}
          <div className="flex md:hidden items-center justify-center mb-12">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-indigo-600">SpotCheck</h1>
          </div>

          <div className="shadow-2xl rounded-2xl p-8 md:p-12 backdrop-blur-sm bg-white/90">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-inner">
                  <CheckCircle className="w-14 h-14 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-semibold text-center mb-2">
                  Check-in Successful!
                </h2>
                <p className="text-gray-500 text-center mb-4">
                  Welcome to our location.
                </p>
                <div className="flex items-center justify-center bg-emerald-50 rounded-lg p-3 w-full">
                  <Building className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="text-emerald-700 font-medium">
                    Main Business Hub
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                      Sign In
                    </h2>
                    <p className="text-gray-500 mt-2">
                      Enter your credentials to check in
                    </p>
                  </div>
                  <div className="hidden md:flex h-12 w-12 rounded-full bg-indigo-100 items-center justify-center">
                    <LogIn className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-300"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                      </div>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-300"
                        placeholder="********"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center py-4 px-4 rounded-xl text-white font-medium text-lg transition-all duration-300 ${
                      isLoading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-200"
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    ) : (
                      <LogIn className="w-5 h-5 mr-2" />
                    )}
                    {isLoading ? "Processing..." : "Check In Now"}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 justify-center">
                    <Building className="w-4 h-4" />
                    <span>Select a location to check in</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-lg p-3 text-center cursor-pointer hover:bg-indigo-100 transition-colors">
                      <span className="text-indigo-700 font-medium text-sm">
                        Main Office
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-gray-700 font-medium text-sm">
                        Branch 1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-600 text-center">
                    Need assistance?{" "}
                    <a
                      href="#"
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Contact support
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="md:hidden mt-8 text-sm text-gray-500 text-center">
            © 2025 SpotCheck. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
