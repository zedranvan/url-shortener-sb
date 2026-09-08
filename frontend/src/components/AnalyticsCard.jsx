import React, { useState, useEffect } from 'react';
import { urlApi } from '../api/client';
import { BarChart2, TrendingUp, Calendar, Loader2, Info } from 'lucide-react';

export default function AnalyticsCard() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTotalClicks = async (selectedDays) => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - selectedDays);

      const formatLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startDate = formatLocalDate(past);
      const endDate = formatLocalDate(now);

      const res = await urlApi.getTotalClicks(startDate, endDate);
      setData(res || {});
    } catch (err) {
      console.error(err);
      setError('获取点击趋势统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalClicks(days);
  }, [days]);

  // Generate date list for chart
  const dateEntries = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateEntries.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: data[key] || 0,
    });
  }

  const totalClicks = dateEntries.reduce((acc, curr) => acc + curr.count, 0);
  const maxClicks = Math.max(...dateEntries.map((e) => e.count), 1);
  const avgClicks = (totalClicks / days).toFixed(1);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">点击趋势全景分析</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">查看账号下所有短链接的历史点击聚合趋势</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          {[7, 14, 30].map((num) => (
            <button
              key={num}
              onClick={() => setDays(num)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                days === num
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              近 {num} 天
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs text-slate-500 font-medium">区间累计点击</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{totalClicks} 次</div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs text-slate-500 font-medium">日均访问量</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{avgClicks} 次/天</div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs text-slate-500 font-medium">最高单日点击</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {Math.max(...dateEntries.map((e) => e.count))} 次
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="pt-4">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">加载统计数据中...</span>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-rose-500 text-xs">{error}</div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 px-2 pb-2 border-b border-slate-200">
            {dateEntries.map((entry) => {
              const heightPercent = maxClicks > 0 ? (entry.count / maxClicks) * 100 : 0;
              return (
                <div key={entry.date} className="flex-1 flex flex-col items-center group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 mb-1 pointer-events-none whitespace-nowrap shadow-lg">
                    {entry.date}: {entry.count} 次
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[32px] bg-slate-100 group-hover:bg-indigo-100 rounded-t-lg relative flex items-end justify-center transition-all h-full">
                    <div
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t-lg transition-all"
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[10px] text-slate-400 mt-2 font-mono truncate w-full text-center">
                    {entry.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
