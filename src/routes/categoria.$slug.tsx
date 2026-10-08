import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";
import { catalogQuery, categoryPath, itemsIn } from "@/lib/catalog";
import { browseSearch } from "@/lib/search";
import { Breadcrumb, Browser, Loading, Shell } from "@/components/catalog-ui";

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: zodValidator(browseSearch),
  head: () => ({
    meta: [
      { title: "Categoría — All Wiki" },
      { name: "description", content: "Explora las entradas de esta carpeta del catálogo." },
      { property: "og:title", content: "Categoría — All Wiki" },
      { property: "og:description", content: "Explora las entradas de esta carpeta del catálogo." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { q, tags } = Route.useSearch();
  const navigate = Route.useNavigate();
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
  return (
    <Shell>
      <Breadcrumb path={categoryPath(cat, data.categories)} />
      <Browser
        key={cat.id}
        title={cat.name}
        description={cat.description}
        folderLabel="Subcategorías"
        folders={children.map((c) => ({ cat: c, count: itemsIn(c.id, data).length }))}
        items={itemsIn(cat.id, data)}
        catalog={data}
        q={q}
        tags={tags}
        from={cat.slug}
        onSearch={(next) => navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })}
      />
    </Shell>
  );
}
