// Example Usage (e.g., in app/dashboard/page.tsx or a layout component)

import { CreateOrganizationDialog } from "../components/create-organization-dialog"; // Adjust path

export default function SomePage() {
  return (
    <div>
      <h1>My Application</h1>
      {/* Other content */}
      <div className="mt-4">
        <CreateOrganizationDialog />
      </div>
      {/* More content */}
    </div>
  );
}
