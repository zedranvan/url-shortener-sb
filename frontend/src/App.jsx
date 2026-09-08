import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import CreateUrlCard from './components/CreateUrlCard';
import UrlTable from './components/UrlTable';
import AnalyticsCard from './components/AnalyticsCard';
import UrlDetailModal from './components/UrlDetailModal';
import { urlApi } from './api/client';
import { Sparkles, Shield, Zap, BarChart, ArrowRight } from 'lucide-react';

function MainContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('links');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [urls, setUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [selectedUrlForDetail, setSelectedUrlForDetail] = useState(null);

  const fetchMyUrls = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingUrls(true);
    try {
      const data = await urlApi.getMyUrls();
      setUrls(data || []);
    } catch (err) {
      console.error('Failed to load user urls:', err);
    } finally {
      setLoadingUrls(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyUrls();
    } else {
      setUrls([]);
    }
  }, [isAuthenticated, fetchMyUrls]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Shorten Action Card */}
        <CreateUrlCard
          onCreated={fetchMyUrls}
          onRequireAuth={() => setAuthModalOpen(true)}
          isAuthenticated={isAuthenticated}
        />

        {/* Authenticated views */}
        {isAuthenticated ? (
          <div className="space-y-8">
            {activeTab === 'links' ? (
              <UrlTable
                urls={urls}
                loading={loadingUrls}
                onRefresh={fetchMyUrls}
                onSelectAnalytics={(item) => setSelectedUrlForDetail(item)}
              />
            ) : (
              <AnalyticsCard />
            )}
          </div>
        ) : (
          /* Guest Feature Highlights */
          <div className="py-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                高性能、轻量、开箱即用的短链接服务
              </h2>
              <p className="text-sm text-slate-500">
                基于 Spring Boot 3 与现代前端架构，为您的推广链接与数据分析保驾护航
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">毫秒级 302 重定向</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  高效短码索引与流线型路由，确保用户点击后以最快速度精准跳转目标站点。
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BarChart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">点击事件精准追踪</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  自动记录每次访问的时间戳与链接归属，提供天级趋势折线与聚合分析视图。
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">JWT 状态无感知鉴权</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  基于 Spring Security 与 JJWT 体系，私有链接资产隔离，保障数据安全。
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-100 transition-all text-sm"
              >
                <span>立即登录并管理短链</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <UrlDetailModal
        urlItem={selectedUrlForDetail}
        isOpen={!!selectedUrlForDetail}
        onClose={() => setSelectedUrlForDetail(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} ShortLink Hub · 开源短链系统</span>
          <div className="flex items-center gap-4">
            <span>Spring Boot 3 + React + Vite + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
