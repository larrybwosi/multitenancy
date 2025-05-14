import { Prisma } from '@/prisma/client';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { isValid, parse } from 'date-fns';
import { log, LogLevel } from '@/utils/logger';
import { AppError, NotFoundError, AlreadyCheckedInError, NotCheckedInError, ValidationError } from '@/utils/errors';
import prisma
 from '@/lib/db';
const TIME_FORMAT_HHMM = 'HH:mm';

/**
 * Sets or updates the auto-checkout settings for an organization.
 */
export async function setOrganizationAutoCheckoutSettings(
  organizationId: string,
  settings: { enableAutoCheckout?: boolean; autoCheckoutTime?: string | null }
) {
  log(LogLevel.INFO, `Attempting to set auto-checkout settings for organization ${organizationId}`, settings);

  if (settings.autoCheckoutTime) {
    const parsedTime = parse(settings.autoCheckoutTime, TIME_FORMAT_HHMM, new Date());
    if (!isValid(parsedTime) || formatInTimeZone(parsedTime, 'UTC', TIME_FORMAT_HHMM) !== settings.autoCheckoutTime) {
      // Check if it's a valid HH:mm format
      log(
        LogLevel.ERROR,
        `Invalid autoCheckoutTime format: ${settings.autoCheckoutTime} for organization ${organizationId}`
      );
      throw new ValidationError(`Invalid autoCheckoutTime format. Please use ${TIME_FORMAT_HHMM}.`);
    }
  }

  try {
    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        enableAutoCheckout: settings.enableAutoCheckout,
        autoCheckoutTime: settings.autoCheckoutTime, // Can be null to disable time but keep feature enabled
      },
    });
    log(
      LogLevel.INFO,
      `Successfully updated auto-checkout settings for organization ${organizationId}`,
      updatedSettings
    );
    return updatedSettings;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundError('OrganizationSettings', organizationId);
    }
    log(LogLevel.ERROR, `Error setting auto-checkout settings for organization ${organizationId}`, { error, settings });
    throw new AppError('Failed to update organization auto-checkout settings.');
  }
}

/**
 * Checks in a member at a specified inventory location.
 */
export async function checkInMember(
  actingMemberId: string,
  memberToCheckInId: string,
  organizationId: string,
  inventoryLocationId: string,
  notes?: string
) {
  log(
    LogLevel.INFO,
    `Attempting check-in for member ${memberToCheckInId} at location ${inventoryLocationId} by ${actingMemberId}`
  );

  return prisma
    .$transaction(async tx => {
      const member = await tx.member.findUnique({
        where: { id: memberToCheckInId, organizationId },
      });

      if (!member) {
        throw new NotFoundError('Member', memberToCheckInId);
      }
      if (member.isCheckedIn) {
        throw new AlreadyCheckedInError(memberToCheckInId);
      }

      const location = await tx.inventoryLocation.findUnique({
        where: { id: inventoryLocationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError('InventoryLocation', inventoryLocationId);
      }
      if (!location.isActive) {
        throw new ValidationError(`Check-in location ${location.name} is not active.`);
      }

      const now = new Date(); // UTC by default
      const attendanceLog = await tx.attendanceLog.create({
        data: {
          memberId: memberToCheckInId,
          organizationId,
          checkInTime: now,
          checkInLocationId: inventoryLocationId,
          notes,
        },
      });

      await tx.member.update({
        where: { id: memberToCheckInId },
        data: {
          isCheckedIn: true,
          lastCheckInTime: now,
          currentAttendanceLogId: attendanceLog.id,
          currentCheckInLocationId: inventoryLocationId,
        },
      });

      // Optional: Create Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          memberId: actingMemberId, // The member performing the action
          action: 'CREATE',
          entityType: 'ATTENDANCE',
          entityId: attendanceLog.id,
          description: `Member ${memberToCheckInId} checked in at location ${location.name} (${inventoryLocationId}).`,
          details: { memberCheckedIn: memberToCheckInId, locationId: inventoryLocationId, notes },
        },
      });

      log(LogLevel.INFO, `Member ${memberToCheckInId} checked in successfully. Log ID: ${attendanceLog.id}`);
      return attendanceLog;
    })
    .catch(error => {
      if (error instanceof AppError) throw error; // Re-throw known operational errors
      log(LogLevel.ERROR, `Check-in failed for member ${memberToCheckInId}`, { error, inventoryLocationId, notes });
      throw new AppError('Check-in operation failed.'); // Generic error for unknown issues
    });
}

/**
 * Checks out a member.
 */
export async function checkOutMember(
  actingMemberId: string,
  memberToCheckoutId: string,
  organizationId: string,
  notes?: string,
  checkoutInventoryLocationId?: string
) {
  log(LogLevel.INFO, `Attempting check-out for member ${memberToCheckoutId} by ${actingMemberId}`, {
    notes,
    checkoutInventoryLocationId,
  });

  return prisma
    .$transaction(async tx => {
      const member = await tx.member.findUnique({
        where: { id: memberToCheckoutId, organizationId },
        include: { currentAttendanceLog: true }, // Include the current log
      });

      if (!member) {
        throw new NotFoundError('Member', memberToCheckoutId);
      }
      if (!member.isCheckedIn || !member.currentAttendanceLogId || !member.currentAttendanceLog) {
        // Attempt to gracefully handle if isCheckedIn is true but log ID is missing
        if (member.isCheckedIn) {
          await tx.member.update({
            where: { id: member.id },
            data: { isCheckedIn: false, currentAttendanceLogId: null, currentCheckInLocationId: null },
          });
          log(
            LogLevel.WARN,
            `Member ${memberToCheckoutId} was marked as checked-in but had no currentAttendanceLogId. Status corrected.`
          );
          throw new NotCheckedInError(memberToCheckoutId); // Still an error for the checkout operation
        }
        throw new NotCheckedInError(memberToCheckoutId);
      }

      const activeLog = member.currentAttendanceLog;
      if (!activeLog.checkInTime) {
        // Should not happen with proper check-ins
        log(
          LogLevel.ERROR,
          `Active attendance log ${activeLog.id} for member ${memberToCheckoutId} is missing checkInTime.`
        );
        throw new AppError(`Critical error: Active attendance log for member ${memberToCheckoutId} is invalid.`);
      }

      const finalCheckoutLocationId = checkoutInventoryLocationId || activeLog.checkInLocationId;
      const location = await tx.inventoryLocation.findUnique({
        where: { id: finalCheckoutLocationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError('InventoryLocation for checkout', finalCheckoutLocationId);
      }
      if (!location.isActive) {
        throw new ValidationError(`Check-out location ${location.name} is not active.`);
      }

      const now = new Date(); // UTC
      const durationMs = now.getTime() - activeLog.checkInTime.getTime();
      const durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60))); // Ensure non-negative

      const updatedLog = await tx.attendanceLog.update({
        where: { id: activeLog.id },
        data: {
          checkOutTime: now,
          durationMinutes,
          notes,
          isAutoCheckout: false,
          checkOutLocationId: finalCheckoutLocationId,
        },
      });

      await tx.member.update({
        where: { id: memberToCheckoutId },
        data: {
          isCheckedIn: false,
          currentAttendanceLogId: null,
          currentCheckInLocationId: null, // Clear current location on checkout
        },
      });

      // Optional: Create Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          memberId: actingMemberId,
          action: 'UPDATE',
          entityType: 'ATTENDANCE',
          entityId: updatedLog.id,
          description: `Member ${memberToCheckoutId} checked out from location ${location.name} (${finalCheckoutLocationId}).`,
          details: { memberCheckedOut: memberToCheckoutId, checkoutLocationId: finalCheckoutLocationId, notes },
        },
      });

      log(LogLevel.INFO, `Member ${memberToCheckoutId} checked out successfully. Log ID: ${updatedLog.id}`);
      return updatedLog;
    })
    .catch(error => {
      if (error instanceof AppError) throw error;
      log(LogLevel.ERROR, `Check-out failed for member ${memberToCheckoutId}`, {
        error,
        notes,
        checkoutInventoryLocationId,
      });
      throw new AppError('Check-out operation failed.');
    });
}

/**
 * Hourly function to perform automatic checkouts.
 * This should be triggered by a scheduler (e.g., cron job).
 */
export async function performAutoCheckout() {
  const jobStartTime = new Date();
  log(LogLevel.INFO, 'Starting hourly auto-checkout job.', { jobStartTime });

  try {
    const organizationsWithSettings = await prisma.organization.findMany({
      where: {
        settings: {
          enableAutoCheckout: true,
          autoCheckoutTime: { not: null },
        },
      },
      include: {
        settings: {
          // Fetch settings for timezone and autoCheckoutTime
          select: { defaultTimezone: true, autoCheckoutTime: true },
        },
      },
    });

    if (!organizationsWithSettings.length) {
      log(LogLevel.INFO, 'No organizations configured for auto-checkout or no valid time set.');
      return;
    }

    for (const org of organizationsWithSettings) {
      if (!org.settings || !org.settings.autoCheckoutTime || !org.settings.defaultTimezone) {
        log(LogLevel.WARN, `Organization ${org.id} has auto-checkout enabled but settings are incomplete. Skipping.`, {
          settings: org.settings,
        });
        continue;
      }

      const { defaultTimezone, autoCheckoutTime } = org.settings;
      let currentTimeInOrgTimezone: Date;
      try {
        currentTimeInOrgTimezone = toZonedTime(jobStartTime, defaultTimezone);
      } catch (tzError) {
        log(LogLevel.ERROR, `Invalid timezone ${defaultTimezone} for organization ${org.id}. Skipping.`, { tzError });
        continue;
      }

      const currentTimeHHMM = formatInTimeZone(currentTimeInOrgTimezone, defaultTimezone, TIME_FORMAT_HHMM);

      log(
        LogLevel.DEBUG,
        `Org ${org.id}: Checking time. Current in org timezone (${defaultTimezone}): ${currentTimeHHMM}. Configured: ${autoCheckoutTime}`
      );

      if (currentTimeHHMM === autoCheckoutTime) {
        log(
          LogLevel.INFO,
          `Organization ${org.id} matches auto-checkout time ${autoCheckoutTime}. Processing members.`
        );
        const checkedInMembers = await prisma.member.findMany({
          where: {
            organizationId: org.id,
            isCheckedIn: true,
            currentAttendanceLogId: { not: null },
          },
          include: {
            currentAttendanceLog: {
              select: { id: true, checkInTime: true, checkInLocationId: true },
            },
          },
        });

        if (!checkedInMembers.length) {
          log(LogLevel.INFO, `No members currently checked in for organization ${org.id}.`);
          continue;
        }

        for (const member of checkedInMembers) {
          if (member.currentAttendanceLog && member.currentAttendanceLog.checkInTime) {
            try {
              await prisma.$transaction(async tx => {
                const nowUtc = new Date(); // Use a consistent UTC timestamp for all checkouts in this batch
                const durationMs = nowUtc.getTime() - member.currentAttendanceLog!.checkInTime.getTime();
                const durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));

                await tx.attendanceLog.update({
                  where: { id: member.currentAttendanceLog!.id },
                  data: {
                    checkOutTime: nowUtc,
                    durationMinutes,
                    isAutoCheckout: true,
                    notes: `Automatic system checkout at ${autoCheckoutTime} ${defaultTimezone}.`,
                    checkOutLocationId: member.currentAttendanceLog!.checkInLocationId, // Auto-checkout at check-in location
                  },
                });

                await tx.member.update({
                  where: { id: member.id },
                  data: {
                    isCheckedIn: false,
                    currentAttendanceLogId: null,
                    currentCheckInLocationId: null,
                  },
                });

                // Optional: Create Audit Log
                await tx.auditLog.create({
                  data: {
                    organizationId: org.id,
                    // memberId: null, // System action, or a designated system user ID
                    action: 'UPDATE',
                    entityType: 'ATTENDANCE',
                    entityId: member.currentAttendanceLog!.id,
                    description: `Member ${member.id} automatically checked out by system for organization ${org.id}.`,
                    details: {
                      autoCheckout: true,
                      memberId: member.id,
                      configuredTime: autoCheckoutTime,
                      timezone: defaultTimezone,
                    },
                  },
                });
                log(LogLevel.INFO, `Member ${member.id} in organization ${org.id} auto-checked out successfully.`);
              });
            } catch (checkoutError) {
              log(LogLevel.ERROR, `Failed to auto-checkout member ${member.id} in organization ${org.id}.`, {
                checkoutError,
                member,
              });
              // Continue to next member, don't let one failure stop the whole org/job
            }
          } else {
            log(
              LogLevel.WARN,
              `Member ${member.id} in org ${org.id} is checkedIn but currentAttendanceLog is invalid. Skipping auto-checkout.`,
              { member }
            );
          }
        }
      }
    }
  } catch (jobError) {
    log(LogLevel.ERROR, 'Critical error during auto-checkout job.', { jobError });
  } finally {
    const jobEndTime = new Date();
    const jobDuration = jobEndTime.getTime() - jobStartTime.getTime();
    log(LogLevel.INFO, `Auto-checkout job finished. Duration: ${jobDuration}ms`, { jobEndTime });
  }
}

/**
 * Get specific member's attendance records for an organization within a given period.
 * Dates are expected to be in UTC or be unambiguous (e.g., Date objects from JS).
 */
export async function getMemberAttendance(organizationId: string, memberId: string, periodStart: Date, periodEnd: Date) {
  log(LogLevel.DEBUG, `Workspaceing attendance for member ${memberId}, org ${organizationId}`, {
    periodStart,
    periodEnd,
  });
  try {
    const attendanceRecords = await prisma.attendanceLog.findMany({
      where: {
        organizationId,
        memberId,
        // Records that start within the period OR end within the period OR span the entire period
        OR: [
          { checkInTime: { gte: periodStart, lte: periodEnd } }, // Starts within
          { checkOutTime: { gte: periodStart, lte: periodEnd } }, // Ends within
          { checkInTime: { lt: periodStart }, checkOutTime: { gt: periodEnd } }, // Spans period
        ],
      },
      include: {
        checkInLocation: { select: { id: true, name: true } },
        checkOutLocation: { select: { id: true, name: true } },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return attendanceRecords;
  } catch (error) {
    log(LogLevel.ERROR, `Error fetching member attendance for member ${memberId}`, {
      error,
      organizationId,
      periodStart,
      periodEnd,
    });
    throw new AppError('Failed to retrieve member attendance records.');
  }
}

/**
 * Get all members' attendance for an organization within a given period.
 */
export async function getAllMembersAttendanceForOrganization(organizationId: string, periodStart: Date, periodEnd: Date) {
  log(LogLevel.DEBUG, `Workspaceing all members attendance for org ${organizationId}`, { periodStart, periodEnd });
  try {
    const attendanceRecords = await prisma.attendanceLog.findMany({
      where: {
        organizationId,
        OR: [
          { checkInTime: { gte: periodStart, lte: periodEnd } },
          { checkOutTime: { gte: periodStart, lte: periodEnd } },
          { checkInTime: { lt: periodStart }, checkOutTime: { gt: periodEnd } },
        ],
      },
      include: {
        member: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        checkInLocation: { select: { id: true, name: true } },
        checkOutLocation: { select: { id: true, name: true } },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return attendanceRecords;
  } catch (error) {
    log(LogLevel.ERROR, `Error fetching all members attendance for organization ${organizationId}`, {
      error,
      periodStart,
      periodEnd,
    });
    throw new AppError('Failed to retrieve organization attendance records.');
  }
}

/**
 * Get attendance records for a specific inventory location within a given period.
 */
export async function getLocationAttendance(
  organizationId: string,
  inventoryLocationId: string,
  periodStart: Date,
  periodEnd: Date
) {
  log(LogLevel.DEBUG, `Workspaceing attendance for location ${inventoryLocationId}, org ${organizationId}`, {
    periodStart,
    periodEnd,
  });
  try {
    const locationAttendanceRecords = await prisma.attendanceLog.findMany({
      where: {
        organizationId,
        // Records where check-in OR checkout happened at this location within the period
        OR: [
          // Checked in at this location and check-in time is within period
          { checkInLocationId: inventoryLocationId, checkInTime: { gte: periodStart, lte: periodEnd } },
          // Checked out at this location and check-out time is within period
          { checkOutLocationId: inventoryLocationId, checkOutTime: { gte: periodStart, lte: periodEnd } },
          // Spans the period and checked in at this location
          { checkInLocationId: inventoryLocationId, checkInTime: { lt: periodStart }, checkOutTime: { gt: periodEnd } },
          // Spans the period and checked out at this location (might be redundant if checkout requires check-in at same location, but good for flexibility)
          {
            checkOutLocationId: inventoryLocationId,
            checkInTime: { lt: periodStart },
            checkOutTime: { gt: periodEnd },
          },
        ],
      },
      include: {
        member: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        checkInLocation: { select: { id: true, name: true } }, // Useful to confirm, even if filtering by it
        checkOutLocation: { select: { id: true, name: true } },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return locationAttendanceRecords;
  } catch (error) {
    log(LogLevel.ERROR, `Error fetching location attendance for location ${inventoryLocationId}`, {
      error,
      organizationId,
      periodStart,
      periodEnd,
    });
    throw new AppError('Failed to retrieve location attendance records.');
  }
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
          defaultWeightUnit: true,
        },
      },
    },
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
        isActive: true,
      },
    });
  }

  return {
    organization,
    warehouse,
  };
}
