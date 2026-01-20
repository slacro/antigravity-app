import React, { useState } from 'react';
import { Scale, TrendingUp, AlertTriangle, ArrowRight, BrainCircuit } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ArbitrageCard = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/arbitrage`);
            const data = await res.json();
            if (res.ok) {
                setAnalysis(data.analysis);
            } else {
                setAnalysis("Unable to generate analysis. Agent offline.");
            }
        } catch (e) {
            setAnalysis("Network Error: Could not reach AI Agent.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 transition-all group-hover:bg-blue-500/10"></div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Arbitrage Scanner</h3>
                        <p className="text-xs text-slate-400">AI-Powered Opportunity Detection</p>
                    </div>
                </div>
                {!analysis && (
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                        {loading ? <BrainCircuit size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                        {loading ? 'Scanning...' : 'Scan Now'}
                    </button>
                )}
            </div>

            {analysis ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-4 whitespace-pre-line text-slate-300 text-sm leading-relaxed">
                        {analysis}
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            Refresh Analysis <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                    <p>Compare Binance vs Bybit prices instantly.</p>
                    <p className="mt-1 text-xs opacity-70">Detects spreads &gt; 1%</p>
                </div>
            )}
        </div>
    );
};

export default ArbitrageCard;
