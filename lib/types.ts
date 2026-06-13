import type { ListingCategory } from "@/lib/categories";

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  category: ListingCategory;
  price: number;
  condition_score: number;
  condition_label: string;
  description: string;
  discord_id: string | null;
  checkout_url: string | null;
  image_url: string | null;
  status: "active" | "sold" | "hidden";
  created_at: string;
  updated_at: string;
};
