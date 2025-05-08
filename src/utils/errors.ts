// utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    this.name = this.constructor.name;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'User not authenticated.') {
    super(message, 401);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: any
  ) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found.') {
    super(message, 404);
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

// Add other custom errors as needed
