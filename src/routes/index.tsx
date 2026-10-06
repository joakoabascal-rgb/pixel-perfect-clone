import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery, plantsIn } from "@/lib/catalog";
import { Breadcrumb, Browser, Loading, Shell } from "@/components/catalog-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Herbario — Catálogo de plantas" },
      { name: "description", content: "Enciclopedia curada de plantas: navega por categorías, busca y filtra por etiquetas." },
      { property: "og:title", content: "Herbario — Catálogo de plantas" },
      { property: "og:description", content: "Enciclopedia curada de plantas: navega por categorías, busca y filtra por etiquetas." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useQuery(catalogQuery);
  return (
    <Shell>
      <Breadcrumb path={[]} />
      {!data ? (
        <Loading />
      ) : (
        <Browser
          title="Todas las plantas"
          folderLabel="Categorías"
          folders={data.categories.filter((c) => !c.parent_id).map((cat) => ({ cat, count: plantsIn(cat.id, data).length }))}
          plants={data.plants}
          catalog={data}
        />
      )}
    </Shell>
  );
}
