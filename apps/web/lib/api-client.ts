import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // In our JWT-based next-auth setup, the token is kept in the session
  if (session && (session as any).accessToken) {
    headers.set("Authorization", `Bearer ${(session as any).accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// ---------------------------------------------------------------------------
// Typed Interfaces
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
}

export interface LectureResponse {
  id: string;
  title: string;
  status: string;
  raw_video_url?: string;
  youtube_url?: string;
  created_at: string;
}

export interface LectureListResponse {
  items: LectureResponse[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Client API
// ---------------------------------------------------------------------------

export interface PresignedUploadResponse {
  lecture_id: string;
  title: string;
  presigned_url?: string;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<TokenResponse> => {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      
      const res = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    register: async (email: string, password: string, role: string): Promise<UserResponse> => {
      return fetchAPI<UserResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
    },
  },
  lectures: {
    list: async (page = 1, limit = 10): Promise<LectureListResponse> => {
      return fetchAPI<LectureListResponse>(`/lectures?page=${page}&limit=${limit}`);
    },
    create: async (title: string): Promise<PresignedUploadResponse> => {
      return fetchAPI<PresignedUploadResponse>("/lectures", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
    },
    confirmUpload: async (lectureId: string, publicUrl: string): Promise<LectureResponse> => {
      return fetchAPI<LectureResponse>(`/lectures/${lectureId}/confirm-upload`, {
        method: "POST",
        body: JSON.stringify({ video_url: publicUrl }),
      });
    },
    get: async (lectureId: string): Promise<LectureResponse> => {
      return fetchAPI<LectureResponse>(`/lectures/${lectureId}`);
    },
    delete: async (lectureId: string): Promise<void> => {
      return fetchAPI<void>(`/lectures/${lectureId}`, { method: "DELETE" });
    },
  },
  pipeline: {
    trigger: async (lectureId: string): Promise<void> => {
      return fetchAPI<void>(`/pipeline/${lectureId}/trigger`, { method: "POST" });
    },
    // We export the SSE URL for the native EventSource setup
    getSseUrl: (lectureId: string): string => {
      return `${API_BASE_URL}/pipeline/${lectureId}/status`;
    }
  },
};
