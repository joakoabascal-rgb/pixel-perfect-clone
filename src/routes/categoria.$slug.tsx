import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery, categoryPath, plantsIn } from "@/lib/catalog";
import { Breadcrumb, Browser, Loading, Shell } from "@/components/catalog-ui";

export const Route = createFileRoute("/categoria/$slug")({
  head: () => ({
    meta: [
      { title: "Categoría — Herbario" },
      { name: "description", content: "Explora las especies de esta carpeta del herbario." },
      { property: "og:title", content: "Categoría — Herbario" },
      { property: "og:description", content: "Explora las especies de esta carpeta del herbario." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useQuery(catalogQuery);
  if (!data) return <Shell><Loading /></Shell>;
  const cat = data.categories.find((c) => c.slug === slug);
  if (!cat) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <p className="font-display text-2xl">Carpeta no encontrada</p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary">Volver al catálogo</Link>
        </div>
      </Shell>
    );
  }
  const children = data.categories.filter((c) => c.parent_id === cat.id);
  const siblings = data.categories.filter((c) => c.parent_id === cat.parent_id);
  const showChildren = children.length > 0;
  const folders = (showChildren ? children : siblings).map((c) => ({ cat: c, count: plantsIn(c.id, data).length }));
  return (
    <Shell>
      <Breadcrumb path={categoryPath(cat, data.categories)} />
      <Browser
        key={cat.id}
        title={cat.name}
        folderLabel={showChildren ? "Subcategorías" : "En esta carpeta"}
        folders={folders}
        activeFolderId={showChildren ? undefined : cat.id}
        plants={plantsIn(cat.id, data)}
        catalog={data}
      />
    </Shell>
  );
}
