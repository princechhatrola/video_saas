'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Cpu,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';

export default function ProvidersPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    providerId: 'alibaba-wan',
    label: '',
    apiKey: '',
    region: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [connRes, catRes] = await Promise.all([
      api.getConnections(),
      api.getCatalog(),
    ]);

    if (connRes.data) setConnections(connRes.data);
    if (catRes.data) setCatalog(catRes.data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.apiKey || !form.label) return;

    setSubmitting(true);
    setMessage(null);

    const res = await api.createConnection(form);
    setSubmitting(false);

    if (res.error) {
      setMessage({ text: `Failed: ${res.error}`, type: 'error' });
    } else {
      setMessage({ text: 'API Provider key securely encrypted and saved!', type: 'success' });
      setShowModal(false);
      setForm({ providerId: 'alibaba-wan', label: '', apiKey: '', region: '' });
      loadData();
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setMessage(null);
    const res = await api.testConnection(id);
    setTestingId(null);

    if (res.data?.success) {
      setMessage({ text: 'API key validated successfully!', type: 'success' });
    } else {
      setMessage({
        text: res.data?.message || res.error || 'Key validation failed.',
        type: 'error',
      });
    }
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider key?')) return;
    await api.deleteConnection(id);
    loadData();
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Key className="w-8 h-8 text-brand-400" />
            API Providers (BYOK)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your own AI video generation API keys. All keys are encrypted at rest with AES-256-GCM.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-glow-brand transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Provider</span>
        </button>
      </div>

      {/* Global alert / message banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Connected Keys Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>Your Connected API Keys</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
            {connections.length}
          </span>
        </h2>

        {loading ? (
          <div className="glass-panel rounded-xl p-10 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
            <span>Loading connected providers...</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center space-y-4 border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">No Provider Keys Connected</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                To generate AI video clips, connect at least one provider key (e.g. Alibaba Wan 2.1 or MiniMax Hailuo).
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white text-sm shadow-glow-brand transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Connect First Provider</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((c) => (
              <div
                key={c.id}
                className="glass-card rounded-xl p-5 border border-white/10 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-slate-100">{c.label}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        c.status === 'valid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="text-xs text-brand-300 font-medium uppercase tracking-wide">
                    {c.providerId}
                  </div>

                  {/* Masked key display */}
                  <div className="p-2.5 rounded-lg bg-surface-950 font-mono text-xs text-slate-300 flex items-center justify-between border border-white/5">
                    <span>{c.maskedKey}</span>
                    <span className="text-[10px] text-slate-500 font-sans">AES-256</span>
                  </div>

                  {c.lastTestedAt && (
                    <p className="text-[11px] text-slate-400">
                      Validated: {new Date(c.lastTestedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleTest(c.id)}
                    disabled={testingId === c.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 text-slate-200 border border-white/10 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingId === c.id ? 'animate-spin' : ''}`} />
                    <span>{testingId === c.id ? 'Testing...' : 'Test Key'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete connection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Provider Catalog Section */}
      <section className="space-y-4 pt-6 border-t border-white/10">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-400" />
            <span>Supported Engines & Capabilities</span>
          </h2>
          <p className="text-xs text-slate-400">
            All models generate real moving video clips. Free tier and trial eligibility depends on your account at each provider.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {catalog.map((item) => (
            <div
              key={item.providerId}
              className="glass-panel rounded-xl p-5 border border-white/10 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100">{item.name}</h3>
                  <a
                    href={item.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-brand-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {item.capabilities?.map((cap: string) => (
                    <span
                      key={cap}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                    >
                      {cap.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {item.models?.length > 0 && (
                  <div className="text-xs text-slate-400 space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-slate-300">Models:</span>
                    <ul className="space-y-0.5 font-mono text-[11px]">
                      {item.models.map((m: any) => (
                        <li key={m.modelId} className="truncate">
                          • {m.displayName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>{item.company}</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Connect Provider Modal ────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-2xl max-w-lg w-full p-6 border border-white/15 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-400" />
                <span>Connect AI Provider (BYOK)</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Provider select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select Provider Engine
                </label>
                <select
                  value={form.providerId}
                  onChange={(e) => setForm({ ...form, providerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="alibaba-wan">Alibaba Cloud Wan 2.1 (DashScope)</option>
                  <option value="minimax-hailuo">MiniMax (Hailuo AI Video-01)</option>
                  <option value="runway">RunwayML (Gen-3 Alpha Turbo)</option>
                  <option value="luma">Luma Dream Machine (Ray 2)</option>
                  <option value="kling">Kuaishou Kling AI (Kling 1.5)</option>
                </select>
              </div>

              {/* Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Connection Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My DashScope Key"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  API Key / Secret Token
                </label>
                <input
                  type="password"
                  required
                  placeholder="sk-..."
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-slate-100 text-sm font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Security Callout */}
              <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-brand-400" />
                  <span>BYOK Security Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Your secret is encrypted immediately using AES-256-GCM. Plaintext is never stored, never logged, and only decrypted in-memory during job processing.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all disabled:opacity-50"
                >
                  {submitting ? 'Encrypting & Saving...' : 'Save & Encrypt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
