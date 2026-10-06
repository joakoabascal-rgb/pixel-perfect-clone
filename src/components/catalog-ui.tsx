import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { plantImage, filterPlants, type Catalog, type Category, type Plant, type Tag } from "@/lib/catalog";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-secondary/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/20">
              <span className="size-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-display text-lg font-medium tracking-tight">Herbario</span>
          </Link>
          <nav className="ml-auto flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
              Catálogo
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        <p className="max-w-[56ch] text-pretty">Herbario — catálogo curado de especies con navegación por carpetas, etiquetas y fichas de perfil.</p>
      </footer>
    </div>
  );
}

export function Breadcrumb({ path }: { path: Category[] }) {
  return (
    <section className="flex flex-wrap items-center gap-x-1.5 gap-y-1 py-5 text-[13px] text-muted-foreground">
      <Link to="/" className="transition-colors hover:text-primary">Plantas</Link>
      {path.map((c, i) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className="opacity-50">/</span>
          {i === path.length - 1 ? (
            <span className="font-medium text-foreground">{c.name}</span>
          ) : (
            <Link to="/categoria/$slug" params={{ slug: c.slug }} className="transition-colors hover:text-primary">{c.name}</Link>
          )}
        </span>
      ))}
    </section>
  );
}

export function TagChip({ tag, primary }: { tag: Tag; primary?: boolean }) {
  return primary ? (
    <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">{tag.name}</span>
  ) : (
    <span className="rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground ring-1 ring-border">{tag.name}</span>
  );
}

export function PlantCard({ plant, tags }: { plant: Plant; tags: Tag[] }) {
  const ptags = plant.tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as Tag[];
  return (
    <Link to="/planta/$slug" params={{ slug: plant.slug }} className="glass block overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5">
      <div className="aspect-[4/3] bg-muted">
        {plantImage(plant.image_key) && (
          <img src={plantImage(plant.image_key)} alt={plant.name} loading="lazy" width={896} height={752} className="size-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <h2 className="font-display text-lg font-medium text-balance">{plant.name}</h2>
        <p className="mt-1 text-sm italic text-muted-foreground">{plant.scientific_name}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ptags.slice(0, 3).map((t, i) => <TagChip key={t.id} tag={t} primary={i === 0} />)}
        </div>
      </div>
    </Link>
  );
}

type Folder = { cat: Category; count: number };

export function Browser({ title, folders, folderLabel, plants, catalog, activeFolderId }: {
  title: string; folders: Folder[]; folderLabel: string; plants: Plant[]; catalog: Catalog; activeFolderId?: string;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const usedTagIds = new Set(plants.flatMap((p) => p.tagIds));
  const tags = catalog.tags.filter((t) => usedTagIds.has(t.id));
  const shown = filterPlants(plants, q, sel, catalog.tags);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-7 lg:sticky lg:top-24 lg:self-start">
        <div className="glass rounded-2xl p-2 pl-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar especies…"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {folders.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="eyebrow mb-3">{folderLabel}</p>
            <ul className="space-y-0.5 text-sm">
              {folders.map(({ cat, count }) => (
                <li key={cat.id}>
                  <Link
                    to="/categoria/$slug"
                    params={{ slug: cat.slug }}
                    className={
                      cat.id === activeFolderId
                        ? "flex items-center justify-between rounded-lg bg-primary/15 px-2.5 py-2 font-medium text-primary ring-1 ring-primary/20"
                        : "flex items-center justify-between rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                    }
                  >
                    {cat.name} <span className="text-xs opacity-70">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tags.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="eyebrow mb-3">Filtrar por etiqueta</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={
                    sel.includes(t.id)
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground ring-1 ring-primary"
                      : "rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h1 className="font-display text-2xl font-medium leading-tight text-balance">{title}</h1>
          <span className="text-sm text-muted-foreground">{shown.length} {shown.length === 1 ? "especie" : "especies"}</span>
        </div>
        {shown.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-sm text-muted-foreground">No hay especies que coincidan con la búsqueda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => <PlantCard key={p.id} plant={p} tags={catalog.tags} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export function Loading() {
  return <p className="py-20 text-center text-sm text-muted-foreground">Cargando herbario…</p>;
}
