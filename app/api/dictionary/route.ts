import { NextResponse, type NextRequest } from "next/server";
import {
  DICTIONARY_PAGE_SIZE,
  searchDictionary,
} from "@/lib/dictionary/queries";

// GET /api/dictionary?q=<term>&offset=<n>&limit=<n>
//
// One page of the Chinese dictionary. The list UI pages through it with
// `offset` — 100 rows at a time, fetching the next page when the user
// reaches item 80.

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const query = params.get("q") ?? "";
  const offset = toInt(params.get("offset"), 0);
  const limit = toInt(params.get("limit"), DICTIONARY_PAGE_SIZE);

  try {
    const page = await searchDictionary({ query, offset, limit });
    return NextResponse.json(page);
  } catch (error) {
    console.error("[api/dictionary]", error);
    return NextResponse.json(
      { error: "dictionary_unavailable" },
      { status: 500 },
    );
  }
}

function toInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}
