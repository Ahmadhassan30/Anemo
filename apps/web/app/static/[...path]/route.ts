import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-url";

// Proxies /static/* to the backend, forwarding Range requests so <video>
// seeking works and large files stream (instead of buffering the whole body).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendBase = getBackendBaseUrl();
  const filePath = path.join("/");
  const url = `${backendBase}/static/${filePath}`;

  const range = request.headers.get("range");
  const res = await fetch(url, {
    headers: range ? { range } : undefined,
    // Avoid Next.js caching large media responses.
    cache: "no-store",
  });

  // 200 (full) and 206 (partial/range) are both success.
  if (!res.ok && res.status !== 206) {
    return NextResponse.json({ detail: "File not found" }, { status: res.status });
  }

  const headers = new Headers();
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "content-disposition",
    "etag",
    "last-modified",
    "cache-control",
  ]) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new NextResponse(res.body, { status: res.status, headers });
}
