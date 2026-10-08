import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";
import { catalogQuery, itemsIn } from "@/lib/catalog";
import { browseSearch } from "@/lib/search";
import { Breadcrumb, Browser, Loading, Shell } from "@/components/catalog-ui";

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(browseSearch),
  head: () => ({
    meta: [
      { title: "All Wiki — Catálogo universal" },
      { name: "description", content: "Enciclopedia curada: plantas, animales, alimentos y más. Navega por carpetas, busca y filtra por etiquetas." },
      { property: "og:title", content: "All Wiki — Catálogo universal" },
      { property: "og:description", content: "Enciclopedia curada: plantas, animales, alimentos y más." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useQuery(catalogQuery);
  const { q, tags } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Shell>
      <Breadcrumb path={[]} back={false} />
      {!data ? (
        <Loading />
      ) : (
        <Browser
          title="Catálogo"
          description="Explora por carpetas, busca o combina etiquetas."
          folderLabel="Categorías"
          folders={data.categories.filter((c) => !c.parent_id).map((cat) => ({ cat, count: itemsIn(cat.id, data).length }))}
          items={data.items}
          catalog={data}
          q={q}
          tags={tags}
          onSearch={(next) => navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })}
        />
      )}
    </Shell>
  );
}
