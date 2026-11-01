'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Plus, Trash2, ArrowRight, Film, Clock, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const res = await api.listProjects();
    if (res.data?.items) {
      setProjects(res.data.items);
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    await api.deleteProject(id);
    loadProjects();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-brand-400" />
            Video Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your AI video generations, scripts, and rendered MP4 files.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-white text-sm shadow-glow-brand transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Video</span>
        </Link>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="glass-panel rounded-xl p-12 text-center text-slate-400">
          <span>Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-dashed border-white/10">
          <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
            <Film className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">No Projects Yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Create your first project to turn a concept into actual moving video clips.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white text-sm shadow-glow-brand transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create First Project</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <Link
              key={proj._id}
              href={`/projects/${proj._id}`}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 group hover:border-brand-500/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      proj.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : proj.status === 'generating'
                        ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 animate-pulse'
                        : 'bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {proj.status}
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {proj.settings?.targetDurationSeconds || 30}s
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                  {proj.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {proj.inputText}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                  <span className="font-medium text-slate-300">
                    Ratio: {proj.settings?.aspectRatio || '9:16'}
                  </span>
                  <span>•</span>
                  <span>{proj.totalScenes || 0} Scenes</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </span>

                <button
                  onClick={(e) => handleDelete(e, proj._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
