// app/organizations/create/page.tsx
import { redirect } from "next/navigation";
import { OrganizationForm } from "./form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Organization",
  description: "Set up a new organization for your team.",
};

export default async function CreateOrganizationPage() {
  // const user = await getCurrentUser();

  // if (!user) {
  //   // Redirect to login if not authenticated
  //   redirect("/login"); // Adjust login path as needed
  // }

  return (
    <div className="container mx-auto py-10 px-4">
      <OrganizationForm />
    </div>
  );
}
