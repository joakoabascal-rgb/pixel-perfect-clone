import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import sandia from "@/assets/plants/sandia.jpg";
import mango from "@/assets/plants/mango.jpg";
import fresa from "@/assets/plants/fresa.jpg";
import limon from "@/assets/plants/limon.jpg";
import higo from "@/assets/plants/higo.jpg";
import albahaca from "@/assets/plants/albahaca.jpg";

const images: Record<string, string> = { sandia, mango, fresa, limon, higo, albahaca };
export const plantImage = (key: string | null) => (key ? images[key] : undefined);

export type Category = { id: string; slug: string; name: string; description: string | null; parent_id: string | null };
export type Tag = { id: string; slug: string; name: string };
export type Plant = {
  id: string; slug: string; name: string; scientific_name: string | null; family: string | null;
  description: string | null; image_key: string | null; categoryIds: string[]; tagIds: string[];
};
export type Catalog = { plants: Plant[]; categories: Category[]; tags: Tag[] };

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: async (): Promise<Catalog> => {
    const [p, c, t, pc, pt] = await Promise.all([
      supabase.from("plants").select("*").order("name"),
      supabase.from("categories").select("id,slug,name,description,parent_id").order("name"),
      supabase.from("tags").select("*").order("name"),
      supabase.from("plant_categories").select("*"),
      supabase.from("plant_tags").select("*"),
    ]);
    const err = p.error || c.error || t.error || pc.error || pt.error;
    if (err) throw err;
    const plants = (p.data ?? []).map((pl) => ({
      ...pl,
      categoryIds: (pc.data ?? []).filter((r) => r.plant_id === pl.id).map((r) => r.category_id),
      tagIds: (pt.data ?? []).filter((r) => r.plant_id === pl.id).map((r) => r.tag_id),
    }));
    return { plants, categories: c.data ?? [], tags: t.data ?? [] };
  },
});

export function categoryPath(cat: Category, all: Category[]): Category[] {
  const path: Category[] = [cat];
  let cur = cat;
  while (cur.parent_id) {
    const parent = all.find((c) => c.id === cur.parent_id);
    if (!parent) break;
    path.unshift(parent);
    cur = parent;
  }
  return path;
}

export function descendantIds(id: string, all: Category[]): string[] {
  const kids = all.filter((c) => c.parent_id === id);
  return [id, ...kids.flatMap((k) => descendantIds(k.id, all))];
}

export function plantsIn(catId: string, cat: Catalog) {
  const ids = new Set(descendantIds(catId, cat.categories));
  return cat.plants.filter((p) => p.categoryIds.some((c) => ids.has(c)));
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function filterPlants(plants: Plant[], q: string, tagIds: string[], tags: Tag[]) {
  const nq = norm(q.trim());
  return plants.filter((p) => {
    if (tagIds.length && !tagIds.every((t) => p.tagIds.includes(t))) return false;
    if (!nq) return true;
    const hay = [p.name, p.scientific_name, p.family, ...p.tagIds.map((id) => tags.find((t) => t.id === id)?.name)]
      .filter(Boolean).join(" ");
    return norm(hay).includes(nq);
  });
}
