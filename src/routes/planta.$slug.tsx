import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/planta/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/item/$slug", params: { slug: params.slug }, search: { desde: "" } });
  },
});
