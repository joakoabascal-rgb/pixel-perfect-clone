import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { imageSrc, filterItems, type Catalog, type Category, type Item, type Tag } from "@/lib/catalog";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-secondary border-b-2 border-primary/40 ">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-none bg-primary/15 ring-1 ring-primary/20">
              <span className="size-2.5 rounded-none bg-primary" />
            </span>
            <span className="font-display text-lg font-medium tracking-tight">All Wiki</span>
          </Link>
          <nav className="ml-auto flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
              Catálogo
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <p className="max-w-[56ch] text-pretty">All Wiki — catálogo universal con navegación por carpetas, etiquetas y fichas.</p>
      </footer>
    </div>
  );
}

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.history.back()}
      className="glass inline-flex min-h-10 items-center gap-1.5 rounded-none px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Volver
    </button>
  );
}

export function Breadcrumb({ path, current, back = true }: { path: Category[]; current?: string; back?: boolean }) {
  return (
    <section className="flex flex-wrap items-center gap-3 py-5">
      {back && (path.length > 0 || current) && <BackButton />}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-primary">Inicio</Link>
        {path.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className="opacity-50">/</span>
            {i === path.length - 1 && !current ? (
              <span className="font-medium text-foreground">{c.name}</span>
            ) : (
              <Link to="/categoria/$slug" params={{ slug: c.slug }} className="transition-colors hover:text-primary">{c.name}</Link>
            )}
          </span>
        ))}
        {current && (
          <span className="flex items-center gap-1.5">
            <span className="opacity-50">/</span>
            <span className="font-medium text-foreground">{current}</span>
          </span>
        )}
      </div>
    </section>
  );
}

export function TagChip({ tag, primary }: { tag: Tag; primary?: boolean }) {
  return (
    <Link
      to="/"
      search={{ tags: [tag.slug] }}
      className={
        primary
          ? "rounded-none bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
          : "rounded-none bg-background px-2.5 py-1 text-[11px] text-muted-foreground ring-2 ring-border hover:text-foreground"
      }
    >
      #{tag.name.toLowerCase()}
    </Link>
  );
}

export function ItemCard({ item, catalog, from }: { item: Item; catalog: Catalog; from?: string | undefined }) {
  const type = catalog.types.find((t) => t.id === item.type_id);
  const src = imageSrc(item.image_key);
  return (
    <Link
      to="/item/$slug"
      params={{ slug: item.slug }}
      search={from ? { desde: from } : {}}
      className="glass block overflow-hidden rounded-none transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {src ? (
          <img src={src} alt={item.name} loading="lazy" width={896} height={752} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center font-display text-4xl text-sage">{item.name[0]}</div>
        )}
        {type && (
          <span className="absolute left-3 top-3 rounded-none bg-secondary/90 px-2.5 py-1 text-[11px] font-medium text-foreground ">
            {type.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <h2 className="font-display text-lg font-medium text-balance">{item.name}</h2>
        {item.subtitle && <p className="mt-1 text-sm italic text-muted-foreground">{item.subtitle}</p>}
      </div>
    </Link>
  );
}

function CategoryCard({ cat, count }: { cat: Category; count: number }) {
  return (
    <Link
      to="/categoria/$slug"
      params={{ slug: cat.slug }}
      className="glass flex min-h-20 flex-col justify-between rounded-none p-4 transition-transform hover:-translate-y-0.5"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="grid size-8 place-items-center rounded-none bg-primary/12 text-primary">◆</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </span>
      <span className="mt-3 font-display text-base font-medium">{cat.name}</span>
    </Link>
  );
}

type Folder = { cat: Category; count: number };

export function Browser({ title, description, folders, folderLabel, items, catalog, q, tags, onSearch, from }: {
  title: string; description?: string | null | undefined; folders: Folder[]; folderLabel: string; items: Item[]; catalog: Catalog;
  q: string; tags: string[]; onSearch: (next: { q?: string; tags?: string[] }) => void; from?: string | undefined;
}) {
  const usedTagIds = new Set(items.flatMap((p) => p.tagIds));
  const availTags = catalog.tags.filter((t) => usedTagIds.has(t.id) || tags.includes(t.slug));
  const shown = filterItems(items, q, tags, catalog);
  const toggle = (slug: string) => onSearch({ tags: tags.includes(slug) ? tags.filter((x) => x !== slug) : [...tags, slug] });

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide leading-tight text-balance">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="glass flex items-center gap-2 rounded-none px-4">
        <span className="text-muted-foreground">⌕</span>
        <input
          value={q}
          onChange={(e) => onSearch({ q: e.target.value })}
          placeholder="Buscar por nombre, etiqueta o categoría…"
          className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
      </div>

      {folders.length > 0 && (
        <section>
          <p className="eyebrow mb-3">{folderLabel}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map((f) => <CategoryCard key={f.cat.id} {...f} />)}
          </div>
        </section>
      )}

      {availTags.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Etiquetas</p>
            {tags.length > 0 && (
              <button onClick={() => onSearch({ tags: [] })} className="text-xs text-primary">Limpiar filtros</button>
            )}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {availTags.map((t) => (
              <button
                key={t.id}
                onClick={() => toggle(t.slug)}
                className={
                  tags.includes(t.slug)
                    ? "min-h-9 shrink-0 rounded-none bg-primary px-3.5 text-xs font-medium text-primary-foreground ring-1 ring-primary"
                    : "min-h-9 shrink-0 rounded-none bg-background px-3.5 text-xs text-muted-foreground ring-2 ring-border transition-colors hover:text-foreground"
                }
              >
                #{t.name.toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <p className="eyebrow">Entradas</p>
          <span className="text-sm text-muted-foreground">{shown.length} {shown.length === 1 ? "resultado" : "resultados"}</span>
        </div>
        {shown.length === 0 ? (
          <p className="glass rounded-none p-8 text-sm text-muted-foreground">No hay entradas que coincidan con la búsqueda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {shown.map((p) => <ItemCard key={p.id} item={p} catalog={catalog} from={from} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export function Loading() {
  return <p className="py-20 text-center text-sm text-muted-foreground">Cargando catálogo…</p>;
}
