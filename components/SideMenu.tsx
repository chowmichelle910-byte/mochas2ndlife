"use client";

import Link from "next/link";

const MENU_ITEMS = [{ href: "/settings", label: "設定", emoji: "⚙️" }];

export default function SideMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <nav
        className={`absolute left-0 top-0 h-full w-1/3 min-w-[180px] max-w-xs bg-white shadow-lg transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4">
          <span className="text-sm font-semibold text-stone-700">選單</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉選單"
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>
        <ul className="flex flex-col py-2">
          {MENU_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-orange-50"
              >
                <span className="text-lg">{item.emoji}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
