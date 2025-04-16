"use server";

import prisma from "@/lib/db";
import { LocationType } from "@prisma/client";
import { getServerAuthContext } from "./auth";

export async function getLocationsByType(locationType?: LocationType) {
  const { organizationId } = await getServerAuthContext();

  try {
    const locations = await prisma.inventoryLocation.findMany({
      where: {
        organizationId,
        ...(locationType && { locationType }), // Filter by type if provided
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { data: locations };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return { error: "Failed to fetch locations" };
  }
}
