export type TcgType = "one-piece" | "pokemon" | "yugioh" | "magic" | "other";

export interface Card {
  id: string;
  tcgType: TcgType;
  name?: string;
  imageUrl?: string;
  setCode?: string;
  cardNumber?: string;
  rarity?: string;
  metadata?: Record<string, unknown>;
  sourceData?: Record<string, unknown>;
}
