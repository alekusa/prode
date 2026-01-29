'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { MatchEditor } from "@/components/admin/MatchEditor";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2 } from "lucide-react";

import { ScoringButton } from "@/components/admin/ScoringButton";

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

export default function AdminMatchesPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/');
        }
    }, [profile, authLoading, router]);

    async function fetchMatches() {
        if (profile?.role !== 'admin') return;
        const { data } = await supabase
            .from('matches')
            .select(`
                *,
                home_team:teams!home_team_id(*),
                away_team:teams!away_team_id(*)
            `)
            .order('round', { ascending: true })
            .order('start_time', { ascending: true });

        if (data) setMatches(data as any);
    }

    useEffect(() => {
        fetchMatches();
    }, [profile]);

    const handleEdit = (match: Match) => {
        setSelectedMatch(match);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setSelectedMatch(null);
        setIsEditing(true);
    };

    const handleSaved = () => {
        setIsEditing(false);
        fetchMatches();
    };

    // Grouping logic
    const groupedMatches = matches.reduce((acc, match) => {
        const round = match.round;
        if (!acc[round]) {
            acc[round] = [];
        }
        acc[round].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const sortedRounds = Object.keys(groupedMatches).map(Number).sort((a, b) => a - b);

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white">Gestión de Partidos</h1>
                    <p className="text-gray-400 text-sm">Administrá el fixture y cargá resultados reales.</p>
                </div>
                <div className="flex gap-3">
                    <ScoringButton />
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-argentina-blue text-navy-950 font-bold hover:bg-argentina-blue/90 transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        Nuevo Partido
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="mb-8">
                    <MatchEditor
                        existingMatch={selectedMatch}
                        onSaved={handleSaved}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            )}

            <div className="space-y-10">
                {sortedRounds.length === 0 && !isEditing && (
                    <div className="glass-panel p-12 text-center text-gray-500 rounded-2xl border border-white/5">
                        No hay partidos cargados.
                    </div>
                )}

                {sortedRounds.map((round) => (
                    <div key={round} className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                            <h2 className="text-xl font-black text-argentina-blue uppercase tracking-widest">
                                Fecha {round}
                            </h2>
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                                {groupedMatches[round].length} Partidos
                            </span>
                        </div>

                        <div className="glass-panel overflow-hidden rounded-2xl border border-white/5 shadow-xl">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Horario</th>
                                        <th className="px-6 py-4 text-right">Local</th>
                                        <th className="px-6 py-4 text-center w-32">Resultado</th>
                                        <th className="px-6 py-4">Visitante</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {groupedMatches[round].map((match) => (
                                        <tr key={match.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-white font-bold">
                                                    {new Date(match.start_time).toLocaleDateString()}
                                                </span><br />
                                                <span className="text-[10px] opacity-50">
                                                    {new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-white">
                                                {match.home_team.name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center gap-2 bg-navy-950 px-3 py-1.5 rounded-lg border border-white/10 font-mono font-black text-white text-lg">
                                                    {match.home_score ?? '-'}
                                                    <span className="text-white/20">:</span>
                                                    {match.away_score ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                {match.away_team.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider
                                                    ${match.status === 'finished' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        match.status === 'live' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-white/5 text-gray-400 border border-white/10'
                                                    }
                                                `}>
                                                    {match.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEdit(match)}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
