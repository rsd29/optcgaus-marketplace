"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Card } from "@/types/card";

type CardsIndexResponse = {
  cards: Card[];
  total?: number;
  generatedAt?: string;
  error?: string;
};

function toInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sourceIndexHint = toInteger(searchParams.get("i"));

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [card, setCard] = useState<Card | null>(null);

  const cardId = useMemo(() => decodeURIComponent(params.id), [params.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCard() {
      setLoading(true);
      setErrorMessage("");
      setCard(null);

      try {
        const response = await fetch("/api/optcg/cards-index");
        if (!response.ok) {
          throw new Error(`Failed to load card data (${response.status})`);
        }

        const payload = (await response.json()) as CardsIndexResponse;
        if (cancelled) {
          return;
        }

        const cards = payload.cards ?? [];
        let selectedCard: Card | null = null;

        if (
          sourceIndexHint !== null &&
          sourceIndexHint >= 0 &&
          sourceIndexHint < cards.length &&
          cards[sourceIndexHint]?.id === cardId
        ) {
          selectedCard = cards[sourceIndexHint];
        } else {
          selectedCard = cards.find((candidate) => candidate.id === cardId) ?? null;
        }

        if (!selectedCard) {
          setErrorMessage("Card not found in index.");
          return;
        }

        setCard(selectedCard);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCard();
    return () => {
      cancelled = true;
    };
  }, [cardId, sourceIndexHint]);

  const rawData = useMemo(() => {
    if (!card) {
      return {};
    }

    if (card.sourceData && Object.keys(card.sourceData).length > 0) {
      return card.sourceData;
    }

    return {
      id: card.id,
      tcgType: card.tcgType,
      name: card.name ?? null,
      imageUrl: card.imageUrl ?? null,
      setCode: card.setCode ?? null,
      cardNumber: card.cardNumber ?? null,
      rarity: card.rarity ?? null,
      metadata: card.metadata ?? {},
    };
  }, [card]);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Card Product Page</h1>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Back to Search
          </Link>
        </div>

        {loading ? <p className="text-sm text-zinc-700">Loading card...</p> : null}

        {errorMessage ? (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {card ? (
          <>
            <section className="grid gap-4 rounded-xl border border-zinc-300 bg-white p-4 md:grid-cols-[280px_1fr]">
              <div className="overflow-hidden rounded-xl border border-zinc-300 bg-zinc-200">
                <div className="aspect-[2.5/3.5] w-full">
                  {card.imageUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${card.imageUrl})` }}
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-xl font-semibold">{card.name ?? "Unknown Card"}</h2>
                <p className="text-sm text-zinc-700">ID: {card.id}</p>
                <p className="text-sm text-zinc-700">TCG: {card.tcgType}</p>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-300 bg-white p-4">
              <h3 className="mb-3 text-lg font-semibold">All Returned Fields</h3>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                {Object.entries(rawData).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="font-medium text-zinc-800">{key}</p>
                    <p className="mt-1 break-words text-zinc-700">
                      {typeof value === "string" ||
                      typeof value === "number" ||
                      typeof value === "boolean" ||
                      value === null
                        ? String(value)
                        : JSON.stringify(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-300 bg-white p-4">
              <h3 className="mb-3 text-lg font-semibold">Raw JSON</h3>
              <pre className="max-h-[50vh] overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
