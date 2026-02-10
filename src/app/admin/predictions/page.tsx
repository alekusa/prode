'use client';

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Printer, ChevronRight, Trophy, Clock, User, Hash } from "lucide-react";
import { Database } from "@/types/database";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: { name: string; short_name: string };
    away_team: { name: string; short_name: string };
};
type Prediction = Database['public']['Tables']['predictions']['Row'] & {
    match: Match;
};

export default function AdminPredictionsPage() {
    const [rounds, setRounds] = useState<number[]>([]);
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [users, setUsers] = useState<Profile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Fetch available rounds
    useEffect(() => {
        async function fetchRounds() {
            const { data } = await supabase
                .from('matches')
                .select('round')
                .order('round', { ascending: true });

            if (data) {
                const uniqueRounds = Array.from(new Set(data.map(m => m.round)));
                setRounds(uniqueRounds);
                // Select latest round by default or the first one
                if (uniqueRounds.length > 0) {
                    setSelectedRound(uniqueRounds[uniqueRounds.length - 1]);
                }
            }
        }
        fetchRounds();
    }, []);

    // Fetch users list when round changes
    useEffect(() => {
        if (selectedRound === null) return;

        async function fetchUsers() {
            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .order('points', { ascending: false });

            if (data) setUsers(data);
            setLoading(false);
        }
        fetchUsers();
    }, [selectedRound]);

    // Fetch detailed predictions for selected user
    useEffect(() => {
        if (!selectedUserId || selectedRound === null) {
            setPredictions([]);
            return;
        }

        async function fetchUserPredictions() {
            setDetailsLoading(true);
            const { data, error } = await supabase
                .from('predictions')
                .select(`
                    *,
                    match:matches!inner(
                        *,
                        home_team:teams!home_team_id(name, short_name),
                        away_team:teams!away_team_id(name, short_name)
                    )
                `)
                .eq('user_id', selectedUserId)
                .eq('match.round', selectedRound);

            if (data) setPredictions(data as any);
            setDetailsLoading(false);
        }
        fetchUserPredictions();
    }, [selectedUserId, selectedRound]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const selectedUser = useMemo(() =>
        users.find(u => u.id === selectedUserId),
        [users, selectedUserId]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white">Predicciones de Usuarios</h1>
                    <p className="text-gray-400 text-sm">Monitoreá y validá las jugadas de todos los participantes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <select
                            value={selectedRound || ""}
                            onChange={(e) => {
                                setSelectedRound(Number(e.target.value));
                                setSelectedUserId(null);
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue appearance-none min-w-[120px]"
                        >
                            {rounds.map(r => (
                                <option key={r} value={r}>Fecha {r}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List - Hidden on Print */}
                <div className="lg:col-span-1 space-y-4 print:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue transition-all"
                        />
                    </div>

                    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden h-[calc(100vh-250px)] overflow-y-auto">
                        {loading && (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-argentina-blue mx-auto mb-4"></div>
                                <p className="text-gray-500 text-sm">Cargando usuarios...</p>
                            </div>
                        )}

                        {!loading && filteredUsers.length === 0 && (
                            <div className="p-8 text-center text-gray-500 italic">
                                No se encontraron usuarios.
                            </div>
                        )}

                        <div className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUserId(user.id)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors text-left
                                        ${selectedUserId === user.id ? 'bg-argentina-blue/10 border-l-4 border-argentina-blue' : 'hover:bg-white/5 border-l-4 border-transparent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center text-argentina-blue font-bold">
                                            {user.username?.[0].toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm truncate max-w-[150px]">{user.username}</p>
                                            <p className="text-gray-500 text-xs truncate max-w-[150px]">{user.full_name}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={selectedUserId === user.id ? 'text-argentina-blue' : 'text-gray-700'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Predictions Detail */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedUserId ? (
                        <div className="glass-panel p-12 text-center text-gray-500 rounded-2xl border border-white/5 h-full flex flex-col items-center justify-center space-y-4 print:hidden">
                            <User size={48} className="opacity-20" />
                            <p>Seleccioná un usuario para ver sus predicciones de la Fecha {selectedRound}.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Profile Info Summary */}
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden print:border-none print:shadow-none print:bg-none print:p-0">
                                {/* Print Background Decor */}
                                <Trophy className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 -rotate-12 print:hidden" />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="h-16 w-16 rounded-2xl bg-argentina-blue text-navy-950 flex items-center justify-center text-2xl font-black shadow-xl print:h-12 print:w-12 print:text-xl">
                                        {selectedUser?.username?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white print:text-navy-950 print:text-3xl">{selectedUser?.full_name}</h2>
                                        <div className="flex items-center gap-3 text-sm mt-1">
                                            <span className="text-argentina-blue font-bold print:text-navy-950">@{selectedUser?.username}</span>
                                            <span className="text-gray-500 flex items-center gap-1 print:hidden">
                                                <Trophy size={14} />
                                                {selectedUser?.points} pts totales
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white border border-white/10 font-bold hover:bg-white/10 transition-all print:hidden"
                                >
                                    <Printer size={18} />
                                    Imprimir PDF
                                </button>
                            </div>

                            {/* Print Metadata Header - ONLY SHOWN ON PRINT */}
                            <div className="hidden print:block border-b-2 border-slate-200 pb-4 mb-8 mt-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Comprobante de Jugada</p>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">Prode Argentina 2026</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-800">FECHA {selectedRound}</p>
                                        <p className="text-[10px] text-slate-400">{new Date().toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Predictions Table */}
                            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl print:border-2 print:border-slate-100 print:shadow-none">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-wider print:bg-slate-50 print:text-slate-500 print:border-b">
                                        <tr>
                                            <th className="px-6 py-4">Partido</th>
                                            <th className="px-6 py-4 text-center">Predicción</th>
                                            <th className="px-6 py-4 text-center">Puntos</th>
                                            <th className="px-6 py-4 text-right print:hidden">Horario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-300 print:divide-slate-100 print:text-slate-800">
                                        {detailsLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-argentina-blue mx-auto mb-2"></div>
                                                    <p className="text-xs text-gray-500">Cargando jugadas...</p>
                                                </td>
                                            </tr>
                                        ) : predictions.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                                    No se encontraron predicciones para este usuario en la Fecha {selectedRound}.
                                                </td>
                                            </tr>
                                        ) : (
                                            predictions.map((pred) => (
                                                <tr key={pred.id} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white print:text-slate-900">
                                                                {pred.match.home_team.name} vs {pred.match.away_team.name}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 uppercase print:text-slate-400">
                                                                {pred.match.status} {pred.match.home_score !== null ? `(${pred.match.home_score}-${pred.match.away_score})` : ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex items-center gap-2 bg-navy-950 px-4 py-1.5 rounded-lg border border-white/10 font-black text-white text-lg print:bg-transparent print:border-slate-200 print:text-slate-900 print:px-2">
                                                            {pred.home_score}
                                                            <span className="text-white/20 print:text-slate-300">-</span>
                                                            {pred.away_score}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {pred.points_awarded !== null ? (
                                                            <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold text-xs border border-green-500/20 print:bg-green-100 print:text-green-700 print:border-none">
                                                                <Trophy size={10} />
                                                                +{pred.points_awarded}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600 font-mono text-xs print:text-slate-300">Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right print:hidden">
                                                        <div className="flex flex-col items-end opacity-50 text-[10px]">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {new Date(pred.match.start_time).toLocaleDateString()}
                                                            </span>
                                                            <span>{new Date(pred.match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Print-only Footer */}
                            <div className="hidden print:block mt-12 pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400">
                                <p>Este documento es un comprobante de jugada generado automáticamente.</p>
                                <p>© 2026 Prode Argentina Admin Panel</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 20mm;
                        size: A4;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    .glass-panel {
                        background: none !important;
                        backdrop-filter: none !important;
                        border: none !important;
                        box-shadow: none !important;
                        color: black !important;
                    }
                    nav, button, aside, .print-hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
