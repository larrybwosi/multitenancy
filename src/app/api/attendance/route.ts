import { getServerAuthContext } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
export async function GET(
  req: Request,
) {
  const { organizationId, role } = await getServerAuthContext();
  

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow ADMIN, OWNER, or MANAGER to view all members' attendance
  if (!["ADMIN", "OWNER", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") as "CHECKED_IN" | "CHECKED_OUT";
    const memberId = searchParams.get("memberId");
    const locationId = searchParams.get("locationId");
    const includeCurrent = searchParams.get("includeCurrent") === "true";

    // Build the where clause
    const where: Prisma.AttendanceWhereInput = {
      organizationId: organizationId,
    };

    if (startDate && endDate) {
      where.checkInTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.checkInTime = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.checkInTime = {
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    // Get attendance records
    const attendanceRecords = await db.attendance.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkInTime: "desc",
      },
    });

    // Optionally include currently checked-in members who don't have attendance records in the date range
    let currentMembers = [];
    if (includeCurrent) {
      currentMembers = await db.member.findMany({
        where: {
          organizationId: organizationId,
          isCheckedIn: true,
          ...(memberId ? { id: memberId } : {}),
          ...(locationId ? { currentLocationId: locationId } : {}),
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          role: true,
          isCheckedIn: true,
          lastCheckInTime: true,
          currentLocation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Filter out members who already have attendance records in the results
      const memberIdsWithRecords = new Set(
        attendanceRecords.map((r) => r.memberId)
      );
      currentMembers = currentMembers.filter(
        (m) => !memberIdsWithRecords.has(m.id)
      );
    }

    return NextResponse.json({
      attendanceRecords,
      currentMembers,
    });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return handleApiError(error)
  }
}
