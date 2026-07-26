import { Language } from "./language";
export interface Schema {
  posts: any[];
  posts_categories: any[];
  events: any[];
  categories: any[];
  products: any[];
  opening_hours: any[];
  tenants: any[];
  languages: Language[];
}
