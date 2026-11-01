'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Film,
  Clock,
  Layers,
  Key,
  ArrowRight,
  AlertCircle,
  Smartphone,
  Monitor,
  Square,
  Wand2,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    inputText: '',
    targetDurationSeconds: 30,
    aspectRatio: '9:16',
    style: 'cinematic',
    language: 'en',
    connectionId: '',
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const res = await api.getConnections();
    if (res.data && res.data.length > 0) {
      setConnections(res.data);
      setForm((f) => ({ ...f, connectionId: res.data[0].id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.inputText) {
      setError('Please provide a title and concept description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await api.createProject({
      title: form.title,
      inputText: form.inputText,
      settings: {
        targetDurationSeconds: form.targetDurationSeconds,
        aspectRatio: form.aspectRatio,
        style: form.style,
        language: form.language,
      },
      providerSelection: form.connectionId
        ? {
            mode: 'manual',
            connectionId: form.connectionId,
          }
        : undefined,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data?._id) {
      // Auto-generate initial script breakdown
      await api.generateScript(res.data._id);
      router.push(`/projects/${res.data._id}`);
    }
  };

  const presets = [
    {
      title: 'Deep Sea Bioluminescence',
      text: 'A glowing bioluminescent deep sea creature swims past a futuristic underwater research submarine uncovering hydrothermal vents.',
    },
    {
      title: 'Neon Cyberpunk Metropolis',
      text: 'Flying hover-cars soaring between holographic neon skyscrapers in a rain-soaked futuristic cyberpunk Tokyo night.',
    },
    {
      title: 'Ancient Martian Ruins',
      text: 'Astronauts exploring an ancient colossal pyramid structure half-buried under red sand dunes on Mars at twilight.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-brand-400" />
          Create Video Project
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Provide your concept, select your target video duration, and pick your BYOK AI provider engine.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {connections.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>You haven't connected an AI provider API key yet.</span>
          </div>
          <Link
            href="/providers"
            className="font-bold underline hover:text-white text-xs"
          >
            Connect BYOK Key →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Title */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-200">Video Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Exploring The Mariana Trench"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Concept / Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">
                Video Concept & Prompt
              </label>
              <span className="text-xs text-slate-400">Describe the story or scene</span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Describe the scenes, subjects, and camera motion in detail..."
              value={form.inputText}
              onChange={(e) => setForm({ ...form, inputText: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          {/* Preset Inspiration */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-slate-400">Or pick an inspiration preset:</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setForm({ ...form, title: p.title, inputText: p.text })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 border border-white/10 text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                >
                  <Wand2 className="w-3 h-3 text-brand-400" />
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Settings */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>Format & Duration</span>
          </h3>

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Target Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { sec: 30, label: '30s (Short/Reel)', scenes: '6 scenes' },
                { sec: 60, label: '60s (Standard)', scenes: '12 scenes' },
                { sec: 90, label: '90s (Extended)', scenes: '18 scenes' },
                { sec: 120, label: '120s (Epic)', scenes: '24 scenes' },
              ].map((d) => (
                <button
                  key={d.sec}
                  type="button"
                  onClick={() => setForm({ ...form, targetDurationSeconds: d.sec })}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    form.targetDurationSeconds === d.sec
                      ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow-brand'
                      : 'bg-surface-950 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-sm">{d.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{d.scenes}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { ratio: '9:16', label: '9:16 Portrait', icon: Smartphone, desc: 'TikTok, Reels, Shorts' },
                { ratio: '16:9', label: '16:9 Landscape', icon: Monitor, desc: 'YouTube, Web' },
                { ratio: '1:1', label: '1:1 Square', icon: Square, desc: 'Instagram Feed' },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.ratio}
                    type="button"
                    onClick={() => setForm({ ...form, aspectRatio: r.ratio })}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      form.aspectRatio === r.ratio
                        ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow-brand'
                        : 'bg-surface-950 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2 text-brand-400" />
                    <div className="font-bold text-sm">{r.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Visual Rendering Style
            </label>
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="cinematic">Cinematic (Anamorphic lens, rich shadows, dramatic lighting)</option>
              <option value="photorealistic">Photorealistic (Natural daylight, documentary feel)</option>
              <option value="anime">Anime (Vibrant cel-shaded Japanese animation)</option>
              <option value="3d-render">3D Render (Pixar / Unreal Engine 5 aesthetic)</option>
              <option value="cyberpunk">Cyberpunk (Neon haze, high contrast glow)</option>
            </select>
          </div>
        </div>

        {/* Provider Selection (BYOK) */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            <span>AI Provider Selection (BYOK)</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select Connected Key
            </label>
            <select
              value={form.connectionId}
              onChange={(e) => setForm({ ...form, connectionId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            >
              {connections.length > 0 ? (
                connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.providerId}) — {c.maskedKey}
                  </option>
                ))
              ) : (
                <option value="">No keys connected — will prompt before generation</option>
              )}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-brand-600 via-brand-500 to-accent-cyan hover:opacity-95 text-white shadow-glow-brand transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          <span>{submitting ? 'Generating Scene Plan...' : 'Create Project & Generate Scenes'}</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </form>
    </div>
  );
}
