export interface OptcgApiCard {
  id: string;
  code?: string;
  rarity?: string;
  type?: string;
  name?: string;
  cost?: number;
  attribute?: string;
  power?: number;
  counter?: number;
  color?: string;
  class?: string;
  effect?: string;
  set?: string;
  image?: string;
  life?: number;
  marketPrice?: number;
  inventoryPrice?: number;
  setId?: string;
  imageId?: string;
  raw?: Record<string, unknown>;
}

export interface OptcgListResponse {
  data?: OptcgApiCard[];
  total?: number;
  current_page?: number;
  per_page?: number;
  total_pages?: number;
}
