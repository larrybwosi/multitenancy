import prisma from "@/lib/db";
// --- Helper Function to generate Order Number ---
export async function generateOrderNumber(organizationId: string): Promise<string> {
  // This is a simple example. You might want a more robust sequential number generator,
  // potentially per organization, perhaps with a prefix.
  // Example: ORGCODE-YYYYMMDD-XXXX
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.order.count({
    where: { organizationId, placedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });
  return `ORD-${datePart}-${(count + 1).toString().padStart(4, '0')}`;
}
