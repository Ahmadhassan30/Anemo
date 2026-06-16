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

export interface CreateLectureResponse {
  lecture_id: string;
  title: string;
}

export interface AgentRunRecord {
  agent_name: string;
  status: "started" | "success" | "failed" | "retrying";
  attempt: number;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_s: number | null;
}

export interface PipelineStateResponse {
  lecture_id: string;
  status: string; // pending | processing | completed | failed
  youtube_url: string | null;
  agent_runs: AgentRunRecord[];
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
    create: async (title: string): Promise<CreateLectureResponse> => {
      return fetchAPI<CreateLectureResponse>("/lectures", {
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
    getState: async (lectureId: string): Promise<PipelineStateResponse> => {
      return fetchAPI<PipelineStateResponse>(`/pipeline/${lectureId}/state`);
    },
    getSseUrl: (lectureId: string): string => {
      return `${API_BASE_URL}/pipeline/${lectureId}/status`;
    }
  },
  students: {
    getEnrolledLectures: async (): Promise<any[]> => {
      return fetchAPI<any[]>("/students/lectures");
    },
    enroll: async (lectureId: string): Promise<any> => {
      return fetchAPI<any>("/students/enroll", {
        method: "POST",
        body: JSON.stringify({ lecture_id: lectureId }),
      });
    },
    getQuiz: async (lectureId: string): Promise<any> => {
      return fetchAPI<any>(`/students/lectures/${lectureId}/quiz`);
    },
    submitQuiz: async (lectureId: string, answers: Record<string, string>): Promise<any> => {
      return fetchAPI<any>(`/students/lectures/${lectureId}/quiz/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
    },
  },
  chat: {
    history: async (lectureId: string): Promise<any[]> => {
      return fetchAPI<any[]>(`/chat/${lectureId}/history`);
    },
    send: async (lectureId: string, question: string): Promise<any> => {
      return fetchAPI<any>("/chat", {
        method: "POST",
        body: JSON.stringify({ lecture_id: lectureId, question }),
      });
    },
  },
};
