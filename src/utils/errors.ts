import { Prisma } from "@/prisma/client";

// utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, details?: any, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational; // Differentiate operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'User not authenticated.') {
    super(message, 401);
  }
}


export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict.') {
    super(message, 409);
  }
}

export class SlugGenerationError extends AppError {
  constructor(message: string = 'Failed to generate a unique slug.') {
    super(message, 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'A database error occurred.') {
    super(message, 500);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, identifier: string | { [key: string]: any }) {
    const idString = typeof identifier === 'string' ? identifier : JSON.stringify(identifier);
    super(`${entity} identified by '${idString}' not found.`, 404);
  }
}

export class AlreadyCheckedInError extends AppError {
  constructor(memberId: string) {
    super(`Member ${memberId} is already checked in.`, 409); // 409 Conflict
  }
}

export class NotCheckedInError extends AppError {
  constructor(memberId: string) {
    super(`Member ${memberId} is not currently checked in.`, 400);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details); // 400 Bad Request
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(message, 403);
  }
}


export const handlePrismaError = (
  error: unknown
): { error: string; fieldErrors?: Record<string, string> } => {
  console.error("Prisma Error:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      const field = target ? target.join(", ") : "field";
      return {
        error: `A record with this ${field} already exists. Please use a unique value.`,
        fieldErrors: target
          ? { [target[0]]: `This ${target[0]} is already taken.` }
          : undefined,
      };
    }
    if (error.code === "P2025") {
      return {
        error: "The record you tried to update or delete does not exist.",
      };
    }
    return {
      error: `Database error occurred (Code: ${error.code}). Please try again.`,
    };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    return { error: "Invalid data format submitted. Please check your input." };
  }
  return {
    error:
      "An unexpected error occurred. Please contact support if the problem persists.",
  };
};