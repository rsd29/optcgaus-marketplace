import { fetchAllSetCards } from "@/lib/optcg-api";
import type { Card } from "@/types/card";

const PAGE_SIZE = 100;

function mapToCardIndex(cards: Awaited<ReturnType<typeof fetchAllSetCards>>): Card[] {
  return cards.map((apiCard) => ({
    id: apiCard.id,
    tcgType: "one-piece",
    name: apiCard.name,
    imageUrl: apiCard.image,
    setCode: apiCard.code,
    rarity: apiCard.rarity,
    metadata: {
      code: apiCard.code ?? null,
      rarity: apiCard.rarity ?? null,
      set: apiCard.set ?? null,
      type: apiCard.type ?? null,
      cost: apiCard.cost ?? null,
      attribute: apiCard.attribute ?? null,
      power: apiCard.power ?? null,
      counter: apiCard.counter ?? null,
      color: apiCard.color ?? null,
      class: apiCard.class ?? null,
      effect: apiCard.effect ?? null,
      image: apiCard.image ?? null,
    },
    sourceData: { ...apiCard },
  }));
}

export async function GET() {
  try {
    const upstreamCards = await fetchAllSetCards();
    const allCards: Card[] = mapToCardIndex(upstreamCards);
    const total = allCards.length;
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    return Response.json(
      {
        total,
        totalPages,
        perPage: PAGE_SIZE,
        cards: allCards,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch {
    return Response.json(
      {
        total: 0,
        totalPages: 0,
        perPage: PAGE_SIZE,
        cards: [],
        generatedAt: new Date().toISOString(),
        error: "Failed to build card index.",
      },
      { status: 500 },
    );
  }
}
