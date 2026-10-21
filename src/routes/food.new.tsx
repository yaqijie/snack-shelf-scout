import { createFileRoute } from "@tanstack/react-router";
import { FoodForm } from "@/components/snack/FoodForm";
import { Loading, PageHeader } from "@/components/snack/ui-bits";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/food/new")({
  head: () => ({
    meta: [
      { title: "添加食物 · Snack Home" },
      { name: "description", content: "手动录入食物信息、批次、营养成分与过敏原。" },
      { property: "og:title", content: "添加食物 · Snack Home" },
      { property: "og:description", content: "手动录入食物与批次信息。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewFood,
});

function NewFood() {
  const { ready } = useStore();
  return (
    <div>
      <PageHeader title="添加食物" back />
      {ready ? <FoodForm /> : <Loading />}
    </div>
  );
}
