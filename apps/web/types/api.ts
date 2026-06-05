/*
 * Purpose: API response and error types.
 */
export type ApiError = {
  message: string;
  code?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
