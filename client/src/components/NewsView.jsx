import React, { useState, useEffect } from 'react';
import { Newspaper, BrainCircuit, ExternalLink, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

const NewsView = () => {
    const [news, setNews] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIntel = async () => {
            try {
                const [newsRes, reportsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/news`),
                    fetch(`${API_BASE_URL}/api/analysis`)
                ]);

                if (newsRes.ok) setNews(await newsRes.json());
                if (reportsRes.ok) setReports(await reportsRes.json());
            } catch (error) {
                console.error("Failed to load news/intel", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIntel();
    }, []);

    // Get latest Daily Brief
    const dailyBrief = reports.find(r => r.report_type === 'daily_brief');
    // Parse JSON content if valid
    let briefData = null;
    try {
        if (dailyBrief) briefData = JSON.parse(dailyBrief.content);
    } catch (e) { console.error("JSON Parse Error", e); }

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Financial Intelligence...</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-900/30 p-3 rounded-xl border border-purple-500/20">
                        <BrainCircuit size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Financial Intelligence</h1>
                        <p className="text-slate-400 text-sm">AI-Powered Market Analysis & Real-time News</p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        try {
                            setLoading(true);
                            const res = await fetch(`${API_BASE_URL}/api/news/refresh`, { method: 'POST' });
                            const data = await res.json();

                            if (res.ok) {
                                window.location.reload();
                            } else {
                                alert(`Error: ${data.error || 'Failed to refresh'}`);
                                setLoading(false);
                            }
                        } catch (e) {
                            alert("Network Error: Could not reach server.");
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors font-bold shadow-lg shadow-purple-900/20"
                >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    {loading ? 'Analyzing...' : 'Refresh AI'}
                </button>
            </div>

            <div className="space-y-6">

                {/* Section 1: AI Agent Reports */}
                <div className="space-y-6">
                    {/* Daily Brief Card */}
                    {briefData ? (
                        <div className="bg-[#1E293B]/70 border border-purple-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] -z-10"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="text-2xl">🤖</span> Daily Market Brief
                                    </h2>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <Clock size={12} /> Generated: {new Date(dailyBrief.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${briefData.sentiment === 'Bullish' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                    briefData.sentiment === 'Bearish' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                    }`}>
                                    Sentiment: {briefData.sentiment}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-300 uppercase mb-2">Executive Summary</h3>
                                    <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
                                        {briefData.summary}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-xs font-bold text-purple-400 uppercase mb-2">Key Highlights</h3>
                                        <ul className="space-y-2">
                                            {briefData.highlights?.map((h, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-300">
                                                    <span className="text-purple-500">•</span> {h}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-blue-400 uppercase mb-2">Short-term Outlook</h3>
                                        <p className="text-sm text-slate-300 italic border-l-2 border-blue-500/30 pl-3">
                                            "{briefData.outlook}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#1E293B]/70 border border-slate-800 rounded-2xl p-12 text-center w-full">
                            <BrainCircuit size={48} className="mx-auto text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">Waiting for AI Agent...</h3>
                            <p className="text-sm text-slate-500 mt-2">The daily brief hasn't been generated yet. Use the Refresh button.</p>
                        </div>
                    )}

                    {/* Local Analysis (Other Reports) */}
                    {reports.filter(r => r.report_type !== 'daily_brief').map(report => (
                        <div key={report.id} className="bg-[#1E293B]/70 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><TrendingUp size={18} /></div>
                                <h3 className="font-bold text-white">Local Market Analysis</h3>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                <p className="whitespace-pre-line">{report.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 2: News Feed (Full Width Grid) */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl flex flex-col">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 rounded-t-2xl flex justify-between items-center">
                        <h2 className="font-bold text-white flex items-center gap-2 text-lg">
                            <Newspaper size={20} className="text-slate-400" /> Live Feed
                        </h2>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full animate-pulse font-bold">● LIVE UPDATES</span>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {news.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-5 rounded-2xl bg-slate-900/30 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition-all group shadow-sm flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-900/20 px-2 py-1 rounded">{item.source}</span>
                                        <span className="text-xs text-slate-500">{new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors leading-snug mb-3 line-clamp-2">
                                        {item.title}
                                    </h3>
                                    {item.summary && (
                                        <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3 flex-1">
                                            {item.summary.replace(/<[^>]*>?/gm, '')}
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50 mt-auto">
                                        <span className="text-xs text-slate-600">{new Date(item.published_at).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-1 text-xs text-blue-500 group-hover:text-blue-400 font-medium">
                                            Read Full Article <ExternalLink size={12} />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NewsView;
