import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const { searchDictionary } = vi.hoisted(() => ({ searchDictionary: vi.fn() }));

vi.mock("@/lib/dictionary/queries", () => ({
  searchDictionary,
  DICTIONARY_PAGE_SIZE: 100,
}));

import { GET } from "@/app/api/dictionary/route";

// The route handler is the dictionary's only public-ish surface: it parses
// the query string, clamps the paging and turns a database outage into a
// clean error instead of an unhandled rejection.

function request(url: string) {
  return new NextRequest(url);
}

describe("GET /api/dictionary", () => {
  it("passes the query, offset and limit through", async () => {
    searchDictionary.mockResolvedValue({
      items: [],
      offset: 10,
      limit: 20,
      hasMore: false,
      query: "你好",
    });

    await GET(request("http://localhost:3000/api/dictionary?q=%E4%BD%A0%E5%A5%BD&offset=10&limit=20"));

    expect(searchDictionary).toHaveBeenCalledWith({
      query: "你好",
      offset: 10,
      limit: 20,
    });
  });

  it("defaults the offset to 0 and the limit to the page size", async () => {
    searchDictionary.mockResolvedValue({
      items: [],
      offset: 0,
      limit: 100,
      hasMore: false,
      query: "",
    });

    await GET(request("http://localhost:3000/api/dictionary"));

    expect(searchDictionary).toHaveBeenCalledWith({
      query: "",
      offset: 0,
      limit: 100,
    });
  });

  it("falls back to the defaults when the numbers are not numbers", async () => {
    searchDictionary.mockResolvedValue({
      items: [],
      offset: 0,
      limit: 100,
      hasMore: false,
      query: "",
    });

    await GET(
      request("http://localhost:3000/api/dictionary?offset=abc&limit=xyz"),
    );

    expect(searchDictionary).toHaveBeenCalledWith({
      query: "",
      offset: 0,
      limit: 100,
    });
  });

  it("returns the page as JSON", async () => {
    const page = {
      items: [
        {
          id: 1,
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          pinyinNumeric: "ni3 hao3",
          meanings: ["hello"],
        },
      ],
      offset: 0,
      limit: 100,
      hasMore: true,
      query: "",
    };
    searchDictionary.mockResolvedValue(page);

    const response = await GET(
      request("http://localhost:3000/api/dictionary"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(page);
  });

  it("returns a clean error when the database is down", async () => {
    searchDictionary.mockRejectedValue(new Error("connection refused"));

    const response = await GET(
      request("http://localhost:3000/api/dictionary"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "dictionary_unavailable" });
  });
});
