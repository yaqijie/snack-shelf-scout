import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loading, PageHeader } from "@/components/snack/ui-bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "设置 · Snack Home" },
      { name: "description", content: "设置过敏原、每日热量目标和提醒偏好，管理本地数据。" },
      { property: "og:title", content: "设置 · Snack Home" },
      { property: "og:description", content: "饮食偏好与提醒设置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const COMMON = ["花生", "坚果", "乳", "蛋", "小麦", "大豆", "鱼", "虾", "芝麻"];

function SettingsPage() {
  const { state, ready } = useStore();
  const [input, setInput] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  if (!ready) return <Loading />;
  const s = state.settings;
  const addAllergy = (a: string) => {
    const v = a.trim().slice(0, 20);
    if (!v || s.allergies.includes(v)) return;
    actions.updateSettings({ allergies: [...s.allergies, v] });
  };
  const toggleDay = (n: number) =>
    actions.updateSettings({ remindDays: s.remindDays.includes(n) ? s.remindDays.filter((x) => x !== n) : [...s.remindDays, n].sort() });

  return (
    <div className="space-y-4">
      <PageHeader title="设置" />
      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">我的过敏原 / 忌口</h2>
        <div className="flex flex-wrap gap-1.5">
          {s.allergies.map((a) => (
            <span key={a} className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-sm text-destructive">
              {a}<button aria-label={`移除${a}`} onClick={() => actions.updateSettings({ allergies: s.allergies.filter((x) => x !== a) })}><X className="h-3 w-3" /></button>
            </span>
          ))}
          {s.allergies.length === 0 && <span className="text-sm text-muted-foreground">尚未添加</span>}
        </div>
        <div className="flex gap-2">
          <input className="field" placeholder="输入过敏原，如：花生" value={input} maxLength={20} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { addAllergy(input); setInput(""); } }} />
          <Button onClick={() => { addAllergy(input); setInput(""); }}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON.filter((c) => !s.allergies.includes(c)).map((c) => (
            <button key={c} className="rounded-full border px-2.5 py-1 text-xs" onClick={() => addAllergy(c)}>+ {c}</button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">匹配基于你录入的配料和过敏原文字，可能不完整。信息缺失时会提示“无法判断”，不会显示“安全”。</p>
      </section>

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">每日热量目标</h2>
        <div className="flex items-center gap-2">
          <input className="field w-32" type="number" min="0" max="10000" value={s.dailyCalorieGoal ?? ""}
            onChange={(e) => { const n = parseInt(e.target.value); actions.updateSettings({ dailyCalorieGoal: n > 0 && n <= 10000 ? n : undefined }); }} />
          <span className="text-sm">kcal</span>
        </div>
      </section>

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">提醒偏好</h2>
        <label className="flex items-center justify-between text-sm">打开应用时显示临期提醒<Switch checked={s.inAppReminders} onCheckedChange={(v) => actions.updateSettings({ inAppReminders: v })} /></label>
        <div className="flex gap-2 text-sm">
          提前提醒：
          {[1, 3, 7].map((n) => (
            <button key={n} onClick={() => toggleDay(n)} className={s.remindDays.includes(n) ? "rounded-full bg-primary px-3 py-0.5 text-primary-foreground" : "rounded-full border px-3 py-0.5"}>{n}天</button>
          ))}
        </div>
        <label className="flex items-center justify-between text-sm text-muted-foreground">手机推送通知（尚未接入）<Switch disabled checked={false} /></label>
      </section>

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">数据备份与恢复</h2>
        <p className="text-sm text-muted-foreground">把当前食品、库存、购物清单和设置保存成备份文件。建议定期备份；文件会保存在你的设备上。</p>
        <Button className="w-full" onClick={() => {
          const backup = { app: "Snack Home", version: 1, exportedAt: new Date().toISOString(), data: state };
          const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `snack-home-backup-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          toast.success("备份文件已开始下载");
        }}>导出备份文件</Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              const parsed = JSON.parse(await file.text());
              const data = parsed?.app === "Snack Home" ? parsed.data : parsed;
              const valid = data && data.version === 1 &&
                Array.isArray(data.products) && Array.isArray(data.batches) &&
                Array.isArray(data.cart) && data.settings &&
                Array.isArray(data.settings.allergies) && Array.isArray(data.settings.remindDays) &&
                typeof data.settings.inAppReminders === "boolean";
              if (!valid) {
                toast.error("这个文件不是有效的 Snack Home 备份文件");
                return;
              }
              if (!confirm("导入备份会覆盖当前浏览器中的食品、库存、购物清单和设置。建议先导出当前数据备份。确定继续吗？")) return;
              actions.replaceState(data);
              toast.success("数据恢复成功");
            } catch {
              toast.error("读取失败，请选择有效的 JSON 备份文件");
            }
          }}
        />
        <Button variant="outline" className="w-full" onClick={() => fileInput.current?.click()}>从备份文件恢复</Button>
        <p className="text-xs text-muted-foreground">恢复会覆盖当前数据。备份文件可以用于在另一台设备上恢复记录；目前云端同步尚未启用。</p>
        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <Button variant="outline" onClick={() => { actions.clearDemo(); toast.success("已清除演示数据"); }}>清除演示数据</Button>
          <Button variant="outline" onClick={() => { if (confirm("恢复为演示数据？你录入的数据将被覆盖。")) actions.resetToDemo(); }}>恢复演示数据</Button>
        </div>
      </section>
    </div>
  );
}
