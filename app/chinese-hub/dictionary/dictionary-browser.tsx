"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getDictionary, t, type Locale } from "@/lib/i18n";
import type { DictionaryEntry } from "@/lib/dictionary/queries";

/** Rows per page — must match the server's page size. */
const PAGE_SIZE = 100;

/**
 * Fetch the next page once the user has reached this many rows, i.e. 20
 * rows before the end of the loaded list — the next 100 are already on
 * their way before they get there.
 */
const TRIGGER_AFTER = 80;

/** How long to wait after the last keystroke before searching. */
const DEBOUNCE_MS = 300;

type PageResponse = {
  items: DictionaryEntry[];
  offset: number;
  limit: number;
  hasMore: boolean;
  query: string;
};

type Props = {
  locale: Locale;
  /** The first page — fetched on the server. */
  initialItems: DictionaryEntry[];
  initialHasMore: boolean;
};

export function DictionaryBrowser({
  locale,
  initialItems,
  initialHasMore,
}: Props) {
  const dict = getDictionary(locale);

  const [term, setTerm] = useState("");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  // Only the newest request may write to the list — an older one that
  // arrives late is ignored.
  const requestId = useRef(0);
  // The term that is currently loaded.
  const loadedTerm = useRef("");

  const load = useCallback(
    (q: string, start: number, append: boolean) => {
      const id = ++requestId.current;
      startTransition(async () => {
        try {
          const response = await fetch(
            `/api/dictionary?q=${encodeURIComponent(q)}&offset=${start}&limit=${PAGE_SIZE}`,
          );
          if (!response.ok) {
            throw new Error(`dictionary request failed: ${response.status}`);
          }
          const page = (await response.json()) as PageResponse;
          if (id !== requestId.current) return;
          setItems((previous) =>
            append ? [...previous, ...page.items] : page.items,
          );
          setHasMore(page.hasMore);
          setFailed(false);
        } catch {
          if (id === requestId.current) setFailed(true);
        }
      });
    },
    [startTransition],
  );

  // Search when the user stops typing. The fetch happens in the timer
  // callback, not in the effect body.
  useEffect(() => {
    const q = term.trim();
    if (q === loadedTerm.current) return;
    const timer = setTimeout(() => {
      loadedTerm.current = q;
      load(q, 0, false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, load]);

  // The sentinel sits 80 rows into the page that is currently loaded, so
  // the next fetch starts when the user reaches item 80 of that page.
  //
  // `ceil` picks the page the list currently ends in: with 100 rows loaded
  // that is the first page, so the sentinel goes after row 80. With 200
  // rows it is the second page, so it goes after row 180.
  const sentinelIndex =
    (Math.ceil(items.length / PAGE_SIZE) - 1) * PAGE_SIZE + (TRIGGER_AFTER - 1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (pending || !hasMore) return;
        void load(loadedTerm.current, items.length, true);
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, pending, hasMore, load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t(dict, "chinese.dictionary.search.placeholder")}
          aria-label={t(dict, "chinese.dictionary.search.label")}
          className="h-9 pl-8"
        />
      </div>

      {failed ? (
        <p className="text-sm text-destructive">
          {t(dict, "chinese.dictionary.error")}
        </p>
      ) : items.length === 0 && !pending ? (
        <p className="text-sm text-muted-foreground">
          {t(dict, "chinese.dictionary.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((entry, index) => (
            <Fragment key={entry.id}>
              <li className="rounded-lg border border-border px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl leading-none font-semibold">
                    {entry.simplified}
                  </span>
                  {entry.traditional !== entry.simplified && (
                    <span className="text-xl leading-none text-muted-foreground">
                      {entry.traditional}
                    </span>
                  )}
                  {entry.pinyin && (
                    <span className="text-sm text-muted-foreground">
                      {entry.pinyin}
                    </span>
                  )}
                  {entry.pinyinNumeric && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.pinyinNumeric}
                    </span>
                  )}
                </div>
                {entry.meanings.length > 0 && (
                  <p className="mt-1.5 text-sm">
                    {entry.meanings.slice(0, 2).join("; ")}
                  </p>
                )}
              </li>
              {index === sentinelIndex && (
                <div ref={sentinelRef} aria-hidden className="h-px w-full" />
              )}
            </Fragment>
          ))}
        </ul>
      )}

      {pending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t(dict, "chinese.dictionary.loading")}
        </p>
      )}
    </div>
  );
}
