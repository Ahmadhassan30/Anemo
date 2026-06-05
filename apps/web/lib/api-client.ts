/*
 * Purpose: Typed fetch wrapper for the FastAPI backend.
 */
import type { ApiError } from "@/types/api";

export type ApiClientOptions = RequestInit & {
  baseUrl?: string;
};

export async function apiFetch<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  // TODO: implement base URL, auth headers, and error handling
  throw new Error("Not implemented");
}

export function normalizeApiError(error: unknown): ApiError {
  // TODO: normalize error shapes from the API
  return { message: "Unknown error" };
}
