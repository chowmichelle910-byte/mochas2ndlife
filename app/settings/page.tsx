import Link from "next/link";
import PushReminderToggle from "@/components/PushReminderToggle";

export default function SettingsPage() {
  return (
    <main className="flex flex-col gap-4">
      <div className="relative flex items-center justify-center py-1">
        <Link
          href="/"
          aria-label="返回"
          className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-600 hover:bg-white/60"
        >
          ←
        </Link>
        <h1 className="text-lg font-semibold text-stone-700">設定</h1>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-sm font-medium text-stone-500">通知</h2>
        <PushReminderToggle />
      </div>
    </main>
  );
}
