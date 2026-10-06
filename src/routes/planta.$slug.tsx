import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery, categoryPath, plantImage, type Tag } from "@/lib/catalog";
import { Loading, Shell, TagChip } from "@/components/catalog-ui";

export const Route = createFileRoute("/planta/$slug")({
  head: () => ({
    meta: [
      { title: "Perfil de especie — Herbario" },
      { name: "description", content: "Ficha botánica con imagen, categorías y etiquetas." },
      { property: "og:title", content: "Perfil de especie — Herbario" },
      { property: "og:description", content: "Ficha botánica con imagen, categorías y etiquetas." },
    ],
  }),
  component: PlantPage,
});

function PlantPage() {
  const { slug } = Route.useParams();
  const { data } = useQuery(catalogQuery);
  if (!data) return <Shell><Loading /></Shell>;
  const plant = data.plants.find((p) => p.slug === slug);
  if (!plant) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <p className="font-display text-2xl">Especie no encontrada</p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary">Volver al catálogo</Link>
        </div>
      </Shell>
    );
  }
  const cats = data.categories.filter((c) => plant.categoryIds.includes(c.id));
  // Show only leaf-most memberships as full paths
  const leaves = cats.filter((c) => !cats.some((o) => o.parent_id === c.id));
  const tags = plant.tagIds.map((id) => data.tags.find((t) => t.id === id)).filter(Boolean) as Tag[];
  const img = plantImage(plant.image_key);

  return (
    <Shell>
      <section className="py-5 text-[13px] text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-primary">Plantas</Link>
        <span className="mx-1.5 opacity-50">/</span>
        <span className="font-medium text-foreground">{plant.name}</span>
      </section>
      <section className="overflow-hidden rounded-[28px] bg-secondary/60 p-5 ring-1 ring-border backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          <div className="aspect-square overflow-hidden rounded-2xl bg-background">
            {img && <img src={img} alt={plant.name} width={896} height={752} className="size-full object-cover" />}
          </div>
          <div className="py-1">
            <p className="eyebrow text-accent">Perfil de especie</p>
            <h1 className="mt-1 font-display text-4xl font-medium leading-tight text-balance">{plant.name}</h1>
            <p className="mt-1 font-display text-base italic text-muted-foreground">
              {plant.scientific_name}{plant.family ? ` · ${plant.family}` : ""}
            </p>
            <p className="mt-4 max-w-[56ch] text-base text-pretty text-foreground/75">{plant.description}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Categorías</p>
                <ul className="space-y-1.5 text-sm">
                  {leaves.map((c) => {
                    const path = categoryPath(c, data.categories);
                    return (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
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
