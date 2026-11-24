export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sessão expirada ou inválida. Entre novamente.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, 429);
  }
}
