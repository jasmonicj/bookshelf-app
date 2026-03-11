"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Location, Book } from "@/lib/types";
import Header from "@/components/Header";

export default function LocationsPage() {
  const supabase = createClient();
  const [locations, setLocations] = useState<Location[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = async () => {
    const [locsRes, booksRes] = await Promise.all([
      supabase.from("locations").select("*").order("name"),
      supabase.from("books").select("*"),
    ]);
    setLocations(locsRes.data || []);
    setBooks(booksRes.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const addLocation = async () => {
    if (!name.trim()) return;
    await supabase.from("locations").insert({ name: name.trim(), description: description.trim() || null });
    setName("");
    setDescription("");
    load();
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditDesc(loc.description || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await supabase.from("locations").update({ name: editName.trim(), description: editDesc.trim() || null }).eq("id", editingId);
    setEditingId(null);
    load();
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("Delete this location? Books at this location will have their location cleared.")) return;
    await supabase.from("locations").delete().eq("id", id);
    load();
  };

  const booksAtLocation = (locId: string) => books.filter((b) => b.location_id === locId);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Locations</h1>
        <p className="mb-4 text-sm text-gray-500">
          Manage the places where you keep your books.
        </p>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-gray-700">Add Location</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g. Tokyo apartment)"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={addLocation}
              disabled={!name.trim()}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {locations.map((loc) => (
            <div key={loc.id} className="rounded-lg border border-gray-200 bg-white p-4">
              {editingId === loc.id ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button onClick={saveEdit} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{loc.name}</p>
                    {loc.description && (
                      <p className="text-xs text-gray-500">{loc.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {booksAtLocation(loc.id).length} books here
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(loc)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteLocation(loc.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {locations.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              No locations yet. Add your first location above.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
