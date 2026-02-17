import { fetchAllSetCards } from "@/lib/optcg-api";
import type { OptcgListResponse } from "@/types/optcg";

function toPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = toPositiveInteger(searchParams.get("page"), 1);
  const perPage = toPositiveInteger(searchParams.get("per_page"), 100);
  const search = searchParams.get("search")?.trim() ?? "";

  try {
    const allCards = await fetchAllSetCards();
    const normalizedSearch = search.toLowerCase();
    const filteredCards =
      normalizedSearch.length === 0
        ? allCards
        : allCards.filter((card) => {
            const haystack = [
              card.name,
              card.code,
              card.rarity,
              card.type,
              card.set,
              card.color,
              card.class,
              card.effect,
              card.attribute,
            ]
              .filter((value): value is string => Boolean(value))
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedSearch);
          });

    const total = filteredCards.length;
    const totalPages = Math.max(Math.ceil(total / perPage), 1);
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const data = filteredCards.slice(start, start + perPage);

    const payload: OptcgListResponse = {
      data,
      total,
      current_page: currentPage,
      per_page: perPage,
      total_pages: totalPages,
    };

    return Response.json(payload, { status: 200 });
  } catch {
    return Response.json(
      { error: "Unexpected error while fetching cards." },
      { status: 500 },
    );
  }
}
