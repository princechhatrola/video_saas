'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Film,
  Sparkles,
  Play,
  Download,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function ProjectStudioPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
    // Poll for status updates while generating
    const interval = setInterval(() => {
      if (project?.status === 'generating') {
        loadProject(false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [id, project?.status]);

  const loadProject = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await api.getProject(id);
    if (res.data) {
      setProject(res.data);
    }
    if (showLoading) setLoading(false);
  };

  const handleStartGeneration = async () => {
    setStarting(true);
    setError(null);
    const res = await api.startGeneration(id);
    setStarting(false);

    if (res.error) {
      setError(res.error);
    } else {
      loadProject(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-400" />
        <span>Loading Project Studio...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="glass-panel rounded-2xl p-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-brand-400 font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const scenes = project.scenes || project.script?.scenes || [];

  return (
    <div className="space-y-8">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {project.title}
            </h1>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                project.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : project.status === 'generating'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 animate-pulse'
                  : 'bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
            {project.inputText}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {project.status === 'completed' && project.finalVideoUrl ? (
            <a
              href={project.finalVideoUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-sm shadow-glow-brand transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4</span>
            </a>
          ) : (
            <button
              onClick={handleStartGeneration}
              disabled={starting || project.status === 'generating'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-white text-sm shadow-glow-brand transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {project.status === 'generating'
                  ? 'Generating Video...'
                  : starting
                  ? 'Queuing...'
                  : 'Start Video Generation'}
              </span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes('provider key') && (
            <Link
              href="/providers"
              className="font-bold underline hover:text-white text-xs"
            >
              Connect BYOK Key →
            </Link>
          )}
        </div>
      )}

      {/* Main Studio Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Scene Breakdown Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Film className="w-5 h-5 text-brand-400" />
              <span>Scene Breakdown ({scenes.length} moving clips)</span>
            </h2>
            <span className="text-xs text-slate-400">
              Target: {project.settings?.targetDurationSeconds || 30}s • Ratio:{' '}
              {project.settings?.aspectRatio || '9:16'}
            </span>
          </div>

          <div className="space-y-4">
            {scenes.map((scene: any, idx: number) => (
              <div
                key={scene.id || scene._id || idx}
                className="glass-card rounded-2xl p-5 border border-white/10 space-y-4 hover:border-brand-500/30 transition-all"
              >
                {/* Scene Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-500/30">
                      {scene.sceneNumber || idx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-200">
                      Scene {scene.sceneNumber || idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {scene.plannedDurationSeconds || 5}s clip
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        scene.status === 'stored'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : scene.status === 'processing'
                          ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 animate-pulse'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {scene.status || 'Planned'}
                    </span>
                  </div>
                </div>

                {/* Visual Prompt */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Visual Prompt
                  </span>
                  <p className="text-sm text-slate-200 bg-surface-950 p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                    {scene.visualPrompt}
                  </p>
                </div>

                {/* Narration */}
                {scene.narration && (
                  <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
                    <Volume2 className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                    <span>"{scene.narration}"</span>
                  </div>
                )}

                {/* Generated video preview if completed */}
                {scene.videoClipUrl && (
                  <div className="pt-2">
                    <video
                      src={scene.videoClipUrl}
                      controls
                      className="w-full max-h-64 rounded-xl border border-white/10 bg-black"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Video Player & Output Inspector */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Play className="w-5 h-5 text-accent-cyan" />
            <span>Master Video Player</span>
          </h2>

          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="aspect-[9/16] max-h-[460px] mx-auto rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center relative">
              {project.finalVideoUrl ? (
                <video
                  src={project.finalVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : project.status === 'generating' ? (
                <div className="text-center p-6 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-accent-cyan mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">
                    Generating clips via your BYOK key...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Clips will automatically appear as they complete.
                  </p>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-500">
                  <Film className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">No video generated yet</p>
                  <p className="text-[11px] text-slate-600">
                    Click "Start Video Generation" above
                  </p>
                </div>
              )}
            </div>

            {/* Video Specs Summary */}
            <div className="pt-3 border-t border-white/5 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Total Duration:</span>
                <span className="font-semibold text-slate-200">
                  {project.settings?.targetDurationSeconds || 30} seconds
                </span>
              </div>
              <div className="flex justify-between">
                <span>Aspect Ratio:</span>
                <span className="font-semibold text-slate-200">
                  {project.settings?.aspectRatio || '9:16'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-semibold text-slate-200">MP4 (H.264)</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Target:</span>
                <span className="font-semibold text-slate-200">Amazon S3 Central</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
