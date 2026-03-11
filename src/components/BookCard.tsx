"use client";

import type { Book, Location } from "@/lib/types";

const statusLabel: Record<string, string> = {
  want: "Want to read",
  reading: "Reading",
  read: "Read",
};

const statusColor: Record<string, string> = {
  want: "bg-yellow-100 text-yellow-800",
  reading: "bg-blue-100 text-blue-800",
  read: "bg-green-100 text-green-800",
};

interface Props {
  book: Book;
  location?: Location;
  onClick: () => void;
}

export default function BookCard({ book, location, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm hover:shadow-md transition-shadow w-full"
    >
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt=""
          className="h-24 w-16 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
          No cover
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {book.title}
        </p>
        <p className="truncate text-xs text-gray-500">{book.author}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[book.status]}`}
          >
            {statusLabel[book.status]}
          </span>
          {book.rating && (
            <span className="text-xs text-yellow-500">
              {"★".repeat(book.rating)}
              {"☆".repeat(5 - book.rating)}
            </span>
          )}
        </div>
        {location && (
          <p className="truncate text-xs text-gray-400">
            @ {location.name}
          </p>
        )}
      </div>
    </button>
  );
}
