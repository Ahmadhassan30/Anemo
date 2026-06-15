import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-url";

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const backendBase = getBackendBaseUrl();
  const filePath = params.path.join("/");
  const url = `${backendBase}/static/${filePath}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ detail: "File not found" }, { status: res.status });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-disposition", "accept-ranges", "etag", "last-modified"]) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new NextResponse(res.body, { status: res.status, headers });
}
