import React, { useMemo } from 'react';
import { Calculator, ArrowRight, Activity, Percent } from 'lucide-react';

const AverageMatrix = ({ bcvUsd, bcvEur, binanceRate }) => {
    // Safety checks
    const usd = bcvUsd || 0;
    const eur = bcvEur || 0;
    const bin = binanceRate || 0;

    // 1. Promedio Bivalente (BCV Mix)
    // (USD + EUR) / 2
    const mixAverage = (usd + eur) / 2;

    // 2. Promedio de Mercado (Half Market)
    // (Binance + USD) / 2
    const marketAverage = (bin + usd) / 2;

    // 3. Spread Calculations
    // Full Spread (Binance - BCV)
    const spreadFullDiff = bin - usd;
    const spreadFullPct = usd > 0 ? (spreadFullDiff / usd) * 100 : 0;

    // Soft Spread (Avg - BCV)
    const spreadSoftDiff = marketAverage - usd;
    const spreadSoftPct = usd > 0 ? (spreadSoftDiff / usd) * 100 : 0;

    return (
        <div className="bg-[#1E293B]/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg h-full flex flex-col hover:shadow-blue-900/5 transition-all">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                    <Calculator size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Matriz de Promedios</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

                {/* Left Column: Key Indicators */}
                <div className="space-y-4">
                    {/* Mix Average Card */}
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-full -mr-4 -mt-4 transition-all group-hover:bg-blue-500/10"></div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Promedio Bivalente (USD+EUR)</div>
                        <div className="text-2xl font-mono font-bold text-white tracking-tight">
                            {mixAverage.toFixed(2)} <span className="text-xs text-slate-500 font-sans font-normal">Bs</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400">
                            <Activity size={10} />
                            <span>Ref. interna</span>
                        </div>
                    </div>

                    {/* Market Average Card */}
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-emerald-500/5 rounded-full -mr-4 -mt-4 transition-all group-hover:bg-emerald-500/10"></div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Promedio Mercado (BIN+BCV)</div>
                        <div className="text-2xl font-mono font-bold text-white tracking-tight">
                            {marketAverage.toFixed(2)} <span className="text-xs text-slate-500 font-sans font-normal">Bs</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                            <Activity size={10} />
                            <span>Media de brecha</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: The Table */}
                <div className="bg-[#0f172a]/60 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center py-2 border-b border-slate-700">
                        <div>BIN - BCV</div>
                        <div>PROM - BCV</div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 divide-x divide-slate-700/50">
                        {/* Column 1: Full Spread */}
                        <div className="flex flex-col justify-center items-center p-2 relative">
                            <div className="absolute inset-0 bg-red-500/5"></div>
                            <div className="text-lg font-bold text-white font-mono">{spreadFullDiff.toFixed(2)}</div>
                            <div className={`text-sm font-bold ${spreadFullPct > 20 ? 'text-red-400' : 'text-orange-400'} flex items-center gap-0.5`}>
                                <Percent size={12} /> {spreadFullPct.toFixed(1)}%
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1 text-center">Brecha Real</div>
                        </div>

                        {/* Column 2: Soft Spread */}
                        <div className="flex flex-col justify-center items-center p-2 relative">
                            <div className="absolute inset-0 bg-emerald-500/5"></div>
                            <div className="text-lg font-bold text-white font-mono">{spreadSoftDiff.toFixed(2)}</div>
                            <div className="text-sm font-bold text-emerald-400 flex items-center gap-0.5">
                                <Percent size={12} /> {spreadSoftPct.toFixed(1)}%
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1 text-center">Brecha Media</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-500">
                <span>Calculado a partir de tasas en vivo</span>
                <span className="flex items-center gap-1"><ArrowRight size={10} /> BCV Base: {usd.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default AverageMatrix;
