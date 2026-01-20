import React, { useState, useEffect, useRef } from 'react';
import { Search, Delete, Equal, X, Calculator, ChevronDown, Scale } from 'lucide-react';
import { VENEZUELA_BANKS } from '../data/banks';

const CalculatorView = ({ rates, bcvHistory }) => {
    // --- P2P LIST CALCULATOR STATE ---
    const [calcAmount, setCalcAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('all');
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcResults, setCalcResults] = useState(null);

    const handleP2PCalculate = async (e) => {
        e?.preventDefault();
        if (!calcAmount) return;
        setCalcLoading(true);
        try {
            const queryParams = new URLSearchParams({
                amount: calcAmount,
                paymentMethod: selectedBank
            });
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/p2p/calculate?${queryParams}`);
            const data = await response.json();
            setCalcResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setCalcLoading(false);
        }
    };

    // --- STANDARD MATH CALCULATOR STATE ---
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [isNewNumber, setIsNewNumber] = useState(true);

    const handleNumClick = (num) => {
        if (display === '0' || isNewNumber) {
            setDisplay(num.toString());
            setIsNewNumber(false);
        } else {
            setDisplay(display + num.toString());
        }
    };

    const handleOpClick = (op) => {
        setEquation(display + ' ' + op + ' ');
        setIsNewNumber(true);
    };

    const handleEqualClick = () => {
        try {
            // eslint-disable-next-line no-eval
            const result = eval(equation + display);
            setDisplay(result.toString());
            setEquation('');
            setIsNewNumber(true);
        } catch (e) {
            setDisplay('Error');
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setIsNewNumber(true);
    };

    const handleBackspace = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
            setIsNewNumber(true);
        }
    };

    // Keyboard support
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Do not handle if user is focusing an input
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
                return;
            }

            const key = e.key;

            if (/[0-9]/.test(key)) {
                e.preventDefault();
                handleNumClick(parseInt(key));
            }
            if (['+', '-', '*', '/'].includes(key)) {
                e.preventDefault();
                handleOpClick(key);
            }
            if (key === 'Enter' || key === '=') {
                e.preventDefault();
                handleEqualClick();
            }
            if (key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            }
            if (key === 'Escape') {
                e.preventDefault();
                handleClear();
            }
            if (key === '.') {
                e.preventDefault();
                handleNumClick('.');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [display, equation, isNewNumber]);

    // --- WIDGET VISIBILITY & DRAGGING STATE (CALCULATOR) ---
    const [isCalcOpen, setIsCalcOpen] = useState(false);
    const [position, setPosition] = useState(null); // {x, y}
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const widgetRef = useRef(null);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        const rect = widgetRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (!position) setPosition({ x: rect.left, y: rect.top });
    };

    // --- WIDGET VISIBILITY & DRAGGING STATE (AVERAGE) ---
    const [isAvgOpen, setIsAvgOpen] = useState(false);
    const [avgPosition, setAvgPosition] = useState(null); // {x, y}
    const isAvgDragging = useRef(false);
    const avgDragOffset = useRef({ x: 0, y: 0 });
    const avgWidgetRef = useRef(null);

    const handleAvgMouseDown = (e) => {
        isAvgDragging.current = true;
        const rect = avgWidgetRef.current.getBoundingClientRect();
        avgDragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (!avgPosition) setAvgPosition({ x: rect.left, y: rect.top });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging.current) {
                e.preventDefault();
                setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
            }
            if (isAvgDragging.current) {
                e.preventDefault();
                setAvgPosition({ x: e.clientX - avgDragOffset.current.x, y: e.clientY - avgDragOffset.current.y });
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            isAvgDragging.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);


    // Currency Toggle
    const [avgCurrency, setAvgCurrency] = useState('USD');

    // Rate Calculations
    const binanceUsd = rates?.binance?.buy || 0;
    const bcvUsd = rates?.bcv?.rate || 0;

    // Live rate or fallback to latest history
    const liveBcvEur = rates?.bcv?.eurRate || 0;
    const historyBcvEur = (bcvHistory && bcvHistory.length > 0) ? (bcvHistory[bcvHistory.length - 1].eur || 0) : 0;
    const bcvEur = liveBcvEur > 0 ? liveBcvEur : historyBcvEur;

    // Calculate Euro Ratio (use BCV relation)
    const eurRatio = bcvUsd > 0 && bcvEur > 0 ? (bcvEur / bcvUsd) : 1.08; // Fallback to approx if missing

    // Determine displayed rates
    const currentBcv = avgCurrency === 'USD' ? bcvUsd : bcvEur;
    const currentBinance = avgCurrency === 'USD' ? binanceUsd : (binanceUsd * eurRatio);
    const averageRate = (currentBcv + currentBinance) / 2;

    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto min-h-screen relative">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Financial Tools</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsAvgOpen(!isAvgOpen)}
                        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all border shadow-lg ${isAvgOpen ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title={isAvgOpen ? "Close Average" : "Open Average Widget"}
                    >
                        <Scale size={24} />
                    </button>
                    <button
                        onClick={() => setIsCalcOpen(!isCalcOpen)}
                        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all border shadow-lg ${isCalcOpen ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title={isCalcOpen ? "Close Calculator" : "Open Calculator"}
                    >
                        <Calculator size={24} />
                    </button>
                </div>
            </div>

            {/* --- AVERAGE FLOATING WIDGET --- */}
            {isAvgOpen && (
                <div
                    ref={avgWidgetRef}
                    className={`fixed z-50 ${!avgPosition ? 'bottom-8 right-24 animate-in slide-in-from-bottom-10 fade-in duration-300' : ''}`}
                    style={avgPosition ? { left: avgPosition.x, top: avgPosition.y } : {}}
                    onMouseDown={handleAvgMouseDown}
                >
                    <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl shadow-2xl w-72 overflow-hidden cursor-move select-none backdrop-blur-xl">
                        {/* Header/Drag Handle */}
                        <div className="bg-slate-800/80 p-3 flex justify-between items-center border-b border-slate-700/50">
                            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Scale size={14} className="text-emerald-400" />
                                Tasa Promedio
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => setAvgCurrency(prev => prev === 'USD' ? 'EUR' : 'USD')}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors border border-slate-600"
                                >
                                    {avgCurrency}
                                </button>
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => setIsAvgOpen(false)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 cursor-default" onMouseDown={(e) => e.stopPropagation()}>

                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                                <div className="text-xs text-slate-400 mb-1">Promedio (Binance/BCV)</div>
                                <div className="text-2xl font-bold text-white font-mono">
                                    Bs {averageRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                                <div className="bg-slate-800/50 p-2 rounded-lg">
                                    <div className="mb-0.5">Binance {avgCurrency}</div>
                                    <div className="text-emerald-400 font-bold">{currentBinance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded-lg">
                                    <div className="mb-0.5">BCV {avgCurrency}</div>
                                    <div className="text-blue-400 font-bold">{currentBcv.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CENTERED P2P CALCULATOR --- */}
            <div className="bg-[#1E293B] border border-slate-700/50 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-40 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <h3 className="text-2xl font-bold text-gray-200 mb-2">
                        P2P Market Scanner
                    </h3>
                    <p className="text-slate-400">Scan offers across exchanges to find the best rates</p>
                </div>

                <form onSubmit={handleP2PCalculate} className="flex flex-col md:flex-row gap-4 items-end justify-center mb-10 relative z-10 max-w-2xl mx-auto">
                    <div className="w-full flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider text-left">Amount to Trade</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={calcAmount}
                                    onChange={(e) => setCalcAmount(e.target.value)}
                                    placeholder="Min 200..."
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-4 top-4 text-slate-500 font-bold">VES</span>
                            </div>
                        </div>

                        <div className="w-full md:w-1/3">
                            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider text-left">Payment Method</label>
                            <div className="relative">
                                <select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {VENEZUELA_BANKS.map(bank => (
                                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-5 text-slate-500 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={calcLoading}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-[62px] px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 w-full md:w-auto flex items-center justify-center shrink-0"
                    >
                        {calcLoading ? <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full"></div> : <Search size={24} />}
                    </button>
                </form>

                {calcResults ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 border-t border-slate-800 pt-8">
                        {/* BUY TABLE */}
                        <div>
                            <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center justify-between uppercase tracking-wide">
                                <span>Buying USDT</span>
                                <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">LOWEST</span>
                            </h3>
                            <div className="space-y-3">
                                {calcResults.buy.map((ad, i) => (
                                    <div key={i} className="flex flex-col p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-default group hover:shadow-lg hover:shadow-emerald-900/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-300 font-medium group-hover:text-white transition-colors truncate max-w-[120px]">{ad.advertiser}</span>
                                            <div className="text-right">
                                                <div className="font-mono text-emerald-300 font-bold text-lg">Bs {ad.price}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-wrap gap-1 mt-1 max-w-[70%]">
                                                {ad.methods?.slice(0, 3).map((method, idx) => (
                                                    <span key={idx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                        {method}
                                                    </span>
                                                ))}
                                                {ad.methods?.length > 3 && <span className="text-[10px] text-slate-500 px-1">+{ad.methods.length - 3}</span>}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-400 mb-0.5">Disp: {Number(ad.available).toLocaleString()} USDT</div>
                                                <div className="text-[10px] text-slate-500">{Number(ad.limitMin).toLocaleString()} VES - {Number(Math.min(ad.limitMax, ad.available * ad.price)).toLocaleString(undefined, { maximumFractionDigits: 2 })} VES</div>
                                                <div className="text-[9px] text-slate-600 font-mono">
                                                    (~${(ad.limitMin / ad.price).toFixed(2)} - ${(Math.min(ad.limitMax, ad.available * ad.price) / ad.price).toFixed(2)})
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SELL TABLE */}
                        <div>
                            <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center justify-between uppercase tracking-wide">
                                <span>Selling USDT</span>
                                <span className="bg-red-500/10 px-2 py-0.5 rounded text-[10px]">HIGHEST</span>
                            </h3>
                            <div className="space-y-3">
                                {calcResults.sell.map((ad, i) => (
                                    <div key={i} className="flex flex-col p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-red-500/30 transition-all cursor-default group hover:shadow-lg hover:shadow-red-900/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-300 font-medium group-hover:text-white transition-colors truncate max-w-[120px]">{ad.advertiser}</span>
                                            <div className="text-right">
                                                <div className="font-mono text-red-300 font-bold text-lg">Bs {ad.price}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-wrap gap-1 mt-1 max-w-[70%]">
                                                {ad.methods?.slice(0, 3).map((method, idx) => (
                                                    <span key={idx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                        {method}
                                                    </span>
                                                ))}
                                                {ad.methods?.length > 3 && <span className="text-[10px] text-slate-500 px-1">+{ad.methods.length - 3}</span>}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-400 mb-0.5">Disp: {Number(ad.available).toLocaleString()} USDT</div>
                                                <div className="text-[10px] text-slate-500">{Number(ad.limitMin).toLocaleString()} VES - {Number(Math.min(ad.limitMax, ad.available * ad.price)).toLocaleString(undefined, { maximumFractionDigits: 2 })} VES</div>
                                                <div className="text-[9px] text-slate-600 font-mono">
                                                    (~${(ad.limitMin / ad.price).toFixed(2)} - ${(Math.min(ad.limitMax, ad.available * ad.price) / ad.price).toFixed(2)})
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                        <div className="bg-slate-800/50 p-6 rounded-full mb-4">
                            <Search size={48} className="opacity-40" />
                        </div>
                        <p className="text-lg">Enter an amount to see the best rates</p>
                    </div>
                )}
            </div>

            {/* --- CALCULATOR FLOATING WIDGET --- */}
            {isCalcOpen && (
                <div
                    ref={widgetRef}
                    className={`fixed z-50 ${!position ? 'bottom-8 right-8 animate-in slide-in-from-bottom-10 fade-in duration-300' : ''}`}
                    style={position ? { left: position.x, top: position.y } : {}}
                >
                    <div className="relative bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden w-[320px]">

                        {/* Header / Drag Handle area */}
                        <div
                            onMouseDown={handleMouseDown}
                            className="bg-slate-800/50 px-4 py-3 flex justify-between items-center border-b border-slate-700 cursor-move active:cursor-grabbing select-none"
                        >
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Calculator size={14} /> Calculator
                            </span>
                            <button
                                onClick={() => setIsCalcOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 bg-[#1E293B]">
                            {/* Display */}
                            <div className="bg-[#0F172A] rounded-xl p-3 mb-4 text-right h-20 flex flex-col justify-end border border-slate-800 shadow-inner">
                                <div className="text-slate-500 text-xs h-5">{equation}</div>
                                <div className="text-white text-3xl font-mono font-light tracking-wide overflow-x-auto scrollbar-hide">{display}</div>
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-4 gap-2">
                                <CalcButton onClick={handleClear} className="col-span-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-lg h-12">AC</CalcButton>
                                <CalcButton onClick={handleBackspace} className="bg-slate-800 text-slate-400 hover:bg-slate-700 text-lg h-12"><Delete size={18} /></CalcButton>
                                <CalcButton onClick={() => handleOpClick('/')} className="bg-slate-700 text-blue-400 text-lg h-12">÷</CalcButton>

                                <CalcButton onClick={() => handleNumClick(7)} className="text-lg h-12">7</CalcButton>
                                <CalcButton onClick={() => handleNumClick(8)} className="text-lg h-12">8</CalcButton>
                                <CalcButton onClick={() => handleNumClick(9)} className="text-lg h-12">9</CalcButton>
                                <CalcButton onClick={() => handleOpClick('*')} className="bg-slate-700 text-blue-400 text-lg h-12">×</CalcButton>

                                <CalcButton onClick={() => handleNumClick(4)} className="text-lg h-12">4</CalcButton>
                                <CalcButton onClick={() => handleNumClick(5)} className="text-lg h-12">5</CalcButton>
                                <CalcButton onClick={() => handleNumClick(6)} className="text-lg h-12">6</CalcButton>
                                <CalcButton onClick={() => handleOpClick('-')} className="bg-slate-700 text-blue-400 text-lg h-12">-</CalcButton>

                                <CalcButton onClick={() => handleNumClick(1)} className="text-lg h-12">1</CalcButton>
                                <CalcButton onClick={() => handleNumClick(2)} className="text-lg h-12">2</CalcButton>
                                <CalcButton onClick={() => handleNumClick(3)} className="text-lg h-12">3</CalcButton>
                                <CalcButton onClick={() => handleOpClick('+')} className="bg-slate-700 text-blue-400 text-lg h-12">+</CalcButton>

                                <CalcButton onClick={() => handleNumClick(0)} className="col-span-2 rounded-xl text-lg h-12">0</CalcButton>
                                <CalcButton onClick={() => handleNumClick('.')} className="text-lg h-12">.</CalcButton>
                                <CalcButton onClick={handleEqualClick} className="bg-blue-600 text-white hover:bg-blue-500 border-none shadow-lg shadow-blue-500/20 text-lg h-12">=</CalcButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CalcButton = ({ children, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`h-14 rounded-full font-bold text-xl transition-all active:scale-95 flex items-center justify-center
        ${className.includes('bg-') ? '' : 'bg-slate-800 text-white hover:bg-slate-700'} 
        ${className}`}
    >
        {children}
    </button>
);

export default CalculatorView;
