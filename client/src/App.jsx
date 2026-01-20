import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard,
    Calculator,
    Bitcoin,
    DollarSign,
    Briefcase,
    RefreshCw,
    Search,
    Bell,
    Settings,
    Zap,
    ArrowUpRight,
    Layers,
    Newspaper,
    Menu,
    X
} from 'lucide-react';
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    ResponsiveContainer
} from 'recharts';
import CalculatorView from './components/CalculatorView';
import P2PView from './components/P2PView';
import BTCPriceCard from './components/BTCPriceCard';
import BCVView from './components/BCVView';
import NewsView from './components/NewsView';
import CryptoMarketTable from './components/CryptoMarketTable';
import BCVDashboardCard from './components/BCVDashboardCard';
import AverageMatrix from './components/AverageMatrix';

// --- CHART UTILITIES ---
const generateTrendData = (currentValue, startValue, points = 20) => {
    // If we don't have real values yet, return flat line
    if (!currentValue || currentValue === 0) return Array(points).fill({ value: 0 });

    const data = [];
    const step = (currentValue - startValue) / points;

    // Add some noise but follow the trend
    for (let i = 0; i < points; i++) {
        const trendBase = startValue + (step * i);
        // Random noise between -0.5% and +0.5% of value
        const noise = trendBase * (Math.random() * 0.01 - 0.005);
        data.push({
            time: i,
            value: trendBase + noise
        });
    }
    // Ensure last point is exactly the current value (or very close)
    data[points - 1].value = currentValue;
    return data;
};

import { API_BASE_URL } from './config';

function App() {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [bcvHistory, setBcvHistory] = useState([]);
    const [p2pList, setP2pList] = useState({ buy: [], sell: [] });
    const [bybitList, setBybitList] = useState({ buy: [], sell: [] });

    const fetchData = async () => {
        try {
            // Fetch concurrently but handle failures independently
            const [ratesResult, p2pResult, bybitResult] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/api/rates`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/p2p/dashboard`).then(res => {
                    if (!res.ok) throw new Error('P2P fetch failed');
                    return res.json();
                }),
                fetch(`${API_BASE_URL}/api/bybit/dashboard`).then(res => {
                    if (!res.ok) throw new Error('Bybit fetch failed');
                    return res.json();
                })
            ]);

            // Handle Rates (Critical)
            if (ratesResult.status === 'fulfilled') {
                setRates(ratesResult.value);
            } else {
                console.error("Rates fetch failed:", ratesResult.reason);
                setError('Failed to load exchange rates');
            }

            // Handle Binance Widget (Non-critical)
            if (p2pResult.status === 'fulfilled') {
                setP2pList(p2pResult.value);
            } else {
                console.warn("Binance Dashboard fetch failed:", p2pResult.reason);
            }

            // Handle Bybit Widget (Non-critical)
            if (bybitResult.status === 'fulfilled') {
                setBybitList(bybitResult.value);
            } else {
                console.warn("Bybit Dashboard fetch failed:", bybitResult.reason);
            }

            setLoading(false);
        } catch (err) {
            console.error("Critical Fetch Error:", err);
            setError('System error. Check console.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Fetch BCV history once
        fetch(`${API_BASE_URL}/api/bcv/history`)
            .then(res => res.json())
            .then(data => setBcvHistory(data))
            .catch(err => console.error("Failed to load BCV history", err));

        const interval = setInterval(fetchData, 60000); // 1 min update
        return () => clearInterval(interval);
    }, []);

    // Derived Data
    // Robust BCV Rate: Try live -> Try history -> Default 0
    const bcvRate = useMemo(() => {
        const liveRate = rates?.bcv?.rate;
        if (liveRate && liveRate > 0) return liveRate;
        if (bcvHistory.length > 0) return bcvHistory[bcvHistory.length - 1].value;
        return 0;
    }, [rates, bcvHistory]);

    // Robust BCV EUR Rate: Try live -> Try history -> Default 0
    const bcvEurRate = useMemo(() => {
        const liveRate = rates?.bcv?.eurRate;
        if (liveRate && liveRate > 0) return liveRate;
        // Check if history has eur field
        if (bcvHistory.length > 0) {
            const last = bcvHistory[bcvHistory.length - 1];
            return last.eur || 0;
        }
        return 0;
    }, [rates, bcvHistory]);

    // Robust BCV Last Update
    const bcvLastUpdate = useMemo(() => {
        if (rates?.bcv?.lastUpdate) return rates.bcv.lastUpdate;
        if (bcvHistory.length > 0) return bcvHistory[bcvHistory.length - 1].date;
        return null;
    }, [rates, bcvHistory]);

    const binanceRate = rates?.binance?.buy || 0;
    const diff = binanceRate > 0 ? ((binanceRate - bcvRate) / bcvRate) * 100 : 0;
    const isPositive = diff > 0;

    // Helper to calculate P2P Averages
    const getAvg = (list) => {
        if (!list || list.length === 0) return 0;
        return list.reduce((sum, item) => sum + item.price, 0) / list.length;
    };

    const binanceBuyAvg = getAvg(p2pList.buy);
    const binanceSellAvg = getAvg(p2pList.sell);
    const bybitBuyAvg = getAvg(bybitList.buy);
    const bybitSellAvg = getAvg(bybitList.sell);

    // Chart Data
    // Use real history if available, else simulate
    const bcvChartData = useMemo(() => {
        if (bcvHistory.length > 0) return bcvHistory;
        return generateTrendData(bcvRate, 330);
    }, [bcvRate, bcvHistory]);

    // Simulate trend: Binance from ~Current*0.99 to Current (steady rise)
    const binanceChartData = useMemo(() => generateTrendData(binanceRate, binanceRate * 0.98), [binanceRate]);

    // ... View Routing Logic ...

    const renderContent = () => {
        switch (currentView) {
            case 'calculator':
                return <CalculatorView rates={rates} bcvHistory={bcvHistory} />;
            case 'bcv':
                return <BCVView />;
            case 'p2p':
                return <P2PView />;
            case 'news':
                return <NewsView />;
            case 'dashboard':
            default:
                return (
                    <div className="p-6 max-w-[1600px] mx-auto space-y-6">



                        {/* Main Grid: 2 Columns on Desktop, 1 on Mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Card: BCV Official Rates (Small Widget) */}
                            <BCVDashboardCard
                                rate={bcvRate}
                                eurRate={bcvEurRate}
                                lastUpdate={bcvLastUpdate}
                            />

                            {/* Card: Binance P2P */}
                            <DashboardCard title="Binance USDT P2P (VES)" icon={<DollarSign className="text-yellow-500" size={20} />}>
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    {/* BUY Column */}
                                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                                        <div className="text-xs uppercase font-bold text-emerald-400 mb-2 border-b border-emerald-500/20 pb-1">Top Buy</div>
                                        <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-hide">
                                            {p2pList.buy && p2pList.buy.length > 0 ? p2pList.buy.map((ad, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 last:border-0 py-1">
                                                    <span className="text-slate-300 truncate w-24" title={ad.name}>{ad.name}</span>
                                                    <span className="font-mono font-bold text-white">{ad.price.toFixed(2)}</span>
                                                </div>
                                            )) : <div className="text-xs text-slate-500 italic">No ads</div>}
                                        </div>
                                    </div>

                                    {/* SELL Column */}
                                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                                        <div className="text-xs uppercase font-bold text-red-400 mb-2 border-b border-red-500/20 pb-1">Top Sell</div>
                                        <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-hide">
                                            {p2pList.sell && p2pList.sell.length > 0 ? p2pList.sell.map((ad, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 last:border-0 py-1">
                                                    <span className="text-slate-300 truncate w-24" title={ad.name}>{ad.name}</span>
                                                    <span className="font-mono font-bold text-white">{ad.price.toFixed(2)}</span>
                                                </div>
                                            )) : <div className="text-xs text-slate-500 italic">No ads</div>}
                                        </div>
                                    </div>
                                </div>
                                {/* Footer Info */}
                                <div className="mt-auto pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800">
                                    <div className="flex gap-3">
                                        <span className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Avg Buy: <span className="text-slate-300 font-mono">{binanceBuyAvg > 0 ? binanceBuyAvg.toFixed(2) : '-.--'}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            Avg Sell: <span className="text-slate-300 font-mono">{binanceSellAvg > 0 ? binanceSellAvg.toFixed(2) : '-.--'}</span>
                                        </span>
                                    </div>
                                    <span>Binance P2P</span>
                                </div>
                            </DashboardCard>

                            {/* Card: Bybit P2P */}
                            <DashboardCard title="Bybit USDT P2P (VES)" icon={<Layers className="text-orange-500" size={20} />}>
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    {/* BUY Column */}
                                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                                        <div className="text-xs uppercase font-bold text-emerald-400 mb-2 border-b border-emerald-500/20 pb-1">Top Buy</div>
                                        <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-hide">
                                            {bybitList.buy && bybitList.buy.length > 0 ? bybitList.buy.map((ad, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 last:border-0 py-1">
                                                    <span className="text-slate-300 truncate w-24" title={ad.name}>{ad.name}</span>
                                                    <span className="font-mono font-bold text-white">{ad.price.toFixed(2)}</span>
                                                </div>
                                            )) : <div className="text-xs text-slate-500 italic">No ads</div>}
                                        </div>
                                    </div>

                                    {/* SELL Column */}
                                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                                        <div className="text-xs uppercase font-bold text-red-400 mb-2 border-b border-red-500/20 pb-1">Top Sell</div>
                                        <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-hide">
                                            {bybitList.sell && bybitList.sell.length > 0 ? bybitList.sell.map((ad, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 last:border-0 py-1">
                                                    <span className="text-slate-300 truncate w-24" title={ad.name}>{ad.name}</span>
                                                    <span className="font-mono font-bold text-white">{ad.price.toFixed(2)}</span>
                                                </div>
                                            )) : <div className="text-xs text-slate-500 italic">No ads</div>}
                                        </div>
                                    </div>
                                </div>
                                {/* Footer Info */}
                                <div className="mt-auto pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800">
                                    <div className="flex gap-3">
                                        <span className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Avg Buy: <span className="text-slate-300 font-mono">{bybitBuyAvg > 0 ? bybitBuyAvg.toFixed(2) : '-.--'}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            Avg Sell: <span className="text-slate-300 font-mono">{bybitSellAvg > 0 ? bybitSellAvg.toFixed(2) : '-.--'}</span>
                                        </span>
                                    </div>
                                    <span>Bybit P2P</span>
                                </div>
                            </DashboardCard>

                            {/* Card 4: Average Matrix (Calculated Data) */}
                            <AverageMatrix
                                bcvUsd={bcvRate}
                                bcvEur={bcvEurRate}
                                binanceRate={binanceRate}
                            />

                            {/* Card 5: Comparison Summary */}
                            <div className="bg-[#1E293B]/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg h-full flex flex-col justify-between hover:shadow-blue-900/5 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Resumen Comparativo</h3>
                                    <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><RefreshCw size={16} /></button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <MiniCard title="USDT/VES Diff" value={`${diff.toFixed(2)}%`} change={isPositive ? "High Spread" : "Low Spread"} isGood={isPositive} />
                                    <MiniCard title="Rate Change (24h)" value="+1.8%" change="Trending Up" isGood={false} />
                                </div>

                                {/* Spread Indicator Box */}
                                <div className="mt-4 bg-[#0B1120] rounded-xl p-4 border border-slate-800/60">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400">Brecha Cambiaria (Spread)</span>
                                        <span className={`text-lg font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{diff.toFixed(2)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isPositive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(Math.abs(diff) * 5, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
                                        <span>0%</span>
                                        <span>5%</span>
                                        <span>10%+</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Top Section: Top 5 Crypto Market (Moves to Bottom) */}
                        <div className="mb-2">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Bitcoin className="text-yellow-500" /> Mercado Cripto (Top 5)
                            </h2>
                            <CryptoMarketTable />
                        </div>

                    </div>
                );
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">
            <div className="flex flex-col items-center">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-sm tracking-wider">LOADING SYSTEM...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans flex overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col p-4 hidden md:flex shrink-0">
                <div className="mb-6 flex justify-center px-2 py-4">
                    <img src="/sidebar_logo.png" alt="HC CAMINE" className="h-48 w-auto object-contain drop-shadow-2xl" />
                </div>

                <nav className="flex-1 space-y-1">
                    <NavItem
                        icon={<LayoutDashboard size={18} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => setCurrentView('dashboard')}
                    />
                    <NavItem
                        icon={<Calculator size={18} />}
                        label="P2P Scanner"
                        active={currentView === 'calculator'}
                        onClick={() => setCurrentView('calculator')}
                    />

                    <div className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Markets</div>
                    <NavItem
                        icon={<DollarSign size={18} className="text-green-500" />}
                        label="USDT P2P"
                        active={currentView === 'p2p'}
                        onClick={() => setCurrentView('p2p')}
                    />
                    <NavItem
                        icon={<Briefcase size={18} className="text-blue-500" />}
                        label="BCV Oficial"
                        active={currentView === 'bcv'}
                        onClick={() => setCurrentView('bcv')}
                    />

                    <div className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Intelligence</div>
                    <NavItem
                        icon={<Newspaper size={18} className="text-purple-400" />}
                        label="News & Analysis"
                        active={currentView === 'news'}
                        onClick={() => setCurrentView('news')}
                        badge="AI"
                    />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen relative scrollbar-hide">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                        >
                            <Menu size={24} />
                        </button>

                        <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-none">
                            {currentView === 'p2p' ? 'Mercado P2P' : currentView === 'news' ? 'Financial Intelligence' : currentView === 'dashboard' ? 'Dashboard' : currentView === 'bcv' ? 'Tasa Oficial BCV' : 'P2P Scanner'}
                            {currentView === 'dashboard' && <span className="hidden md:inline text-slate-500 font-normal text-lg ml-2">(Venezuela)</span>}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-slate-800/50 rounded-full px-4 py-2 border border-slate-700">
                            <Search size={16} className="text-slate-400 mr-2" />
                            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-32 focus:w-48 transition-all" />
                        </div>
                        <button className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0F172A]"></span>
                        </button>
                        <img src="/miner_avatar.png" alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover bg-slate-800" />
                    </div>
                </header>

                {/* VIEW CONTENT */}
                {renderContent()}
            </main>
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="relative bg-[#0F172A] w-64 h-full border-r border-slate-800 flex flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-6 px-2 py-4">
                            <img src="/sidebar_logo.png" alt="HC CAMINE" className="h-10 w-auto object-contain" />
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="flex-1 space-y-1">
                            <NavItem
                                icon={<LayoutDashboard size={18} />}
                                label="Dashboard"
                                active={currentView === 'dashboard'}
                                onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }}
                            />
                            <NavItem
                                icon={<Calculator size={18} />}
                                label="P2P Scanner"
                                active={currentView === 'calculator'}
                                onClick={() => { setCurrentView('calculator'); setIsMobileMenuOpen(false); }}
                            />

                            <div className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Markets</div>
                            <NavItem
                                icon={<DollarSign size={18} className="text-green-500" />}
                                label="USDT P2P"
                                active={currentView === 'p2p'}
                                onClick={() => { setCurrentView('p2p'); setIsMobileMenuOpen(false); }}
                            />
                            <NavItem
                                icon={<Briefcase size={18} className="text-blue-500" />}
                                label="BCV Oficial"
                                active={currentView === 'bcv'}
                                onClick={() => { setCurrentView('bcv'); setIsMobileMenuOpen(false); }}
                            />

                            <div className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Intelligence</div>
                            <NavItem
                                icon={<Newspaper size={18} className="text-purple-400" />}
                                label="News & Analysis"
                                active={currentView === 'news'}
                                onClick={() => { setCurrentView('news'); setIsMobileMenuOpen(false); }}
                                badge="AI"
                            />
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB COMPONENTS ---

const NavItem = ({ icon, label, badge, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium">{label}</span>
        </div>
        {badge && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase font-bold">{badge}</span>}
        {active && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>}
    </button>
);

const DashboardCard = ({ title, icon, children }) => (
    <div className="bg-[#1E293B]/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-blue-900/5 transition-all h-[300px]">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                {icon}
            </div>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{title}</h2>
        </div>
        {children}
    </div>
);

const MiniCard = ({ title, value, change, isGood }) => (
    <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400">{title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {change}
            </span>
        </div>
        <div className="text-xl font-bold text-white">{value}</div>
    </div>
);

export default App;
