"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "Books" },
    { href: "/locations", label: "Locations" },
    { href: "/projects", label: "Projects" },
  ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-gray-800">
          Bookshelf
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
