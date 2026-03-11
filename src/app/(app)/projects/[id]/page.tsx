"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Project, ReferenceNote, Book } from "@/lib/types";
import Header from "@/components/Header";
import Link from "next/link";

export default function ProjectDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<ReferenceNote[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [content, setContent] = useState("");
  const [pageRef, setPageRef] = useState("");
  const [editingNote, setEditingNote] = useState<ReferenceNote | null>(null);

  const load = async () => {
    const [projRes, notesRes, booksRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("reference_notes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("books").select("*").order("title"),
    ]);
    setProject(projRes.data);
    setNotes(notesRes.data || []);
    setBooks(booksRes.data || []);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const addNote = async () => {
    if (!selectedBookId || !content.trim()) return;
    await supabase.from("reference_notes").insert({
      book_id: selectedBookId,
      project_id: projectId,
      content: content.trim(),
      page_ref: pageRef.trim() || null,
    });
    setContent("");
    setPageRef("");
    setSelectedBookId("");
    load();
  };

  const startEdit = (note: ReferenceNote) => {
    setEditingNote(note);
    setContent(note.content);
    setPageRef(note.page_ref || "");
  };

  const saveEdit = async () => {
    if (!editingNote) return;
    await supabase
      .from("reference_notes")
      .update({ content: content.trim(), page_ref: pageRef.trim() || null })
      .eq("id", editingNote.id);
    setEditingNote(null);
    setContent("");
    setPageRef("");
    load();
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    await supabase.from("reference_notes").delete().eq("id", id);
    load();
  };

  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]));

  // Group notes by book
  const notesByBook = notes.reduce<Record<string, ReferenceNote[]>>((acc, note) => {
    if (!acc[note.book_id]) acc[note.book_id] = [];
    acc[note.book_id].push(note);
    return acc;
  }, {});

  if (!project) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/projects" className="text-sm text-blue-600 hover:underline">
          &larr; Projects
        </Link>
        <h1 className="mt-2 mb-1 text-xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mb-4 text-sm text-gray-500">{project.description}</p>
        )}

        {/* Add note form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-gray-700">
            {editingNote ? "Edit Note" : "Add Reference Note"}
          </h2>
          {!editingNote && (
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a book...</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} - {b.author}
                </option>
              ))}
            </select>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Your note / quote / reference..."
            rows={3}
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              value={pageRef}
              onChange={(e) => setPageRef(e.target.value)}
              placeholder="Page ref (e.g. p.42, Ch.3)"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={editingNote ? saveEdit : addNote}
              disabled={!content.trim() || (!editingNote && !selectedBookId)}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editingNote ? "Update" : "Add"}
            </button>
            {editingNote && (
              <button
                onClick={() => {
                  setEditingNote(null);
                  setContent("");
                  setPageRef("");
                }}
                className="text-sm text-gray-500 hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Notes grouped by book */}
        {Object.entries(notesByBook).map(([bookId, bookNotes]) => {
          const book = bookMap[bookId];
          return (
            <div key={bookId} className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                {book?.cover_url && (
                  <img src={book.cover_url} alt="" className="h-10 w-7 rounded object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {book?.title || "Unknown book"}
                  </p>
                  <p className="text-xs text-gray-500">{book?.author}</p>
                </div>
              </div>
              <div className="space-y-2 pl-9">
                {bookNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md border border-gray-200 bg-white p-3"
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    {note.page_ref && (
                      <p className="mt-1 text-xs text-gray-400">{note.page_ref}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {notes.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            No reference notes yet. Select a book and add your first note.
          </p>
        )}
      </main>
    </div>
  );
}
