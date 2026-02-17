import type { OptcgApiCard } from "@/types/optcg";

const API_BASE_URL = "https://optcgapi.com";

type UnknownRecord = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function makeCardId(raw: UnknownRecord, index: number): string {
  const imageId = asString(raw.card_image_id);
  const setCardId = asString(raw.card_set_id);
  const setId = asString(raw.set_id);

  if (imageId) {
    return imageId;
  }

  if (setCardId && setId) {
    return `${setId}-${setCardId}-${index}`;
  }

  if (setCardId) {
    return `${setCardId}-${index}`;
  }

  return `card-${index}`;
}

export function normalizeOptcgCard(raw: UnknownRecord, index: number): OptcgApiCard {
  return {
    id: makeCardId(raw, index),
    code: asString(raw.card_set_id),
    rarity: asString(raw.rarity),
    type: asString(raw.card_type),
    name: asString(raw.card_name),
    cost: asNumber(raw.card_cost),
    attribute: asString(raw.attribute),
    power: asNumber(raw.card_power),
    counter: asNumber(raw.counter_amount),
    color: asString(raw.card_color),
    class: asString(raw.sub_types),
    effect: asString(raw.card_text),
    set: asString(raw.set_name),
    image: asString(raw.card_image),
    life: asNumber(raw.life),
    marketPrice: asNumber(raw.market_price),
    inventoryPrice: asNumber(raw.inventory_price),
    setId: asString(raw.set_id),
    imageId: asString(raw.card_image_id),
    raw,
  };
}

export async function fetchAllSetCards(): Promise<OptcgApiCard[]> {
  const response = await fetch(`${API_BASE_URL}/api/allSetCards/`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Upstream API error (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((row, index) => normalizeOptcgCard((row ?? {}) as UnknownRecord, index));
}
