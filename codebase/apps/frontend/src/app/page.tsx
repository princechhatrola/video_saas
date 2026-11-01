'use client';

import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Film,
  KeyRound,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const providers = [
    {
      name: 'Alibaba Cloud Wan 2.1',
      tag: 'T2V & I2V Plus',
      models: 'wan2.1-t2v-plus',
      badge: 'Free Tier Eligible',
    },
    {
      name: 'MiniMax Hailuo AI',
      tag: 'Human Motion King',
      models: 'video-01',
      badge: 'Trial Credits',
    },
    {
      name: 'RunwayML',
      tag: 'Industry Benchmark',
      models: 'Gen-3 Alpha Turbo',
      badge: 'BYOK Direct',
    },
    {
      name: 'Luma Dream Machine',
      tag: 'Camera Motion',
      models: 'Ray 2 / Ray 1.6',
      badge: 'Free Tier Eligible',
    },
    {
      name: 'Kuaishou Kling AI',
      tag: '10s Extended Clips',
      models: 'Kling 1.5 Standard/Pro',
      badge: 'Daily Credits',
    },
  ];

  return (
    <div className="space-y-24 py-8">
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative text-center max-w-4xl mx-auto space-y-8 pt-6">
        {/* Glowing Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold shadow-glow-brand animate-pulse">
          <KeyRound className="w-3.5 h-3.5 text-brand-400" />
          <span>Bring Your Own Key (BYOK) Architecture</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
          <span className="text-slate-400 font-normal">Zero SaaS AI Markups</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Turn Simple Text Into{' '}
          <span className="bg-gradient-to-r from-brand-400 via-violet-300 to-accent-cyan bg-clip-text text-transparent">
            Real Moving AI Video Clips
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Connect your own API credentials for Wan 2.1, Hailuo, Runway, Luma, and Kling.
          Generate multi-scene reels and explainers stored securely in your central S3 bucket.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/projects/new"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 hover:opacity-90 text-white shadow-glow-brand transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create AI Video Now</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/providers"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold bg-surface-850 hover:bg-surface-800 text-slate-200 border border-white/10 hover:border-brand-500/40 transition-all"
          >
            <KeyRound className="w-4 h-4 text-brand-400" />
            <span>Manage API Providers</span>
          </Link>
        </div>

        {/* Guarantee Banner */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Actual video motion (No fake slideshows)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AES-256-GCM encrypted keys</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>30s, 60s, 90s, 120s video lengths</span>
          </div>
        </div>
      </section>

      {/* ── Interactive Pipeline Showcase ──────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 sm:p-10 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
            How VideoForge Operates
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Autonomous Multi-Scene Video Production
          </h2>
          <p className="text-sm text-slate-400">
            From raw concept to rendered MP4 through our unified adapter pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg border border-brand-500/30">
              01
            </div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Film className="w-4 h-4 text-brand-400" />
              Scene Planning & Script
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              We decompose your target duration into cinematic 5–6 second scene prompts,
              visual styles, and synchronized voiceover text.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-accent-cyan/20 text-accent-cyan flex items-center justify-center font-bold text-lg border border-accent-cyan/30">
              02
            </div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent-cyan" />
              BYOK Video Generation
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Worker processes submit prompts to your connected Wan 2.1, Hailuo, Runway,
              or Kling API keys, polling till moving MP4 clips are rendered.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              03
            </div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              S3 Archival & Export
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Raw clips are ingested into your Amazon S3 bucket, concatenated with optional
              subtitles and narration into a shareable high-definition MP4.
            </p>
          </div>
        </div>
      </section>

      {/* ── Supported AI Video Providers Grid ────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
              Adapter Network
            </span>
            <h2 className="text-2xl font-bold">Supported Video Generation Engines</h2>
          </div>
          <Link
            href="/providers"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Connect your API keys</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p) => (
            <div
              key={p.name}
              className="glass-card rounded-xl p-5 border border-white/10 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100">{p.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-brand-300 font-medium">{p.tag}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">{p.models}</span>
                <span className="text-emerald-400 text-[11px] font-medium">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
