import { createFileRoute } from "@tanstack/react-router";
import { FoodForm } from "@/components/snack/FoodForm";
import { Loading, PageHeader } from "@/components/snack/ui-bits";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/food/$id_/edit")({
  head: () => ({
    meta: [
      { title: "编辑食物 · Snack Home" },
      { name: "description", content: "修改食物的基本信息、配料、过敏原和营养成分。" },
      { property: "og:title", content: "编辑食物 · Snack Home" },
      { property: "og:description", content: "修改食物信息。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditFood,
});

function EditFood() {
  const { id } = Route.useParams();
  const { state, ready } = useStore();
  const product = state.products.find((p) => p.id === id);
  return (
    <div>
      <PageHeader title="编辑食物" back />
      {!ready ? <Loading /> : product ? <FoodForm key={id} product={product} /> : <p className="py-10 text-center">找不到该食物</p>}
    </div>
  );
}
