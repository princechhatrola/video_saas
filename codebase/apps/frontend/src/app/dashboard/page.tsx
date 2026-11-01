'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Key,
  Film,
  PlayCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { api } from '../../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await api.getDashboardStats();
    if (res.data) {
      setStats(res.data);
    }
    setLoading(false);
  };

  const summary = stats?.summary || {
    totalProjects: 0,
    completedProjects: 0,
    generatingProjects: 0,
    totalScenesGenerated: 0,
    activeConnections: 0,
  };

  return (
    <div className="space-y-10">
      {/* Welcome & Quick CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Studio Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your multi-provider video productions and BYOK accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/providers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-surface-850 hover:bg-surface-800 text-slate-200 border border-white/10 text-sm transition-all"
          >
            <Key className="w-4 h-4 text-brand-400" />
            <span>Manage Keys</span>
          </Link>

          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-white text-sm shadow-glow-brand transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Video</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Projects */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Projects</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">
            {summary.totalProjects}
          </div>
          <div className="text-xs text-slate-400">
            {summary.completedProjects} completed productions
          </div>
        </div>

        {/* Active Generations */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Generating</span>
            <TrendingUp className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="text-3xl font-extrabold text-accent-cyan">
            {summary.generatingProjects}
          </div>
          <div className="text-xs text-slate-400">Live scene render queues</div>
        </div>

        {/* Total Scenes / Clips */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Moving Clips</span>
            <Film className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {summary.totalScenesGenerated}
          </div>
          <div className="text-xs text-slate-400">AI moving video clips stored</div>
        </div>

        {/* Connected Providers */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Connected Keys</span>
            <Key className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-brand-300">
            {summary.activeConnections}
          </div>
          <div className="text-xs text-slate-400">Active BYOK provider engines</div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-400" />
            <span>Recent Video Projects</span>
          </h2>
          <Link
            href="/projects"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="glass-panel rounded-xl p-10 text-center text-slate-400">
            <span>Loading recent projects...</span>
          </div>
        ) : !stats?.recentProjects || stats.recentProjects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center space-y-4 border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <Film className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">No Projects Created Yet</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Start by creating your first AI video project from an idea or prompt.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white text-sm shadow-glow-brand transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.recentProjects.map((proj: any) => (
              <Link
                key={proj._id}
                href={`/projects/${proj._id}`}
                className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-brand-500/40 group transition-all"
              >
                <div className="space-y-2">
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
                    <span className="text-xs text-slate-400">
                      {proj.settings?.targetDurationSeconds || 30}s
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                    {proj.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Ratio: {proj.settings?.aspectRatio || '9:16'}</span>
                    <span>•</span>
                    <span>{proj.totalScenes || 0} Scenes</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-brand-400 font-semibold">
                  <span>Open Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
