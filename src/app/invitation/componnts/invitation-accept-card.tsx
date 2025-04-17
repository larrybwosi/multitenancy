"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation, declineInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Check,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { MemberRole } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface InvitationData {
  id: string;
  role: MemberRole;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    createdDate: Date;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  meta?: {
    isValid: boolean;
    expiresIn: string;
  };
}

interface InvitationAcceptCardProps {
  invitation: InvitationData;
  loggedInUserId: string;
}

export default function InvitationAcceptCard({
  invitation,
  loggedInUserId,
}: InvitationAcceptCardProps) {
  const router = useRouter();
  const [isLoadingAccept, setIsLoadingAccept] = useState(false);
  const [isLoadingDecline, setIsLoadingDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleAccept = async () => {
    setIsLoadingAccept(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await acceptInvitation({
        token: invitation.id,
        acceptingUserId: loggedInUserId,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setIsProcessed(true);
        setSuccessMessage(
          `You've joined ${invitation.organization.name} as ${invitation.role.toLowerCase()}! Redirecting...`
        );
        setTimeout(() => {
          router.push(`/dashboard`);
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      console.log(err)
      setError("Failed to accept invitation. Please try again.");
    } finally {
      setIsLoadingAccept(false);
    }
  };

  const handleDecline = async () => {
    setIsLoadingDecline(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await declineInvitation({
        token: invitation.id,
        userId: loggedInUserId,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setIsProcessed(true);
        setSuccessMessage("Invitation declined.");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err) {
      console.log(err)
      setError("Failed to decline invitation. Please try again.");
    } finally {
      setIsLoadingDecline(false);
    }
  };

  const isLoading = isLoadingAccept || isLoadingDecline;
  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isInvalid = invitation.status !== "PENDING" || isExpired;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
      <Card className="w-full max-w-lg overflow-hidden rounded-xl shadow-xl border dark:border-slate-700">
        <CardHeader className="items-center text-center p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative">
            <Avatar className="h-20 w-20 mb-4 border-2 border-white dark:border-slate-600 shadow-md">
              <AvatarImage
                src={invitation.organization.logo ?? undefined}
                alt={`${invitation.organization.name} logo`}
              />
              <AvatarFallback className="text-2xl font-semibold bg-gradient-to-tr from-blue-500 to-cyan-400 text-white">
                {getInitials(invitation.organization.name)}
              </AvatarFallback>
            </Avatar>
            {isInvalid && (
              <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                {isExpired ? "Expired" : "Processed"}
              </div>
            )}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold dark:text-white">
            Organization Invitation
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground dark:text-slate-400 mt-1">
            {invitation.inviter.name} invited you to join{" "}
            <span className="font-semibold text-primary dark:text-cyan-400">
              {invitation.organization.name}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800 p-4">
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                  Organization
                </span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {invitation.organization.name}
                </p>
                {invitation.organization.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {invitation.organization.description}
                  </p>
                )}
              </div>

              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800 p-4">
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                  Invited By
                </span>
                <div className="flex items-center mt-1 gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={invitation.inviter.avatar ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(invitation.inviter.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {invitation.inviter.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {invitation.inviter.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800 p-4">
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                  Your Role
                </span>
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {invitation.role.toLowerCase()}
                </span>
              </div>

              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800 p-4">
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                  Expires {isExpired ? "on" : "in"}
                </span>
                <span
                  className={`font-semibold ${isExpired ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}
                >
                  {isExpired
                    ? new Date(invitation.expiresAt).toLocaleDateString()
                    : formatDistanceToNow(new Date(invitation.expiresAt), {
                        addSuffix: true,
                      })}
                </span>
              </div>
            </div>
          </div>

          {isInvalid && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                Invitation {isExpired ? "Expired" : "Already Processed"}
              </AlertTitle>
              <AlertDescription>
                {isExpired
                  ? "This invitation has expired and can no longer be accepted."
                  : `This invitation has already been ${invitation.status.toLowerCase()}.`}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && !error && (
            <Alert className="mt-6 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-300">
                Success
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="w-full sm:w-auto dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
            disabled={isLoading || isProcessed || isInvalid}
          >
            {isLoadingDecline ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            disabled={isLoading || isProcessed || isInvalid}
          >
            {isLoadingAccept ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Accept Invitation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
