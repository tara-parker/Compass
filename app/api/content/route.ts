import { NextResponse } from "next/server";
import { browse } from "@/lib/browse";

/**
 * GET /api/content?path=blog/some-slug
 * Returns a directory listing or a parsed markdown file (frontmatter + body).
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p = searchParams.get("path") ?? "";
  const slug = p.split("/").map((s) => s.trim()).filter(Boolean);
  const res = browse(slug);
  if (res.kind === "missing") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(res);
}
