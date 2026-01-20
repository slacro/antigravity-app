import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, AlertCircle, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import ArbitrageCard from './ArbitrageCard';
import { API_BASE_URL } from '../config';

const P2PView = () => {
    const [data, setData] = useState(null);
    const [bcvRate, setBcvRate] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tradeType, setTradeType] = useState('buy'); // 'buy' | 'sell'

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch including history for fallback
            const [p2pRes, ratesRes, historyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/p2p/ranges`),
                fetch(`${API_BASE_URL}/api/rates`),
                fetch(`${API_BASE_URL}/api/bcv/history`)
            ]);

            const p2pData = await p2pRes.json();
            const ratesData = await ratesRes.json();
            const historyData = await historyRes.json();

            setData(p2pData);

            // Robust BCV Rate: Try live -> Try history -> Default 0
            let rate = ratesData.bcv?.rate;
            if (!rate || rate === 0) {
                console.warn("Live BCV rate failed, using history fallback.");
                rate = historyData.length > 0 ? historyData[historyData.length - 1].value : 0;
            }
            setBcvRate(rate);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load P2P market data.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Auto refresh every 60s
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <RefreshCw className="animate-spin mb-4 text-blue-500" size={32} />
            <p>Scanning P2P Market...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-full text-red-400">
            <AlertCircle size={32} className="mb-4" />
            <p>{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700">Retry</button>
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Mercado P2P (USDT/VES)</h1>
                    <p className="text-slate-400 text-sm">Mejores ofertas encontradas en tiempo real</p>
                </div>

                {/* Toggle & Controls */}
                <div className="flex items-center gap-4">
                    {/* Trade Type Toggle */}
                    <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex">
                        <button
                            onClick={() => setTradeType('buy')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tradeType === 'buy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Quiero Comprar
                        </button>
                        <button
                            onClick={() => setTradeType('sell')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tradeType === 'sell' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Quiero Vender
                        </button>
                    </div>

                    <div className="bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-slate-500 font-semibold uppercase">Tasa BCV Oficial</div>
                            <div className="text-lg font-bold text-blue-400 font-mono">{bcvRate.toFixed(4)}</div>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* AI Arbitrage Scanner */}
            <div className="mb-6">
                <ArbitrageCard />
            </div>

            {/* Grid of Ranges (6 Cards: 3 Ranges x 2 Platforms) - Layout: 2 Columns for Side-by-Side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.ranges.map((range, idx) => (
                    <React.Fragment key={idx}>
                        <PlatformRangeCard
                            range={range}
                            provider="binance"
                            data={range.binance}
                            bcvRate={bcvRate}
                            tradeType={tradeType}
                        />
                        <PlatformRangeCard
                            range={range}
                            provider="bybit"
                            data={range.bybit}
                            bcvRate={bcvRate}
                            tradeType={tradeType}
                        />
                    </React.Fragment>
                ))}
            </div>

            <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
                <p>Calculations based on real-time P2P order books. "Diferencial" represents the percentage gap above the official BCV rate.</p>
                <p className="mt-1">Tasa utilizada para búsqueda: {data.rateUsed?.toFixed(2)} VES/USD</p>
            </div>
        </div>
    );
};

const PlatformRangeCard = ({ range, provider, data, bcvRate, tradeType }) => {
    // Select data based on trade type
    const ads = (data?.[tradeType] || []).slice(0, 5); // Top 5
    const isBinance = provider === 'binance';

    return (
        <div className={`backdrop-blur-md border rounded-2xl overflow-hidden flex flex-col h-full shadow-xl transition-all hover:shadow-2xl ${isBinance
            ? 'bg-[#1E293B]/70 border-yellow-500/20 hover:border-yellow-500/40'
            : 'bg-[#1E293B]/70 border-orange-500/20 hover:border-orange-500/40'
            }`}>
            {/* Header */}
            <div className={`p-4 border-b ${isBinance ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        {isBinance ? <DollarSign size={18} className="text-yellow-500" /> : <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">B</div>}
                        <h3 className={`font-bold text-lg ${isBinance ? 'text-yellow-400' : 'text-orange-400'}`}>
                            {isBinance ? 'Binance' : 'Bybit'}
                        </h3>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">{range.label}</span>
                    <span className="text-slate-500 font-mono">
                        {(range.testAmountVES / range.amountUSD * (range.id === 'low' ? 1 : range.id === 'mid' ? 20 : 100)).toFixed(0)} - {(range.testAmountVES / range.amountUSD * (range.id === 'low' ? 20 : range.id === 'mid' ? 100 : 200)).toFixed(0)} VES
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
                {ads.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                        <AlertCircle size={24} className="mb-2 opacity-50" />
                        No ads found in range.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {ads.map((ad, i) => {
                            const price = parseFloat(ad.price);
                            const diff = bcvRate > 0 ? ((price - bcvRate) / bcvRate) * 100 : 0;

                            return (
                                <div key={i} className="p-3 hover:bg-slate-800/40 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                                                {i + 1}
                                            </div>
                                            <span className="font-medium text-slate-200 truncate text-sm" title={ad.advertiser}>
                                                {ad.advertiser}
                                            </span>
                                        </div>
                                        <div className="text-right whitespace-nowrap ml-2">
                                            <div className="text-base font-bold text-white font-mono leading-tight">
                                                {price.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-[10px] text-slate-500 truncate max-w-[50%]">
                                            Lim: {parseFloat(ad.limitMin).toLocaleString()} - {parseFloat(ad.limitMax).toLocaleString()}
                                        </div>

                                        {/* Differential Badge */}
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${diff < 3 ? 'bg-emerald-500/10 text-emerald-400' :
                                            diff < 10 ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            {diff.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-slate-800/30 p-2 text-center border-t border-slate-700/50">
                <a
                    href={isBinance ? "https://p2p.binance.com/en/trade/all-payments/USDT?fiat=VES" : "https://www.bybit.com/fiat/trade/otc/?token=USDT&fiat=VES&paymentMethod="}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 w-full uppercase font-bold tracking-wider"
                >
                    Trade on {isBinance ? 'Binance' : 'Bybit'} <ArrowUpRight size={10} />
                </a>
            </div>
        </div>
    );
};

export default P2PView;
