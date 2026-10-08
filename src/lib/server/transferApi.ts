import { NextResponse } from "next/server";
import { checkRateLimit } from "./rateLimit";

export type TransferErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "LIMIT_REACHED"
  | "INTERNAL_ERROR";

export function jsonTransferError(
  code: TransferErrorCode,
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function enforceTransferRateLimit(
  request: Request,
  userOrIp?: string,
  limit = 20,
  windowMs = 60 * 1000
) {
  const forwarded = request.headers.get("x-forwarded-for");
  const identifier =
    userOrIp ||
    (forwarded ? forwarded.split(",")[0]?.trim() || "local" : "local");

  const result = checkRateLimit(`transfer:${identifier}`, limit, windowMs);

  if (!result.allowed) {
    return jsonTransferError(
      "RATE_LIMITED",
      "Transfer rate limit exceeded. Please wait before starting new transfers.",
      429
    );
  }
  return null;
}
