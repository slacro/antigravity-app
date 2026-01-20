import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, ArrowUpRight, Calendar, Clock, TrendingUp, ChevronDown, Search, Filter, X } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const CURRENCIES = {
    usd: { label: 'Dólar (USD)', symbol: '$', key: 'value', color: '#EF4444' }, // Red-ish like the image
    eur: { label: 'Euro (EUR)', symbol: '€', key: 'eur', color: '#10B981' },   // Green-ish
    cny: { label: 'Yuan (CNY)', symbol: '¥', key: 'cny', color: '#F59E0B' },   // Yellow/Orange
    try: { label: 'Lira (TRY)', symbol: '₺', key: 'try', color: '#EC4899' },
    rub: { label: 'Rublo (RUB)', symbol: '₽', key: 'rub', color: '#6366F1' },
};

const TIME_RANGES = [
    { label: '7d', days: 7 },
    { label: '15d', days: 15 },
    { label: '1m', days: 30 },
    { label: '3m', days: 90 },
    { label: '1y', days: 365 },
    { label: 'All', days: null }
];

import { API_BASE_URL } from '../config';

const BCVView = () => {
    const [history, setHistory] = useState([]);
    const [currentCurrency, setCurrentCurrency] = useState('usd');
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Filters
    const [timeRange, setTimeRange] = useState(30); // Default 1 month
    const [searchDate, setSearchDate] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [liveData, setLiveData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch History
                const historyRes = await fetch(`${API_BASE_URL}/api/bcv/history`);
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    setHistory(historyData);
                }

                // Fetch Live Rates
                const ratesRes = await fetch(`${API_BASE_URL}/api/rates`);
                if (ratesRes.ok) {
                    const ratesData = await ratesRes.json();
                    setLiveData(ratesData.bcv);
                }
            } catch (err) {
                console.error("Failed to fetch BCV data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Derived Data
    const activeConfig = CURRENCIES[currentCurrency];
    const dataKey = activeConfig.key;

    // Filter History based on Time Range
    const filteredHistory = useMemo(() => {
        if (!timeRange) return history;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeRange);

        return history.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= cutoff;
        });
    }, [history, timeRange]);

    // Calculate Stats (Current, Change)
    const stats = useMemo(() => {
        // Base structure
        let currentVal = 0;
        let prevVal = 0;

        // 1. Determine Previous Value from History
        const validHistory = history.filter(item => item[dataKey] && item[dataKey] > 0);
        if (validHistory.length > 0) {
            const lastHistoryItem = validHistory[validHistory.length - 1];
            // If we have live data, the "previous" is the last history point. 
            // If we don't, "previous" is the second to last.

            if (liveData) {
                prevVal = Number(lastHistoryItem[dataKey]);
            } else {
                // Fallback to history-only logic
                prevVal = validHistory.length > 1
                    ? Number(validHistory[validHistory.length - 2][dataKey])
                    : Number(lastHistoryItem[dataKey]);
                currentVal = Number(lastHistoryItem[dataKey]);
            }
        }

        // 2. Determine Current Value (Live vs History)
        if (liveData) {
            // Map live keys to our config keys
            // Config keys: 'value' (usd), 'eur', 'cny', 'try', 'rub'
            // Live keys: rate (usd), eurRate
            // Note: We currently only scrape USD and EUR reliably live. 
            // Others usually come from history or need to be approximated if not scraped.

            if (currentCurrency === 'usd') {
                currentVal = liveData.rate;
            } else if (currentCurrency === 'eur') {
                currentVal = liveData.eurRate;
            } else {
                // Fallback for other currencies if not in live scrape
                // You might need to expand the scraper for CNY, TRY, RUB if desired.
                // For now, use history
                if (validHistory.length > 0) {
                    currentVal = Number(validHistory[validHistory.length - 1][dataKey]);
                }
            }
        }

        const change = currentVal - prevVal;
        const percentage = prevVal > 0 ? (change / prevVal) * 100 : 0;

        return { current: currentVal, change, percentage };
    }, [history, liveData, currentCurrency, dataKey]);

    // Format chart data
    const chartData = useMemo(() => {
        const data = filteredHistory.map(item => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' }),
            fullDate: item.date, // For searching/tooltip
            chartValue: Number(item[dataKey]) || 0
        })).filter(item => item.chartValue > 0);

        // Optional: Append live data point to chart if it's new?
        // For now, let's keep the chart strictly historical to avoid date overlap issues 
        // until we handle 'today' logic perfectly.

        return data;
    }, [filteredHistory, dataKey]);

    // Handle Date Search
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchDate) return;

        // Find exact match or closest
        const found = history.find(item => item.date === searchDate);
        if (found) {
            setSearchResult({
                date: searchDate,
                rate: found[dataKey],
                currency: activeConfig
            });
        } else {
            setSearchResult({ notFound: true, date: searchDate });
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
            Loading BCV Data...
        </div>
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            {/* Header: Title & Currency Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Briefcase className="text-blue-500" size={32} />
                        Tasa BCV Oficial
                    </h1>
                    <p className="text-slate-400 mt-1">Histórico de Tasas del Banco Central de Venezuela</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Search Input */}
                    <form onSubmit={handleSearch} className="flex items-center bg-[#0F172A] border border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50">
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="bg-transparent text-slate-300 text-sm px-3 py-2 outline-none"
                        />
                        <button type="submit" className="px-3 text-slate-400 hover:text-white transition-colors">
                            <Search size={16} />
                        </button>
                    </form>

                    {/* Currency Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors w-40 justify-between toggle-currency-menu"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg" style={{ color: activeConfig.color }}>{activeConfig.symbol}</span>
                                <span className="text-sm font-medium trunc">{activeConfig.label.split(' ')[0]}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                {Object.entries(CURRENCIES).map(([code, config]) => (
                                    <button
                                        key={code}
                                        onClick={() => {
                                            setCurrentCurrency(code);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors ${currentCurrency === code ? 'bg-slate-800' : ''}`}
                                    >
                                        <span className="font-bold w-6 text-center" style={{ color: config.color }}>{config.symbol}</span>
                                        <span className="text-sm text-slate-300">{config.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Result Overlay/Alert */}
            {searchResult && (
                <div className="bg-blue-600/20 border border-blue-500/50 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-blue-400" size={20} />
                        {searchResult.notFound ? (
                            <span className="text-slate-300">No hay datos registrados para el <span className="font-bold text-white">{searchResult.date}</span>.</span>
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <span className="text-slate-300">Tasa del {searchResult.date}:</span>
                                <span className="text-2xl font-bold text-white font-mono">{searchResult.rate.toFixed(4)}</span>
                                <span className="text-sm text-blue-400 font-bold">VES/{searchResult.currency.symbol}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSearchResult(null)} className="text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Card: Current Stats (Styled like the reference image 'Dolar' badge) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-24 blur-[80px] rounded-full opacity-20 transition-opacity duration-500 group-hover:opacity-30" style={{ backgroundColor: activeConfig.color }}></div>

                        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Tasa Actual</h2>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white tracking-tight">{stats.current.toFixed(2)}</span>
                            <span className="text-lg text-slate-500 font-medium">Bs.</span>
                        </div>

                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold border ${stats.percentage >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            <TrendingUp size={14} className={stats.percentage < 0 ? "rotate-180" : ""} />
                            <span>{Math.abs(stats.change).toFixed(4)} ({stats.percentage.toFixed(2)}%)</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">Variación vs día anterior</p>
                    </div>

                    {/* Quick Converter List */}
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 shadow-lg">
                        <h3 className="text-slate-300 font-semibold mb-4 text-sm flex items-center gap-2">
                            <Clock size={14} /> Referencia Rápida
                        </h3>
                        <div className="space-y-3">
                            {[10, 20, 50, 100].map(amt => (
                                <div key={amt} className="flex justify-between text-sm py-1 border-b border-slate-700/50 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded">
                                    <span className="text-slate-400">{amt} {activeConfig.symbol}</span>
                                    <span className="text-white font-mono font-medium">{(stats.current * amt).toFixed(2)} Bs.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Card: Chart */}
                <div className="lg:col-span-3 bg-[#1E293B] rounded-2xl border border-slate-700 shadow-lg flex flex-col">
                    {/* Chart Header Controls */}
                    <div className="p-4 border-b border-slate-700 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-slate-400" size={18} />
                            <span className="font-bold text-white text-sm">Evolución Histórica</span>
                        </div>

                        {/* Time Range Selectors */}
                        <div className="flex bg-[#0F172A] rounded-lg p-1 gap-1">
                            {TIME_RANGES.map(range => (
                                <button
                                    key={range.label}
                                    onClick={() => setTimeRange(range.days)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${(timeRange === range.days)
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="p-4 h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={true} horizontal={true} />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    minTickGap={30}
                                    dy={10}
                                />
                                <YAxis
                                    dataKey="chartValue"
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(val) => val.toFixed(2)}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        borderColor: '#475569',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: activeConfig.color, fontWeight: 'bold' }}
                                    formatter={(value) => [`${Number(value).toFixed(4)} Bs.`, activeConfig.label]}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return `Fecha: ${payload[0].payload.fullDate}`;
                                        }
                                        return label;
                                    }}
                                />
                                <ReferenceLine y={stats.current} stroke={activeConfig.color} strokeDasharray="3 3" opacity={0.5} />
                                <Area
                                    type="monotone"
                                    dataKey="chartValue"
                                    stroke={activeConfig.color}
                                    strokeWidth={3}
                                    fill="url(#colorGradient)"
                                    animationDuration={1000}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="px-6 pb-4 text-center">
                        <p className="text-xs text-slate-500">
                            Puedes deslizar o filtrar el gráfico para ver más días. Datos oficiales del BCV.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BCVView;
