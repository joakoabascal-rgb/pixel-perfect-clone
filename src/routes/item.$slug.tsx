import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { catalogQuery, categoryPath, imageSrc, type Tag } from "@/lib/catalog";
import { Breadcrumb, Loading, Shell, TagChip } from "@/components/catalog-ui";

export const Route = createFileRoute("/item/$slug")({
  validateSearch: zodValidator(z.object({ desde: fallback(z.string(), "").default("") })),
  head: () => ({
    meta: [
      { title: "Ficha — All Wiki" },
      { name: "description", content: "Ficha del catálogo con imágenes, categorías, etiquetas e información." },
      { property: "og:title", content: "Ficha — All Wiki" },
      { property: "og:description", content: "Ficha del catálogo con imágenes, categorías, etiquetas e información." },
    ],
  }),
  component: ItemPage,
});

function ItemPage() {
  const { slug } = Route.useParams();
  const { desde } = Route.useSearch();
  const { data } = useQuery(catalogQuery);
  const [active, setActive] = useState<string | null>(null);
  if (!data) return <Shell><Loading /></Shell>;
  const item = data.items.find((p) => p.slug === slug);
  if (!item) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <p className="font-display text-2xl">Entrada no encontrada</p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary">Volver al catálogo</Link>
        </div>
      </Shell>
    );
  }
  const type = data.types.find((t) => t.id === item.type_id);
  const cats = data.categories.filter((c) => item.categoryIds.includes(c.id));
  const leaves = cats.filter((c) => !cats.some((o) => o.parent_id === c.id));
  const tags = item.tagIds.map((id) => data.tags.find((t) => t.id === id)).filter(Boolean) as Tag[];
  const fromCat = data.categories.find((c) => c.slug === desde && item.categoryIds.includes(c.id))
    ?? data.categories.find((c) => c.slug === desde);
  const crumbs = fromCat ? categoryPath(fromCat, data.categories) : leaves[0] ? categoryPath(leaves[0], data.categories) : [];
  const allImages = [item.image_key, ...item.gallery.map((g) => g.image_key)].filter(Boolean) as string[];
  const main = imageSrc(active ?? allImages[0]);

  return (
    <Shell>
      <Breadcrumb path={crumbs} current={item.name} />
      <section className="overflow-hidden rounded-none bg-secondary border-b-2 border-primary/40 p-4 ring-2 ring-border  sm:p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          <div>
            <div className="aspect-square overflow-hidden rounded-none bg-background">
              {main ? (
                <img src={main} alt={item.name} width={896} height={752} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center font-display text-6xl text-sage">{item.name[0]}</div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2">
                {allImages.map((k) => (
                  <button
                    key={k}
                    onClick={() => setActive(k)}
                    className={`size-16 overflow-hidden rounded-none ring-2 ${(active ?? allImages[0]) === k ? "ring-primary" : "ring-transparent"}`}
                  >
                    <img src={imageSrc(k)} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="py-1">
            <p className="eyebrow text-accent">{type?.name ?? "Ficha"}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold uppercase tracking-wide leading-tight text-balance">{item.name}</h1>
            {item.subtitle && (
              <p className="mt-1 font-display text-base italic text-muted-foreground">{item.subtitle}</p>
            )}
            {item.description && (
              <p className="mt-4 max-w-[56ch] text-base text-pretty text-foreground/75">{item.description}</p>
            )}

            {item.attributes.length > 0 && (
              <div className="mt-6">
                <p className="eyebrow mb-2">Información</p>
                <dl className="grid gap-px overflow-hidden rounded-none bg-border ring-2 ring-border sm:grid-cols-2">
                  {item.attributes.map((a) => (
                    <div key={a.label} className="bg-secondary/90 p-3">
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{a.label}</dt>
                      <dd className="mt-0.5 text-sm">{a.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Categorías</p>
                <ul className="space-y-1.5 text-sm">
                  {leaves.map((c) => {
                    const path = categoryPath(c, data.categories);
                    return (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-none bg-primary" />
                        <span className="flex flex-wrap gap-1">
                          {path.map((p, i) => (
                            <span key={p.id}>
                              <Link to="/categoria/$slug" params={{ slug: p.slug }} className="text-foreground/65 hover:text-primary">{p.name}</Link>
                              {i < path.length - 1 && <span className="ml-1 opacity-50">→</span>}
                            </span>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-2">Etiquetas</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, i) => <TagChip key={t.id} tag={t} primary={i === 0} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
