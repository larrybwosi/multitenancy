import { differenceInMinutes } from "date-fns";
import prisma from '@/lib/db';
import { AttendanceStatus, InventoryLocation } from "@prisma/client";

// Function to check in a member
export async function checkInMember(memberId: string, organizationId: string, locationId?: string, notes?: string) {
  // Start a transaction to ensure data consistency
  return prisma.$transaction(async tx => {
    // Check if member is already checked in
    const member = await tx.member.findUnique({
      where: {id: memberId},
      select: {isCheckedIn: true},
    });

    if (member?.isCheckedIn) {
      // If already checked in, return the existing attendance record
      const existingAttendance = await tx.attendance.findFirst({
        where: {
          memberId,
          organizationId,
          status: AttendanceStatus.CHECKED_IN,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingAttendance) {
        return existingAttendance;
      }
      // If no existing record found, proceed to create a new one
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
      where: {id: memberId},
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
        action: 'CREATE',
        entityType: 'ATTENDANCE',
        entityId: attendance.id,
        description: `Member checked in at ${locationId ? 'location ' + locationId : 'unspecified location'}`,
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
        entityType: "ATTENDANCE", // Consider adding ATTENDANCE to your AuditEntityType enum
        entityId: activeAttendance.id,
        description: `Member checked out after ${hoursWorked} hours`,
      },
    });

    return updatedAttendance;
  });
}


export async function getMemberActiveLocation(memberId: string): Promise<InventoryLocation | null> {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        isCheckedIn: true, // [cite: 14]
        currentLocationId: true, // [cite: 15]
        currentLocation: true, // Include the full location details [cite: 16]
      },
    });

    if (!member) {
      console.log(`Member with ID ${memberId} not found.`);
      return null;
    }

    if (member.isCheckedIn && member.currentLocation) {
      console.log(`Member ${memberId} is active at location: ${member.currentLocation.name}`);
      return member.currentLocation; // [cite: 16]
    } else {
      console.log(`Member ${memberId} is not currently checked in or location is not set.`);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving active location for member ${memberId}:`, error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
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


export async function getOrganizationAndDefaultLocation(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      customFields: true,
      defaultLocationId: true,
      defaultWarehouseId: true,
      settings: {
        select: {
          defaultCurrency: true,
          defaultTimezone: true,
          defaultTaxRate: true,
          inventoryPolicy: true,
          lowStockThreshold: true,
          negativeStock: true,
          enableCapacityTracking: true,
          enforceSpatialConstraints: true,
          enableProductDimensions: true,
          defaultMeasurementUnit: true,
          defaultDimensionUnit: true,
          defaultWeightUnit: true
        }
      }
    }
  });

  if (!organization) {
    throw new Error('Organization not found');
  }

  let warehouse = null;
  if (organization.defaultWarehouseId) {
    warehouse = await prisma.inventoryLocation.findUnique({
      where: { id: organization.defaultWarehouseId },
      select: {
        id: true,
        name: true,
        description: true,
        locationType: true,
        address: true,
        isActive: true
      }
    });
  }

  return {
    organization,
    warehouse
  };
}