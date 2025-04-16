"use client";

import { InviteForm } from "../invite-form";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function InvitePage() {
  return (
    <div className="container px-4 mt-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" asChild>
          <Link href="/invitations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invitations
          </Link>
        </Button>
      </div>

      <SectionHeader
        title="Invite New Member"
        subtitle="Send an invitation to join your organization"
        icon={<UserPlus className="h-8 w-8 text-indigo-500" />}
      />

      <div className="mt-6">
        <InviteForm />
      </div>
    </div>
  );
}