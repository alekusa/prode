'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, ChevronLeft, ChevronRight, Hash, Loader2 } from "lucide-react";

type Profile = {
    id: string;
    username: string | null;
    points: number;
    avatar_url: string | null;
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [rounds, setRounds] = useState<number[]>([]);
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingRounds, setLoadingRounds] = useState(true);

    // 1. Fetch available rounds
    useEffect(() => {
        async function fetchRounds() {
            setLoadingRounds(true);
            const { data } = await supabase
                .from('matches')
                .select('round')
                .order('round', { ascending: true });

            if (data) {
                const uniqueRounds = Array.from(new Set(data.map(m => m.round)));
                setRounds(uniqueRounds);
                // Select latest round by default
                if (uniqueRounds.length > 0) {
                    setSelectedRound(uniqueRounds[uniqueRounds.length - 1]);
                }
            }
            setLoadingRounds(false);
        }
        fetchRounds();
    }, []);

    // 2. Fetch specific round leaderboard
    useEffect(() => {
        if (selectedRound === null) return;

        async function fetchLeaderboard() {
            setLoading(true);
            try {
                // Fetch predictions for this round that have points awarded
                const { data: predictions, error } = await supabase
                    .from('predictions')
                    .select(`
                        user_id,
                        points_awarded,
                        match:matches!inner(round)
                    `)
                    .eq('match.round', selectedRound)
                    .not('points_awarded', 'is', null);

                if (error) throw error;

                // Group points by user
                const userPoints: Record<string, number> = {};
                predictions.forEach(p => {
                    userPoints[p.user_id] = (userPoints[p.user_id] || 0) + (p.points_awarded || 0);
                });

                // Fetch profiles for these users
                const userIds = Object.keys(userPoints);
                if (userIds.length === 0) {
                    setUsers([]);
                    return;
                }

                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                if (profileError) throw profileError;

                // Combine and sort
                const combined = profiles.map(profile => ({
                    ...profile,
                    points: userPoints[profile.id] || 0
                })).sort((a, b) => b.points - a.points);

                setUsers(combined);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Error fetching leaderboard:", err);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, [selectedRound]);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="text-yellow-400" size={24} />;
        if (index === 1) return <Medal className="text-gray-300" size={24} />;
        if (index === 2) return <Medal className="text-amber-700" size={24} />;
        return <span className="text-lg font-bold text-gray-500 font-mono w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-argentina-blue/10 border border-argentina-blue/20 text-argentina-blue text-xs font-bold uppercase tracking-widest mb-2">
                    <Trophy size={14} />
                    Competencia por Fecha
                </div>
                <h1 className="text-5xl font-black text-white tracking-tight">Tabla de Posiciones</h1>
                <p className="text-gray-400 max-w-md mx-auto">
                    Demostrá quién sabe más de fútbol en cada fecha del torneo argentino.
                </p>
            </div>

            {/* Round Selector */}
            <div className="flex justify-center items-center gap-4">
                {!loadingRounds && rounds.length > 0 && (
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-xl">
                        {rounds.map((r) => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                className={`
                                    px-6 py-2 rounded-xl font-bold transition-all duration-300
                                    ${selectedRound === r
                                        ? 'bg-argentina-blue text-navy-950 shadow-lg scale-105'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                Fecha {r}
                            </button>
                        ))}
                    </div>
                )}
                {loadingRounds && <Loader2 className="animate-spin text-argentina-blue" />}
            </div>

            <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-2xl relative">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-argentina-blue to-transparent opacity-50" />

                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-argentina-blue animate-spin" />
                        <p className="text-gray-500 font-medium animate-pulse">Calculando posiciones de la Fecha {selectedRound}...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5 text-center w-24">Posición</th>
                                    <th className="px-8 py-5">Participante</th>
                                    <th className="px-8 py-5 text-right w-32">Puntos Ganados</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user, index) => (
                                    <tr key={user.id} className={`
                                        group hover:bg-white/[0.03] transition-colors
                                        ${index === 0 ? 'bg-yellow-500/[0.03]' : ''}
                                    `}>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center items-center">
                                                {getRankIcon(index)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-navy-900 border border-white/10 flex items-center justify-center font-black text-argentina-blue text-xl shadow-inner group-hover:border-argentina-blue/30 transition-colors">
                                                    {user.username ? user.username[0].toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-lg leading-tight">
                                                        {user.username || 'Usuario Anónimo'}
                                                    </p>
                                                    {index === 0 && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-tighter">
                                                            Ganador Provisorio
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-3xl font-black ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                                    {user.points}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">puntos</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && users.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                            <Hash size={40} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-bold text-xl">Sin datos aún</p>
                            <p className="text-gray-500 max-w-xs mx-auto">
                                No se encontraron predicciones procesadas para la Fecha {selectedRound}.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Hint for users */}
            <div className="text-center">
                <p className="text-gray-600 text-sm italic">
                    * Los puntos se habilitan una vez que el administrador finaliza el cálculo de la fecha.
                </p>
            </div>
        </div>
    );
}
