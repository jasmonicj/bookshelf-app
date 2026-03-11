"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import type { Book, BookStatus, Location } from "@/lib/types";
import BookSearch from "./BookSearch";

interface Props {
  book: Book | null;
  locations: Location[];
  onClose: () => void;
  onSaved: () => void;
}

export default function BookModal({ book, locations, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [searching, setSearching] = useState(!book);
  const [title, setTitle] = useState(book?.title || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [isbn, setIsbn] = useState(book?.isbn || "");
  const [coverUrl, setCoverUrl] = useState(book?.cover_url || "");
  const [status, setStatus] = useState<BookStatus>(book?.status || "want");
  const [rating, setRating] = useState(book?.rating || 0);
  const [review, setReview] = useState(book?.review || "");
  const [locationId, setLocationId] = useState(book?.location_id || "");
  const [saving, setSaving] = useState(false);

  const handleSearchSelect = (result: {
    title: string;
    author: string;
    isbn: string | null;
    cover_url: string | null;
  }) => {
    setTitle(result.title);
    setAuthor(result.author);
    setIsbn(result.isbn || "");
    setCoverUrl(result.cover_url || "");
    setSearching(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const data = {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn || null,
      cover_url: coverUrl || null,
      status,
      rating: rating || null,
      review: review || null,
      location_id: locationId || null,
    };

    if (book) {
      await supabase.from("books").update(data).eq("id", book.id);
    } else {
      await supabase.from("books").insert(data);
    }

    setSaving(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!book || !confirm("Delete this book?")) return;
    await supabase.from("books").delete().eq("id", book.id);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {book ? "Edit Book" : "Add Book"}
        </h2>

        {searching ? (
          <BookSearch
            onSelect={handleSearchSelect}
            onCancel={() => (book ? onClose() : setSearching(false))}
          />
        ) : (
          <>
            {!book && (
              <button
                onClick={() => setSearching(true)}
                className="mb-3 text-sm text-blue-600 hover:underline"
              >
                Search again
              </button>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Author
                </label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookStatus)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="want">Want to read</option>
                    <option value="reading">Reading</option>
                    <option value="read">Read</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Location
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Rating
                </label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? 0 : n)}
                      className={`text-xl ${n <= rating ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Review
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div>
                {book && (
                  <button
                    onClick={handleDelete}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "..." : "Save"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
