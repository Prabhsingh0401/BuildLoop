class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = true;

    this.name = "AppError";

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;