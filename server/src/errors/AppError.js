export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(400, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message = 'Invalid state transition') {
    super(409, message);
  }
}
