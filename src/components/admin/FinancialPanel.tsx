'use client';

import { useState, useEffect } from 'react';
import { DollarSign, BarChart3, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

type RoundStat = {
    round: number;
    total: number;
    manual: number;
    real: number;
};

type Transaction = {
    round: number;
    amount: number;
    type: 'manual' | 'real';
};

export function FinancialPanel() {
    const [stats, setStats] = useState<RoundStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ total: 0, manual: 0, real: 0 });

    useEffect(() => {
        fetchFinancials();
    }, []);

    async function fetchFinancials() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/financials');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch');

            const txs = data as Transaction[];

            const grouped: Record<number, RoundStat> = {};
            let tTotal = 0, tManual = 0, tReal = 0;

            txs.forEach(tx => {
                const r = tx.round || 0;
                if (!grouped[r]) {
                    grouped[r] = { round: r, total: 0, manual: 0, real: 0 };
                }
                const amount = Number(tx.amount);
                grouped[r].total += amount;
                tTotal += amount;

                if (tx.type === 'manual') {
                    grouped[r].manual += amount;
                    tManual += amount;
                } else {
                    grouped[r].real += amount;
                    tReal += amount;
                }
            });

            setStats(Object.values(grouped).sort((a, b) => b.round - a.round));
            setTotals({ total: tTotal, manual: tManual, real: tReal });
        } catch (error) {
            console.error('Error fetching financials:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/5">
                <Loader2 className="w-8 h-8 text-argentina-blue animate-spin" />
                <p className="text-gray-500 font-medium">Cargando datos financieros...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <TrendingUp size={20} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Resumen Financiero</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} />
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total Recaudado</p>
                    <p className="text-4xl font-black text-white">${totals.total.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                            <TrendingUp size={12} />
                            Global
                        </span>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={64} />
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Cargas Manuales</p>
                    <p className="text-4xl font-black text-orange-400">${totals.manual.toLocaleString()}</p>
                    <p className="mt-4 text-[10px] text-gray-500 uppercase font-black">Admin Panel</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight size={64} />
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">MercadoPago</p>
                    <p className="text-4xl font-black text-argentina-blue">${totals.real.toLocaleString()}</p>
                    <p className="mt-4 text-[10px] text-gray-500 uppercase font-black">Pagos Reales</p>
                </div>
            </div>

            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Manual</th>
                            <th className="px-6 py-4">Real (MP)</th>
                            <th className="px-6 py-4 text-right">Detalle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {stats.map((s) => (
                            <tr key={s.round} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-white font-black">FECHA {s.round === 0 ? 'Sin Asignar' : s.round}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-lg font-bold text-white">${s.total.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-orange-400/80 font-medium">${s.manual.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-argentina-blue/80 font-medium">${s.real.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase bg-white/5 px-2 py-1 rounded-md">
                                        <BarChart3 size={10} />
                                        Estadísticas
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium italic">
                                    No hay transacciones registradas hasta el momento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
