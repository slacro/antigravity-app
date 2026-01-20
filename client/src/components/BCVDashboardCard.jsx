import React from 'react';
import { Briefcase } from 'lucide-react';

const BCVDashboardCard = ({ rate, eurRate, lastUpdate }) => {
    // If no props are provided, we shouldn't display junk, but parent handles that usually.
    // If rate is missing/0, we might want to handle it.

    if (!rate) return null;

    return (
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 bg-blue-500/10 blur-[60px] rounded-full"></div>

            <div className="flex items-center gap-2 mb-4">
                <Briefcase className="text-blue-500" size={20} />
                <h3 className="text-white font-bold text-lg">Tasas BCV</h3>
            </div>

            <div className="space-y-4">
                {/* USD Row */}
                <div className="flex justify-between items-center group/item p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 text-xs font-bold text-emerald-400">
                            $
                        </div>
                        <div>
                            <div className="text-slate-300 text-sm font-medium">Dólar (USD)</div>
                            <div className="text-slate-500 text-xs">Oficial</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-white font-bold font-mono text-lg">{rate.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Bs.</div>
                    </div>
                </div>

                {/* EUR Row */}
                <div className="flex justify-between items-center group/item p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 text-xs font-bold text-blue-400">
                            €
                        </div>
                        <div>
                            <div className="text-slate-300 text-sm font-medium">Euro (EUR)</div>
                            <div className="text-slate-500 text-xs">Oficial</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-white font-bold font-mono text-lg">{eurRate.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Bs.</div>
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                <span className="text-xs text-slate-500">Actualizado: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}</span>
            </div>
        </div>
    );
};

export default BCVDashboardCard;
