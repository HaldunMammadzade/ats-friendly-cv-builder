import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ApiError = {
  error: string;
  code: string;
  details?: unknown;
};

export const ok = <T>(data: T, status = 200) =>
  NextResponse.json(data, { status });

export const fail = (
  message: string,
  status: number,
  code = "error",
  details?: unknown
) =>
  NextResponse.json<ApiError>(
    details === undefined
      ? { error: message, code }
      : { error: message, code, details },
    { status }
  );

export const unauthorized = () =>
  fail("You must be signed in.", 401, "unauthorized");

export const notFound = (what = "Resource") =>
  fail(`${what} not found.`, 404, "not_found");

/** Returns the caller, or null when unauthenticated. */
export async function currentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Wraps a route handler with auth and uniform error handling so individual
 * handlers stay focused on their own logic.
 */
export function withAuth<Args extends unknown[]>(
  handler: (user: User, ...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      const user = await currentUser();
      if (!user) return unauthorized();
      return await handler(user, ...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return fail("Invalid request body.", 422, "validation_error", {
      issues: error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (error instanceof SyntaxError) {
    return fail("Request body must be valid JSON.", 400, "bad_json");
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  if (process.env.NODE_ENV !== "production") {
    console.error("[api]", error);
  }

  return fail(message, 500, "server_error");
}

/** Parses and validates a JSON body, throwing ZodError on mismatch. */
export async function readJson<T>(
  request: Request,
  schema: { parse: (v: unknown) => T }
): Promise<T> {
  const raw = await request.json();
  return schema.parse(raw);
}
