import React, { useState } from 'react';
import { API_BASE_URL } from '../api/client';
import { Copy, Check, ExternalLink, BarChart3, Search, RefreshCw, Link as LinkIcon, Calendar } from 'lucide-react';

export default function UrlTable({ urls, loading, onRefresh, onSelectAnalytics }) {
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = (id, shortUrl) => {
    const fullUrl = `${API_BASE_URL}/${shortUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUrls = urls.filter(
    (item) =>
      item.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">我的短链接</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            共计 {urls.length} 条短链，总点击量{' '}
            <span className="font-semibold text-indigo-600">
              {urls.reduce((sum, item) => sum + (item.clickCount || 0), 0)}
            </span>{' '}
            次
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索短码或原网址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="刷新列表"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5">短链信息</th>
              <th className="px-6 py-3.5">原始长链接</th>
              <th className="px-6 py-3.5 text-center">累计点击</th>
              <th className="px-6 py-3.5">创建时间</th>
              <th className="px-6 py-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUrls.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <LinkIcon className="w-8 h-8 text-slate-300 stroke-1" />
                    <span className="text-sm">暂无匹配的短链接</span>
                    <span className="text-xs text-slate-400">请在上方输入框中生成第一条短链接</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUrls.map((item) => {
                const fullUrl = `${API_BASE_URL}/${item.shortUrl}`;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Short Link */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-xs">
                          /{item.shortUrl}
                        </span>
                        <button
                          onClick={() => handleCopy(item.id, item.shortUrl)}
                          title="复制短链接"
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Original URL */}
                    <td className="px-6 py-4 max-w-xs sm:max-w-md truncate">
                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-700 hover:text-indigo-600 hover:underline inline-flex items-center gap-1.5 truncate max-w-full"
                        title={item.originalUrl}
                      >
                        <span className="truncate">{item.originalUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                      </a>
                    </td>

                    {/* Click Count */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.clickCount} 次
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.createdDate)}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="测试跳转"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onSelectAnalytics(item)}
                          title="查看单链统计"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>分析</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
