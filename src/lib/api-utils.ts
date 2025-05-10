// src/lib/api-utils.ts (or utils/api-errors.ts)
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/prisma/client";
import { ApiError } from "next/dist/server/api-utils"; // Or define a custom error class

// Optional: Define a custom error class for authorization/specific API errors
export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}
export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  // Log the error for debugging purposes
  console.error("[API_ERROR]", error);

  // Zod Validation Errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid input.",
        details: error.flatten().fieldErrors, // Provides detailed field errors
      },
      { status: 400 } // Bad Request
    );
  }

  // Prisma Known Request Errors (e.g., unique constraint, record not found)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": // Unique constraint violation
        return NextResponse.json(
          {
            error: "Conflict: A record with this identifier already exists.",
            field: error.meta?.target,
          },
          { status: 409 } // Conflict
        );
      case "P2025": // Record not found
        return NextResponse.json(
          { error: "Not Found: The requested resource could not be found." },
          { status: 404 } // Not Found
        );
      // Add more specific Prisma error codes as needed
      default:
        return NextResponse.json(
          { error: "Database error occurred." },
          { status: 500 } // Internal Server Error
        );
    }
  }

  // Prisma Validation Errors (e.g., missing required fields for Prisma)
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: "Database validation error.", details: error.message },
      { status: 400 } // Bad Request - likely due to invalid data shape sent to Prisma
    );
  }

  // Custom Authorization Error
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message || "Forbidden" },
      { status: 403 } // Forbidden
    );
  }

  // Custom Not Found Error
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message || "Not Found" },
      { status: 404 } // Not Found
    );
  }

  // Next.js specific API errors (optional, if you use throw new ApiError())
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Default/Unknown Errors
  return NextResponse.json(
    {
      error:
        "An unexpected error occurred. Please contact support if the problem persists.",
    },
    { status: 500 } // Internal Server Error
  );
}
