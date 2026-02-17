"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Card } from "@/types/card";

const PAGE_SIZE = 100;

type CardsIndexResponse = {
  total: number;
  cards: Card[];
  generatedAt?: string;
  error?: string;
};

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const pageSet = new Set<number>();
  pageSet.add(1);
  pageSet.add(totalPages);

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pageSet.add(page);
    }
  }

  return Array.from(pageSet).sort((a, b) => a - b);
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [reportedTotal, setReportedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;

    async function loadCardIndex() {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/optcg/cards-index");
        if (!response.ok) {
          throw new Error(`Failed to load card index (${response.status})`);
        }

        const payload = (await response.json()) as CardsIndexResponse;
        if (cancelled) {
          return;
        }

        setAllCards(payload.cards ?? []);
        setReportedTotal(payload.total ?? 0);
        setErrorMessage(payload.error ?? "");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAllCards([]);
        setReportedTotal(0);
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCardIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  const filteredCards = useMemo(() => {
    const searchText = deferredQuery.trim().toLowerCase();
    const indexedCards = allCards.map((card, sourceIndex) => ({ card, sourceIndex }));
    if (searchText.length === 0) {
      return indexedCards;
    }

    return indexedCards.filter(({ card }) => {
      const setName =
        typeof card.metadata?.set === "string" ? card.metadata.set.toLowerCase() : "";
      const typeName =
        typeof card.metadata?.type === "string" ? card.metadata.type.toLowerCase() : "";

      return (
        card.name?.toLowerCase().includes(searchText) ||
        card.setCode?.toLowerCase().includes(searchText) ||
        card.rarity?.toLowerCase().includes(searchText) ||
        setName.includes(searchText) ||
        typeName.includes(searchText)
      );
    });
  }, [allCards, deferredQuery]);

  const totalPages = Math.max(Math.ceil(filteredCards.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visiblePages = getVisiblePages(safeCurrentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const visibleCards = filteredCards.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Image
          src="/logo.png"
          alt="DON AU logo"
          width={140}
          height={90}
          priority
          className="mb-4"
        />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cards..."
          className="mb-6 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-700">
          <Link
            href="/api-browser"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            API Browser
          </Link>
          <p>Total cards in index: {reportedTotal.toLocaleString()}</p>
          <p>
            Showing {filteredCards.length.toLocaleString()} result
            {filteredCards.length === 1 ? "" : "s"}
          </p>
          <p>
            Page {safeCurrentPage} of {totalPages}
          </p>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {loading ? (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <div
                key={`loading-${index + 1}`}
                className="aspect-[2.5/3.5] w-full animate-pulse rounded-xl border border-zinc-300 bg-zinc-200"
              />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleCards.map(({ card, sourceIndex }) => (
              <Link
                key={`${card.id}-${sourceIndex}`}
                href={`/product/${encodeURIComponent(card.id)}?i=${sourceIndex}`}
                className="overflow-hidden rounded-xl border border-zinc-300 bg-zinc-200 transition hover:scale-[1.01] hover:shadow-md"
              >
                <div className="aspect-[2.5/3.5] w-full">
                  {card.imageUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${card.imageUrl})` }}
                    />
                  ) : null}
                </div>
              </Link>
            ))}
          </section>
        )}

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage <= 1}
            className={`rounded-md border px-3 py-2 text-sm ${
              safeCurrentPage <= 1
                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Prev
          </button>

          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`rounded-md border px-3 py-2 text-sm ${
                page === safeCurrentPage
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage >= totalPages}
            className={`rounded-md border px-3 py-2 text-sm ${
              safeCurrentPage >= totalPages
                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Next
          </button>
        </nav>
      </div>
    </main>
  );
}
