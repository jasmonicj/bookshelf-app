"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Book, BookStatus, Location } from "@/lib/types";
import Header from "@/components/Header";
import BookCard from "@/components/BookCard";
import BookModal from "@/components/BookModal";

const tabs: { key: BookStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "want", label: "Want to read" },
  { key: "reading", label: "Reading" },
  { key: "read", label: "Read" },
];

export default function BooksPage() {
  const supabase = createClient();
  const [books, setBooks] = useState<Book[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filter, setFilter] = useState<BookStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalBook, setModalBook] = useState<Book | null | undefined>(undefined);

  const load = async () => {
    const [booksRes, locsRes] = await Promise.all([
      supabase.from("books").select("*").order("updated_at", { ascending: false }),
      supabase.from("locations").select("*").order("name"),
    ]);
    setBooks(booksRes.data || []);
    setLocations(locsRes.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = books.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (locationFilter !== "all" && b.location_id !== locationFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const locationMap = Object.fromEntries(locations.map((l) => [l.id, l]));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">My Books</h1>
          <button
            onClick={() => setModalBook(null)}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Book
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <p className="mb-3 text-xs text-gray-500">{filtered.length} books</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              location={book.location_id ? locationMap[book.location_id] : undefined}
              onClick={() => setModalBook(book)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-sm text-gray-400">
            No books yet. Click &quot;+ Add Book&quot; to get started.
          </p>
        )}
      </main>

      {modalBook !== undefined && (
        <BookModal
          book={modalBook}
          locations={locations}
          onClose={() => setModalBook(undefined)}
          onSaved={() => {
            setModalBook(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}
