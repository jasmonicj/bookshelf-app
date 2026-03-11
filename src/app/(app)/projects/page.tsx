"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import Header from "@/components/Header";
import Link from "next/link";

export default function ProjectsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects(data || []);

    // Get note counts per project
    const { data: notes } = await supabase.from("reference_notes").select("project_id");
    const counts: Record<string, number> = {};
    (notes || []).forEach((n) => {
      counts[n.project_id] = (counts[n.project_id] || 0) + 1;
    });
    setNoteCounts(counts);
  };

  useEffect(() => {
    load();
  }, []);

  const addProject = async () => {
    if (!name.trim()) return;
    await supabase.from("projects").insert({ name: name.trim(), description: description.trim() || null });
    setName("");
    setDescription("");
    load();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("このプロジェクトと全ての参照メモを削除しますか？")) return;
    await supabase.from("projects").delete().eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">プロジェクト</h1>
        <p className="mb-4 text-sm text-gray-500">
          プロジェクト（論文など）を作成し、本から参照メモを集めます。
        </p>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-gray-700">新規プロジェクト</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明（任意）"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={addProject}
              disabled={!name.trim()}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              作成
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <Link href={`/projects/${proj.id}`} className="group flex-1">
                  <p className="font-medium text-gray-800 group-hover:text-blue-600">
                    {proj.name}
                  </p>
                  {proj.description && (
                    <p className="text-xs text-gray-500">{proj.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {noteCounts[proj.id] || 0} 件の参照メモ
                  </p>
                </Link>
                <button
                  onClick={() => deleteProject(proj.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              まだプロジェクトがありません。作成して参照メモを集めましょう。
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
