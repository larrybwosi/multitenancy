import { differenceInMinutes } from "date-fns";
import prisma from '@/lib/db';
import { AttendanceStatus } from "@prisma/client";

// Function to check in a member
export async function checkInMember(
  memberId: string,
  organizationId: string,
  locationId?: string,
  notes?: string
) {
  // Start a transaction to ensure data consistency
  return prisma.$transaction(async (tx) => {
    // Check if member is already checked in
    const member = await tx.member.findUnique({
      where: { id: memberId },
      select: { isCheckedIn: true },
    });

    if (member?.isCheckedIn) {
      throw new Error("Member is already checked in");
    }

    // Create attendance record
    const attendance = await tx.attendance.create({
      data: {
        memberId,
        organizationId,
        locationId,
        notes,
        status: AttendanceStatus.CHECKED_IN,
      },
    });

    // Update member status
    await tx.member.update({
      where: { id: memberId },
      data: {
        isCheckedIn: true,
        lastCheckInTime: new Date(),
        currentLocationId: locationId,
      },
    });

    // Log the action in audit log
    await tx.auditLog.create({
      data: {
        organizationId,
        memberId,
        action: "CREATE",
        entityType: "OTHER", // Consider adding ATTENDANCE to your AuditEntityType enum
        entityId: attendance.id,
        description: `Member checked in at ${locationId ? "location " + locationId : "unspecified location"}`,
      },
    });

    return attendance;
  });
}

// Function to check out a member
export async function checkOutMember(
  memberId: string,
  organizationId: string,
  notes?: string
) {
  // Start a transaction to ensure data consistency
  return prisma.$transaction(async (tx) => {
    // Find the active attendance record
    const activeAttendance = await tx.attendance.findFirst({
      where: {
        memberId,
        organizationId,
        checkOutTime: null,
      },
      orderBy: {
        checkInTime: "desc",
      },
    });

    if (!activeAttendance) {
      throw new Error("No active check-in found for this member");
    }

    // Calculate hours worked
    const checkOutTime = new Date();
    const minutesWorked = differenceInMinutes(
      checkOutTime,
      activeAttendance.checkInTime
    );
    const hoursWorked = Number((minutesWorked / 60).toFixed(2));

    // Update attendance record
    const updatedAttendance = await tx.attendance.update({
      where: { id: activeAttendance.id },
      data: {
        checkOutTime,
        hoursWorked,
        status: AttendanceStatus.CHECKED_OUT,
        notes: notes
          ? `${activeAttendance.notes || ""} ${notes}`.trim()
          : activeAttendance.notes,
      },
    });

    // Update member status
    await tx.member.update({
      where: { id: memberId },
      data: {
        isCheckedIn: false,
        currentLocationId: null,
      },
    });

    // Log the action in audit log
    await tx.auditLog.create({
      data: {
        organizationId,
        memberId,
        action: "UPDATE",
        entityType: "OTHER", // Consider adding ATTENDANCE to your AuditEntityType enum
        entityId: activeAttendance.id,
        description: `Member checked out after ${hoursWorked} hours`,
      },
    });

    return updatedAttendance;
  });
}

// Function to get attendance stats for a member
export async function getMemberAttendanceStats(
  memberId: string,
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  // Get all completed attendance records in the date range
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      memberId,
      organizationId,
      checkInTime: {
        gte: startDate,
        lte: endDate,
      },
      checkOutTime: {
        not: null,
      },
    },
  });

  // Calculate stats
  const totalEntries = attendanceRecords.length;
  const totalHours = attendanceRecords.reduce(
    (sum, record) => sum + (record.hoursWorked?.toNumber() || 0),
    0
  );

  // Count entries by status
  const statusCounts = attendanceRecords.reduce(
    (acc, record) => {
      const status = record.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<AttendanceStatus, number>
  );

  return {
    totalEntries,
    totalHours,
    averageHoursPerDay: totalEntries > 0 ? totalHours / totalEntries : 0,
    statusCounts,
  };
}

// Function to auto-checkout members at end of day
export async function autoCheckoutMembers(organizationId: string) {
  const checkedInMembers = await prisma.member.findMany({
    where: {
      organizationId,
      isCheckedIn: true,
    },
  });

  for (const member of checkedInMembers) {
    // Find the active attendance record
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        organizationId,
        checkOutTime: null,
      },
      orderBy: {
        checkInTime: "desc",
      },
    });

    if (activeAttendance) {
      // Calculate hours worked
      const checkOutTime = new Date();
      const minutesWorked = differenceInMinutes(
        checkOutTime,
        activeAttendance.checkInTime
      );
      const hoursWorked = Number((minutesWorked / 60).toFixed(2));

      // Update attendance record
      await prisma.attendance.update({
        where: { id: activeAttendance.id },
        data: {
          checkOutTime,
          hoursWorked,
          status: AttendanceStatus.AUTO_CHECKOUT,
          notes:
            `${activeAttendance.notes || ""} Auto-checkout at end of day`.trim(),
        },
      });

      // Update member status
      await prisma.member.update({
        where: { id: member.id },
        data: {
          isCheckedIn: false,
          currentLocationId: null,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          organizationId,
          memberId: member.id,
          action: "UPDATE",
          entityType: "OTHER",
          entityId: activeAttendance.id,
          description: `System auto-checkout after ${hoursWorked} hours`,
        },
      });
    }
  }

  return { processedCount: checkedInMembers.length };
}
