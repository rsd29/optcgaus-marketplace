"use client";

import { useEffect, useMemo, useState } from "react";
import type { OptcgListResponse } from "@/types/optcg";

const DEFAULT_PER_PAGE = 20;

function toPositiveInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function ApiBrowserPage() {
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState(String(DEFAULT_PER_PAGE));
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [responsePayload, setResponsePayload] = useState<OptcgListResponse | null>(null);

  const perPage = useMemo(
    () => toPositiveInteger(perPageInput, DEFAULT_PER_PAGE),
    [perPageInput],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const query = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (searchInput.trim().length > 0) {
        query.set("search", searchInput.trim());
      }

      try {
        const response = await fetch(`/api/optcg/cards?${query.toString()}`);
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const payload = (await response.json()) as OptcgListResponse;
        if (!cancelled) {
          setResponsePayload(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unknown error");
          setResponsePayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [page, perPage, searchInput]);

  const currentPage = responsePayload?.current_page ?? page;
  const totalPages = Math.max(responsePayload?.total_pages ?? 1, 1);
  const total = responsePayload?.total ?? 0;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="text-2xl font-semibold">OPTCG API Browser</h1>
        <p className="text-sm text-zinc-700">
          Navigate page-by-page and inspect the raw JSON response.
        </p>

        <section className="grid gap-3 rounded-xl border border-zinc-300 bg-white p-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-zinc-700">Search</span>
            <input
              value={searchInput}
              onChange={(event) => {
                setPage(1);
                setSearchInput(event.target.value);
              }}
              placeholder="Try: Luffy"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-zinc-700">Per Page</span>
            <input
              type="number"
              min={1}
              value={perPageInput}
              onChange={(event) => {
                setPage(1);
                setPerPageInput(event.target.value);
              }}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || currentPage <= 1}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={loading || currentPage >= totalPages}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-700">
          <p>Total cards: {total.toLocaleString()}</p>
          <p>
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <section className="overflow-x-auto rounded-xl border border-zinc-300 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Raw Response JSON</h2>
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
            {loading
              ? "Loading..."
              : JSON.stringify(responsePayload ?? { message: "No response loaded yet." }, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
