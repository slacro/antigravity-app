import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config';

const CryptoMarketTable = () => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCoins = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/crypto/top`);
            if (res.ok) {
                const data = await res.json();
                setCoins(data);
            }
        } catch (err) {
            console.error("Failed to fetch top coins", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoins();
        const interval = setInterval(fetchCoins, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 h-[200px] animate-pulse">
            <div className="h-4 w-1/4 bg-slate-700 rounded mb-4"></div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-slate-700/50 rounded"></div>)}
            </div>
        </div>
    );

    return (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">Moneda</th>
                            <th className="p-4 text-right">Precio</th>
                            <th className="p-4 text-right">24h %</th>
                            <th className="p-4 text-right">7d %</th>
                            <th className="p-4 text-right hidden md:table-cell">Volumen (24h)</th>
                            <th className="p-4 text-right hidden lg:table-cell">Cap. Mercado</th>
                            <th className="p-4 w-48 text-right hidden sm:table-cell">Últimos 7 días</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {coins.map((coin) => (
                            <tr key={coin.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 text-center text-slate-500 font-medium">{coin.rank}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <div className="font-bold text-white text-sm">{coin.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{coin.symbol}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-white text-sm">
                                    ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td className={`p-4 text-right text-sm font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {coin.price_change_percentage_24h?.toFixed(2)}%
                                </td>
                                <td className={`p-4 text-right text-sm font-bold ${coin.price_change_percentage_7d_in_currency >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {coin.price_change_percentage_7d_in_currency?.toFixed(2)}%
                                </td>
                                <td className="p-4 text-right text-slate-400 text-sm hidden md:table-cell">
                                    ${(coin.volume_24h / 1e9).toFixed(2)}B
                                </td>
                                <td className="p-4 text-right text-slate-400 text-sm hidden lg:table-cell">
                                    ${(coin.market_cap / 1e9).toFixed(2)}B
                                </td>
                                <td className="p-4 w-48 hidden sm:table-cell">
                                    <div className="h-10 w-32 ml-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={coin.sparkline}>
                                                <defs>
                                                    <linearGradient id={`grad-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={coin.price_change_percentage_7d_in_currency >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={coin.price_change_percentage_7d_in_currency >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={coin.price_change_percentage_7d_in_currency >= 0 ? '#10B981' : '#EF4444'}
                                                    strokeWidth={2}
                                                    fill={`url(#grad-${coin.id})`}
                                                    isAnimationActive={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CryptoMarketTable;
