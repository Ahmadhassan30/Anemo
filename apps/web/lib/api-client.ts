import type { ApiError } from "@/types/api";
import { getSession } from "next-auth/react";

export type ApiClientOptions = RequestInit & {
  baseUrl?: string;
};

export async function apiFetch<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Retrieve NextAuth session to inject JWT authorization header
  const session = await getSession();
  if (session && (session as any).accessToken) {
    headers.set("Authorization", `Bearer ${(session as any).accessToken}`);
  } else if (session && (session.user as any).id) {
    // Fallback/Mock auth token during development
    headers.set("Authorization", `Bearer ${(session.user as any).id}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody.detail || errorBody.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  
  return response.json() as Promise<T>;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
}

export const apiClient = {
  lectures: {
    create: async (title: string) => {
      return apiFetch<{ lecture_id: string; title: string }>("/lectures", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
    },
    confirmUpload: async (lectureId: string, videoUrl: string) => {
      return apiFetch<{ id: string; raw_video_url: string }>(`/lectures/${lectureId}/confirm-upload`, {
        method: "POST",
        body: JSON.stringify({ video_url: videoUrl }),
      });
    },
  },
  pipeline: {
    trigger: async (lectureId: string) => {
      return apiFetch<{ status: string }>(`/pipeline/${lectureId}/trigger`, {
        method: "POST",
      });
    },
  },
};

