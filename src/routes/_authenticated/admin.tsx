import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/catalog-ui";
import { catalogQuery, categoryPath, descendantIds, imageSrc, type Attribute, type Catalog, type Category, type Item } from "@/lib/catalog";
import { checkIsAdmin, slugify } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await checkIsAdmin())) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Edición privada — All Wiki" },
      { name: "description", content: "Herramientas privadas de edición del catálogo." },
      { property: "og:title", content: "Edición privada — All Wiki" },
      { property: "og:description", content: "Herramientas privadas de edición del catálogo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input = "w-full border border-border bg-background px-3 py-2 text-sm";
const btn = "border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50";
const btnPrimary = "bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
const btnDanger = "border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50";

const catLabel = (c: Category, all: Category[]) => categoryPath(c, all).map((x) => x.name).join(" / ");

function AdminPage() {
  const { data } = useQuery(catalogQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"items" | "folders">("items");
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: catalogQuery.queryKey });

  async function signOut() {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-3 py-5">
        <h1 className="font-display text-2xl uppercase tracking-wide">Edición privada</h1>
        <div className="ml-auto flex gap-2">
          <button className={tab === "items" ? btnPrimary : btn} onClick={() => { setTab("items"); setEditing(null); }}>Entradas</button>
          <button className={tab === "folders" ? btnPrimary : btn} onClick={() => setTab("folders")}>Carpetas</button>
          <button className={btn} onClick={signOut}>Salir</button>
        </div>
      </div>
      {!data ? <p className="py-10 text-muted-foreground">Cargando…</p> : tab === "folders" ? (
        <Folders catalog={data} refresh={refresh} />
      ) : editing ? (
        <ItemEditor key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} catalog={data}
          onDone={async () => { await refresh(); setEditing(null); }} onCancel={() => setEditing(null)} />
      ) : (
        <ItemList catalog={data} refresh={refresh} onEdit={setEditing} />
      )}
    </Shell>
  );
}

function confirmDelete(what: string) {
  return window.confirm(`¿Eliminar ${what}? Esta acción no se puede deshacer.`);
}

function ItemList({ catalog, refresh, onEdit }: { catalog: Catalog; refresh: () => Promise<void>; onEdit: (i: Item | "new") => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const list = catalog.items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  async function remove(item: Item) {
    if (!confirmDelete(`la entrada "${item.name}"`)) return;
    setBusy(item.id);
    const { error, count } = await supabase.from("items").delete({ count: "exact" }).eq("id", item.id);
    setBusy(null);
    if (error || !count) return toast.error(`No se pudo eliminar: ${error?.message ?? "sin permiso"}`);
    await refresh();
    toast.success("Entrada eliminada");
  }

  return (
    <section className="pb-10">
      <div className="mb-4 flex gap-2">
        <input className={input} placeholder="Buscar entrada…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={btnPrimary} onClick={() => onEdit("new")}>+ Nueva entrada</button>
      </div>
      <ul className="flex flex-col gap-2">
        {list.map((i) => (
          <li key={i.id} className="glass flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{i.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {catalog.types.find((t) => t.id === i.type_id)?.name} · {i.categoryIds.map((id) => catalog.categories.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "sin carpeta"}
              </p>
            </div>
            <button className={btn} onClick={() => onEdit(i)}>Editar</button>
            <button className={btnDanger} disabled={busy === i.id} onClick={() => remove(i)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;
}

function ItemEditor({ item, catalog, onDone, onCancel }: { item: Item | null; catalog: Catalog; onDone: () => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!item);
  const [typeId, setTypeId] = useState(item?.type_id ?? catalog.types[0]?.id ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [imageKey, setImageKey] = useState(item?.image_key ?? "");
  const [attrs, setAttrs] = useState<Attribute[]>(item?.attributes ?? []);
  const [cats, setCats] = useState<string[]>(item?.categoryIds ?? []);
  const [tags, setTags] = useState<string[]>(item?.tagIds ?? []);
  const [gallery, setGallery] = useState(item?.gallery.map((g) => ({ image_key: g.image_key, caption: g.caption ?? "" })) ?? []);
  const [newTag, setNewTag] = useState("");
  const [extraTags, setExtraTags] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const allTags = [...catalog.tags, ...extraTags];

  async function addTag() {
    const n = newTag.trim();
    if (!n) return;
    const s = slugify(n);
    const existing = allTags.find((t) => ("slug" in t && t.slug === s) || t.name.toLowerCase() === n.toLowerCase());
    if (existing) { setTags((t) => (t.includes(existing.id) ? t : [...t, existing.id])); setNewTag(""); return; }
    const { data, error } = await supabase.from("tags").insert({ name: n, slug: s }).select("id,name").single();
    if (error || !data) return toast.error(`No se pudo crear la etiqueta: ${error?.message}`);
    setExtraTags((x) => [...x, data]);
    setTags((t) => [...t, data.id]);
    setNewTag("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const cleanSlug = slugify(slug);
    if (!name.trim() || !cleanSlug || !typeId) return setError("Nombre, slug y tipo son obligatorios.");
    if (!cats.length) return setError("Asigna al menos una carpeta para que la entrada sea visible.");
    if (catalog.items.some((i) => i.slug === cleanSlug && i.id !== item?.id)) return setError("Ya existe una entrada con ese slug.");
    setSaving(true); setError(null);
    const { error } = await supabase.rpc("admin_save_item", {
      _id: item?.id ?? (null as unknown as string),
      _item: {
        name: name.trim(), slug: cleanSlug, type_id: typeId, subtitle: subtitle.trim(), description: description.trim(),
        image_key: imageKey.trim(), attributes: attrs.filter((a) => a.label.trim() && a.value.trim()).map((a) => ({ label: a.label.trim(), value: a.value.trim() })),
      },
      _category_ids: cats, _tag_ids: tags,
      _images: gallery.filter((g) => g.image_key.trim()).map((g) => ({ image_key: g.image_key.trim(), caption: g.caption.trim() })),
    });
    if (error) { setSaving(false); setError(`No se guardó: ${error.message}`); return; }
    toast.success(item ? "Entrada actualizada" : "Entrada creada");
    await onDone();
  }

  const preview = imageSrc(imageKey.trim());
  return (
    <form onSubmit={save} className="glass mb-10 flex flex-col gap-4 p-5">
      <h2 className="font-display text-lg uppercase tracking-wide">{item ? `Editar: ${item.name}` : "Nueva entrada"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *"><input className={input} required value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></Field>
        <Field label="Slug (dirección) *"><input className={input} required value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} /></Field>
        <Field label="Tipo *">
          <select className={input} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {catalog.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Subtítulo"><input className={input} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
      </div>
      <Field label="Descripción"><textarea className={`${input} min-h-32`} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-muted-foreground">Atributos</legend>
        {attrs.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input className={input} placeholder="Etiqueta" value={a.label} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className={input} placeholder="Valor" value={a.value} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <button type="button" className={btn} onClick={() => setAttrs(attrs.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className={`${btn} self-start`} onClick={() => setAttrs([...attrs, { label: "", value: "" }])}>+ Atributo</button>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Carpetas * (puede estar en varias)</legend>
        <div className="flex flex-wrap gap-2">
          {catalog.categories.map((c) => (
            <label key={c.id} className={`flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-xs ${cats.includes(c.id) ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
              <input type="checkbox" checked={cats.includes(c.id)} onChange={() => setCats(toggle(cats, c.id))} />{catLabel(c, catalog.categories)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Etiquetas</legend>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <label key={t.id} className={`flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-xs ${tags.includes(t.id) ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
              <input type="checkbox" checked={tags.includes(t.id)} onChange={() => setTags(toggle(tags, t.id))} />#{t.name.toLowerCase()}
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input className={input} placeholder="Nueva etiqueta" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
          <button type="button" className={btn} onClick={addTag}>Añadir</button>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-muted-foreground">Imágenes (clave de imagen incluida o URL https)</legend>
        <div className="flex items-center gap-3">
          <input className={input} placeholder="Imagen principal" value={imageKey} onChange={(e) => setImageKey(e.target.value)} />
          {preview && <img src={preview} alt="" className="size-12 object-cover" />}
        </div>
        {gallery.map((g, i) => (
          <div key={i} className="flex gap-2">
            <input className={input} placeholder="Imagen de galería" value={g.image_key} onChange={(e) => setGallery(gallery.map((x, j) => (j === i ? { ...x, image_key: e.target.value } : x)))} />
            <input className={input} placeholder="Pie de foto" value={g.caption} onChange={(e) => setGallery(gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
            <button type="button" className={btn} onClick={() => setGallery(gallery.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className={`${btn} self-start`} onClick={() => setGallery([...gallery, { image_key: "", caption: "" }])}>+ Imagen de galería</button>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button className={btnPrimary} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
        <button type="button" className={btn} onClick={onCancel} disabled={saving}>Cancelar</button>
      </div>
    </form>
  );
}

function Folders({ catalog, refresh }: { catalog: Catalog; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState("");
  const all = catalog.categories;
  const sorted = [...all].sort((a, b) => catLabel(a, all).localeCompare(catLabel(b, all)));

  async function run(fn: () => PromiseLike<{ error: { message: string } | null; count?: number | null }>, ok: string) {
    if (busy) return false;
    setBusy(true);
    const { error, count } = await fn();
    if (error || count === 0) { setBusy(false); toast.error(`No se guardó: ${error?.message ?? "sin permiso"}`); return false; }
    await refresh();
    setBusy(false);
    toast.success(ok);
    return true;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const slug = slugify(name);
    if (!name || !slug) return toast.error("El nombre es obligatorio");
    if (all.some((c) => c.slug === slug)) return toast.error("Ya existe una carpeta con ese nombre");
    if (await run(() => supabase.from("categories").insert({ name, slug, parent_id: newParent || null }, { count: "exact" }), "Carpeta creada")) setNewName("");
  }

  function rename(c: Category) {
    const name = window.prompt("Nuevo nombre", c.name)?.trim();
    if (!name || name === c.name) return;
    run(() => supabase.from("categories").update({ name }, { count: "exact" }).eq("id", c.id), "Carpeta renombrada");
  }

  function move(c: Category, parent: string) {
    if (parent && descendantIds(c.id, all).includes(parent)) return toast.error("No puedes mover una carpeta dentro de sí misma");
    run(() => supabase.from("categories").update({ parent_id: parent || null }, { count: "exact" }).eq("id", c.id), "Carpeta movida");
  }

  function remove(c: Category) {
    if (all.some((x) => x.parent_id === c.id)) return toast.error("Primero mueve o elimina sus subcarpetas");
    const orphans = catalog.items.filter((i) => i.categoryIds.length === 1 && i.categoryIds[0] === c.id);
    if (orphans.length) return toast.error(`Quedarían sin carpeta: ${orphans.map((i) => i.name).join(", ")}. Asígnalas a otra carpeta primero.`);
    if (!confirmDelete(`la carpeta "${c.name}"`)) return;
    run(() => supabase.from("categories").delete({ count: "exact" }).eq("id", c.id), "Carpeta eliminada");
  }

  return (
    <section className="pb-10">
      <form onSubmit={create} className="glass mb-4 flex flex-wrap gap-2 p-3">
        <input className={`${input} flex-1`} placeholder="Nombre de la nueva carpeta" required value={newName} onChange={(e) => setNewName(e.target.value)} />
        <select className={`${input} w-auto`} value={newParent} onChange={(e) => setNewParent(e.target.value)}>
          <option value="">Carpeta principal</option>
          {sorted.map((c) => <option key={c.id} value={c.id}>Dentro de: {catLabel(c, all)}</option>)}
        </select>
        <button className={btnPrimary} disabled={busy}>+ Crear</button>
      </form>
      <ul className="flex flex-col gap-2">
        {sorted.map((c) => (
          <li key={c.id} className="glass flex flex-wrap items-center gap-2 p-3">
            <span className="min-w-0 flex-1 font-medium">{catLabel(c, all)}</span>
            <select className={`${input} w-auto`} disabled={busy} value={c.parent_id ?? ""} onChange={(e) => move(c, e.target.value)} aria-label="Mover a">
              <option value="">Carpeta principal</option>
              {sorted.filter((o) => !descendantIds(c.id, all).includes(o.id)).map((o) => <option key={o.id} value={o.id}>{catLabel(o, all)}</option>)}
            </select>
            <button className={btn} disabled={busy} onClick={() => rename(c)}>Renombrar</button>
            <button className={btnDanger} disabled={busy} onClick={() => remove(c)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
