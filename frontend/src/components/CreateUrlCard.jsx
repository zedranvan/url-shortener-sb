import React, { useState } from 'react';
import { urlApi, API_BASE_URL } from '../api/client';
import { Link2, Sparkles, Copy, Check, ExternalLink, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function CreateUrlCard({ onCreated, onRequireAuth, isAuthenticated }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentShortUrl, setRecentShortUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    let urlToShorten = originalUrl.trim();
    if (!urlToShorten) return;

    // 容错补充协议
    if (!/^https?:\/\//i.test(urlToShorten)) {
      urlToShorten = 'https://' + urlToShorten;
    }

    setError('');
    setLoading(true);

    try {
      const res = await urlApi.createShortUrl(urlToShorten);
      setRecentShortUrl(res);
      setOriginalUrl('');
      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '生成短链失败，请检查网络或后端状态');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (fullUrl) => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullShortUrl = recentShortUrl
    ? `${API_BASE_URL}/${recentShortUrl.shortUrl}`
    : '';

  return (
    <div className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>极速短链接生成与分发引擎</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          让长链接变简短，追踪每一次点击
        </h1>
        <p className="text-sm sm:text-base text-indigo-200/80 max-w-xl mx-auto">
          将冗长的链接缩减为极简短码，支持高性能 302 毫秒级重定向与实时访问量统计。
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-inner">
            <div className="flex items-center gap-3 flex-1 w-full px-3 py-1">
              <Link2 className="w-5 h-5 text-indigo-300 shrink-0" />
              <input
                type="text"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="粘贴需要缩短的长链接 (例如: https://github.com/...)"
                className="w-full bg-transparent text-white placeholder-indigo-200/50 text-sm sm:text-base focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>生成短链</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-rose-300 text-xs mt-2 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result Box */}
        {recentShortUrl && (
          <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-left animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-200 font-medium">短链已生成：</span>
                  <a
                    href={fullShortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-bold text-emerald-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{fullShortUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
                <p className="text-xs text-indigo-200/60 truncate">
                  指向: {recentShortUrl.originalUrl}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(fullShortUrl)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制！' : '复制短链'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
