"use client";

import { useState } from "react";
import type { GoogleBookResult } from "@/lib/types";

interface Props {
  onSelect: (book: {
    title: string;
    author: string;
    isbn: string | null;
    cover_url: string | null;
  }) => void;
  onCancel: () => void;
}

export default function BookSearch({ onSelect, onCancel }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`
      );
      const data = await res.json();
      setResults(data.items || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  };

  const pickBook = (item: GoogleBookResult) => {
    const isbn =
      item.volumeInfo.industryIdentifiers?.find(
        (id) => id.type === "ISBN_13"
      )?.identifier ||
      item.volumeInfo.industryIdentifiers?.find(
        (id) => id.type === "ISBN_10"
      )?.identifier ||
      null;
    onSelect({
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors?.join(", ") || "",
      isbn,
      cover_url: item.volumeInfo.imageLinks?.thumbnail || null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by title, author, or ISBN..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={search}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "..." : "Search"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => pickBook(item)}
              className="flex w-full items-center gap-3 rounded-md border border-gray-200 p-2 text-left hover:bg-gray-50"
            >
              {item.volumeInfo.imageLinks?.thumbnail ? (
                <img
                  src={item.volumeInfo.imageLinks.thumbnail}
                  alt=""
                  className="h-16 w-11 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-11 items-center justify-center rounded bg-gray-200 text-xs text-gray-400">
                  No img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {item.volumeInfo.title}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {item.volumeInfo.authors?.join(", ") || "Unknown author"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
