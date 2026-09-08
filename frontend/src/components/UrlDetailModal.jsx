import React, { useState, useEffect } from 'react';
import { urlApi, API_BASE_URL } from '../api/client';
import { X, ExternalLink, Calendar, Loader2, BarChart2 } from 'lucide-react';

export default function UrlDetailModal({ urlItem, isOpen, onClose }) {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !urlItem) return;

    const fetchSingleUrlAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const now = new Date();
        const past = new Date();
        past.setDate(now.getDate() - 14);

        const formatIsoDate = (d, timeStr) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}T${timeStr}`;
        };

        const startDate = formatIsoDate(past, '00:00:00');
        const endDate = formatIsoDate(now, '23:59:59');

        const res = await urlApi.getUrlAnalytics(urlItem.shortUrl, startDate, endDate);
        setAnalytics(res || []);
      } catch (err) {
        console.error(err);
        setError('获取该链接的详细统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSingleUrlAnalytics();
  }, [isOpen, urlItem]);

  if (!isOpen || !urlItem) return null;

  const fullUrl = `${API_BASE_URL}/${urlItem.shortUrl}`;
  const totalInPeriod = analytics.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const maxCount = Math.max(...analytics.map((a) => a.count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">单链点击明细</h3>
              <p className="text-xs text-slate-400 font-mono">/{urlItem.shortUrl}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Link Info Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">短链地址：</span>
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 font-mono"
              >
                <span>{fullUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-xs text-slate-600 truncate">
              <span className="text-slate-400">原始目标: </span>
              {urlItem.originalUrl}
            </div>
            <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-200/60">
              <span className="text-slate-500">累计总点击：</span>
              <span className="font-bold text-slate-900">{urlItem.clickCount} 次</span>
            </div>
          </div>

          {/* Chart Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              近 14 天每日点击走势
            </span>
            <span className="text-xs text-slate-500">区间累计: {totalInPeriod} 次</span>
          </div>

          {/* Chart Area */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
            {loading ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-xs">加载明细中...</span>
              </div>
            ) : error ? (
              <div className="h-44 flex items-center justify-center text-rose-500 text-xs">{error}</div>
            ) : analytics.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 gap-1 text-xs">
                <Calendar className="w-6 h-6 text-slate-300 stroke-1" />
                <span>该时间段内暂无点击记录</span>
              </div>
            ) : (
              <div className="h-44 flex items-end justify-between gap-2 px-1 pb-1">
                {analytics.map((entry, idx) => {
                  const percent = (entry.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 mb-1 pointer-events-none whitespace-nowrap">
                        {entry.count} 次
                      </span>
                      <div className="w-full max-w-[28px] bg-slate-200/70 group-hover:bg-indigo-200 rounded-t h-full flex items-end justify-center">
                        <div
                          style={{ height: `${Math.max(percent, 8)}%` }}
                          className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t transition-all"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1.5 font-mono truncate w-full text-center">
                        {entry.clickDate ? entry.clickDate.slice(5) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
