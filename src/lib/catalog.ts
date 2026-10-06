import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import sandia from "@/assets/plants/sandia.jpg";
import mango from "@/assets/plants/mango.jpg";
import fresa from "@/assets/plants/fresa.jpg";
import limon from "@/assets/plants/limon.jpg";
import higo from "@/assets/plants/higo.jpg";
import albahaca from "@/assets/plants/albahaca.jpg";
import abeja from "@/assets/plants/abeja.jpg";
import aguaSandia from "@/assets/plants/agua-sandia.jpg";

const images: Record<string, string> = {
  sandia, mango, fresa, limon, higo, albahaca, abeja, "agua-sandia": aguaSandia,
};
/** image_key may be a bundled asset key or a full https URL. */
export const imageSrc = (key: string | null | undefined) =>
  !key ? undefined : key.startsWith("http") ? key : images[key];

export type Category = { id: string; slug: string; name: string; description: string | null; parent_id: string | null };
export type Tag = { id: string; slug: string; name: string };
export type ItemType = { id: string; slug: string; name: string; subtitle_label: string | null };
export type Attribute = { label: string; value: string };
export type Item = {
  id: string; slug: string; type_id: string; name: string; subtitle: string | null;
  description: string | null; image_key: string | null; attributes: Attribute[];
  categoryIds: string[]; tagIds: string[]; gallery: { image_key: string; caption: string | null }[];
};
export type Catalog = { items: Item[]; categories: Category[]; tags: Tag[]; types: ItemType[] };

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: async (): Promise<Catalog> => {
    const [it, c, t, ty, ic, itg, im] = await Promise.all([
      supabase.from("items").select("*").order("name"),
      supabase.from("categories").select("id,slug,name,description,parent_id").order("name"),
      supabase.from("tags").select("id,slug,name").order("name"),
      supabase.from("item_types").select("id,slug,name,subtitle_label").order("name"),
      supabase.from("item_categories").select("*"),
      supabase.from("item_tags").select("*"),
      supabase.from("item_images").select("item_id,image_key,caption,position").order("position"),
    ]);
    const err = it.error || c.error || t.error || ty.error || ic.error || itg.error || im.error;
    if (err) throw err;
    const items: Item[] = (it.data ?? []).map((row) => ({
      ...row,
      attributes: Array.isArray(row.attributes) ? (row.attributes as unknown as Attribute[]) : [],
      categoryIds: (ic.data ?? []).filter((r) => r.item_id === row.id).map((r) => r.category_id),
      tagIds: (itg.data ?? []).filter((r) => r.item_id === row.id).map((r) => r.tag_id),
      gallery: (im.data ?? []).filter((r) => r.item_id === row.id),
    }));
    return { items, categories: c.data ?? [], tags: t.data ?? [], types: ty.data ?? [] };
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
  return [id, ...all.filter((c) => c.parent_id === id).flatMap((k) => descendantIds(k.id, all))];
}

export function itemsIn(catId: string, cat: Catalog) {
  const ids = new Set(descendantIds(catId, cat.categories));
  return cat.items.filter((p) => p.categoryIds.some((c) => ids.has(c)));
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function filterItems(items: Item[], q: string, tagSlugs: string[], cat: Catalog) {
  const nq = norm(q.trim());
  const tagIds = tagSlugs.map((s) => cat.tags.find((t) => t.slug === s)?.id).filter(Boolean) as string[];
  return items.filter((p) => {
    if (tagIds.length && !tagIds.every((t) => p.tagIds.includes(t))) return false;
    if (!nq) return true;
    const hay = [
      p.name, p.subtitle,
      cat.types.find((t) => t.id === p.type_id)?.name,
      ...p.tagIds.map((id) => cat.tags.find((t) => t.id === id)?.name),
      ...p.categoryIds.map((id) => cat.categories.find((c) => c.id === id)?.name),
    ].filter(Boolean).join(" ");
    return norm(hay).includes(nq);
  });
}
