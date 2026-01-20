import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from 'lucide-react';
import { API_BASE_URL } from '../config';

const BTCPriceCard = () => {
    const [priceData, setPriceData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [timeframe, setTimeframe] = useState('1h'); // Default view
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/btc/stats`);
            const data = await res.json();
            setPriceData(data);
        } catch (e) {
            console.error("Failed to fetch BTC stats", e);
        }
    };

    const fetchChart = async (tf) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/btc/chart?timeframe=${tf}`);
            const data = await res.json();
            // Format time for tooltip?
            setChartData(data);
        } catch (e) {
            console.error("Failed to fetch chart", e);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchStats(), fetchChart(timeframe)]).then(() => setLoading(false));

        // Auto refresh price every 10s
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    // When timeframe changes, only fetch chart
    useEffect(() => {
        fetchChart(timeframe);
    }, [timeframe]);

    if (loading && !priceData) return (
        <div className="bg-[#1E293B]/70 h-[400px] rounded-2xl flex items-center justify-center animate-pulse">
            <div className="text-slate-500">Loading Bitcoin Market Data...</div>
        </div>
    );

    const price = parseFloat(priceData?.lastPrice || 0);
    const change = parseFloat(priceData?.priceChangePercent || 0);
    const isPositive = change >= 0;

    return (
        <div className="col-span-full md:col-span-2 lg:col-span-3 bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6">

                {/* Header / Price Info */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" className="w-8 h-8" />
                        <h2 className="text-2xl font-bold text-white tracking-tight">Bitcoin <span className="text-slate-500 text-lg font-normal">BTC</span></h2>
                        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded border border-slate-700">#1</span>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="text-5xl font-bold text-white tracking-tighter">
                            ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center gap-1 mb-2 px-2 py-1 rounded-lg font-bold text-sm ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(change).toFixed(2)}% (24h)
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    {['5m', '1h', '1M', '1Y'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${timeframe === tf
                                ? 'bg-[#0F172A] text-white shadow-lg border border-slate-700'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="time"
                            hide={true}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            hide={true}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            labelFormatter={() => ''}
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? "#10B981" : "#EF4444"}
                            strokeWidth={3}
                            fill="url(#chartGradient)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-4 font-mono px-2">
                <span>Low: ${parseFloat(priceData?.lowPrice || 0).toLocaleString()}</span>
                <span>Vol: ${(parseFloat(priceData?.quoteVolume || 0) / 1000000000).toFixed(2)}B</span>
                <span>High: ${parseFloat(priceData?.highPrice || 0).toLocaleString()}</span>
            </div>
        </div>
    );
};

export default BTCPriceCard;
