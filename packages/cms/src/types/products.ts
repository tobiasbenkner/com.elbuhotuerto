import { DirectusFile } from "@directus/sdk";
import { ReducedTranslations } from "../types";
export interface Product {
  id: string;
  name: ReducedTranslations;
  description: ReducedTranslations;
  note: ReducedTranslations;
  image: DirectusFile;
  allergies: string[];
  category: string;
  sort: number;
  stock: number | null;
  price_gross: string;
}

export interface ProductCategory {
  id: string;
  name: ReducedTranslations;
  description: ReducedTranslations;
  image: DirectusFile;
  sort: number;
  products: Product[];
}
