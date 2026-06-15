export function getBackendBaseUrl(): string {
  return (
    process.env.NEXTAUTH_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
    "http://localhost:8000"
  );
}
