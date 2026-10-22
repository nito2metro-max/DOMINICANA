export type AppErrorCode = "forbidden" | "not_found" | "invalid" | "conflict" | "rate_limited";

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const forbidden = (msg = "No tienes permiso para realizar esta acción") => new AppError("forbidden", msg);
export const notFound = (msg = "No encontrado") => new AppError("not_found", msg);
export const invalid = (msg: string) => new AppError("invalid", msg);
