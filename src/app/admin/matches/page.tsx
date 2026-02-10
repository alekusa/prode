'use client';

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { MatchEditor } from "@/components/admin/MatchEditor";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, RefreshCw, Check, X, Loader2 } from "lucide-react";

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
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [editingResultId, setEditingResultId] = useState<string | null>(null);
    const [inlineHomeScore, setInlineHomeScore] = useState<string>("");
    const [inlineAwayScore, setInlineAwayScore] = useState<string>("");
    const [isSavingResult, setIsSavingResult] = useState(false);

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/');
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setEditingResultId(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [profile, authLoading, router]);

    async function fetchMatches() {
        if (profile?.role !== 'admin') return;
        setIsLoadingMatches(true);
        try {
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
        } finally {
            setIsLoadingMatches(false);
        }
    }

    useEffect(() => {
        fetchMatches();
    }, [profile]);

    const handleEdit = (match: Match) => {
        // Extract only the base match fields (without nested team objects)
        const baseMatch: Database['public']['Tables']['matches']['Row'] = {
            id: match.id,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            start_time: match.start_time,
            round: match.round,
            status: match.status,
            home_score: match.home_score,
            away_score: match.away_score,
            created_at: match.created_at
        };
        setSelectedMatch(baseMatch as any);
        setIsEditing(true);

        // Scroll to top smoothly to show the edit form
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleCreate = () => {
        setSelectedMatch(null);
        setIsEditing(true);

        // Scroll to top smoothly to show the create form
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleSaved = () => {
        setIsEditing(false);
        fetchMatches();
    };

    const handleDelete = async (matchId: string) => {
        if (!confirm('¿Estás seguro de que querés eliminar este partido? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('matches')
                .delete()
                .eq('id', matchId);

            if (error) throw error;
            fetchMatches();
        } catch (error) {
            console.error('Error deleting match:', error);
            alert('Error al eliminar el partido');
        }
    };

    const handleClearAll = async () => {
        if (!confirm('!!! ATENCIÓN !!!\n¿Estás absolutamente seguro de que querés ELIMINAR TODOS los partidos de todas las fechas?\nEsta acción es irreversible y borrará todo el fixture actual.')) return;

        const confirmText = 'BORRAR TODO';
        const userInput = prompt(`Para confirmar, por favor escribí "${confirmText}" en mayúsculas:`);

        if (userInput !== confirmText) {
            alert('Confirmación incorrecta. No se borró nada.');
            return;
        }

        try {
            const { error } = await supabase
                .from('matches')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

            if (error) throw error;
            alert('Fixture eliminado correctamente.');
            fetchMatches();
        } catch (error) {
            console.error('Error clearing matches:', error);
            alert('Error al eliminar el fixture');
        }
    };

    const handleSyncCalendar = async () => {
        if (!confirm('¿Sincronizar TODOS los partidos con Google Calendar? Esto puede tardar unos segundos.')) return;

        setIsSyncing(true);
        try {
            const response = await fetch('/api/match/sync-all', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                alert(`Sincronización completada:\n${data.summary}`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Error de red al sincronizar');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveResult = async (matchId: string) => {
        const home = inlineHomeScore === "" ? null : parseInt(inlineHomeScore);
        const away = inlineAwayScore === "" ? null : parseInt(inlineAwayScore);

        if ((home !== null && home < 0) || (away !== null && away < 0)) {
            alert("Los resultados no pueden ser negativos");
            return;
        }

        setIsSavingResult(true);
        try {
            const { error } = await supabase
                .from('matches')
                .update({
                    home_score: home,
                    away_score: away,
                    status: 'finished'
                })
                .eq('id', matchId);

            if (error) throw error;
            setEditingResultId(null);
            fetchMatches();
        } catch (error) {
            console.error('Error saving result:', error);
            alert('Error al guardar el resultado');
        } finally {
            setIsSavingResult(false);
        }
    };

    const startEditingResult = (match: Match) => {
        setEditingResultId(match.id);
        setInlineHomeScore(match.home_score?.toString() || "");
        setInlineAwayScore(match.away_score?.toString() || "");
    };

    // Grouping logic memoized for performance
    const groupedMatches = useMemo(() => {
        return matches.reduce((acc, match) => {
            const round = match.round;
            if (!acc[round]) {
                acc[round] = [];
            }
            acc[round].push(match);
            return acc;
        }, {} as Record<number, Match[]>);
    }, [matches]);

    const sortedRounds = useMemo(() =>
        Object.keys(groupedMatches).map(Number).sort((a, b) => a - b),
        [groupedMatches]);

    // Determine if a round has passed (all matches finished or in the past)
    const isRoundPast = (round: number): boolean => {
        const roundMatches = groupedMatches[round] || [];
        if (roundMatches.length === 0) return false;

        const now = new Date();
        return roundMatches.every(match => {
            const matchDate = new Date(match.start_time);
            return matchDate < now || match.status === 'finished';
        });
    };

    // Initialize expanded state: expand only current/future rounds
    useEffect(() => {
        if (matches.length === 0) return;

        const now = new Date();
        const currentRounds = new Set<number>();

        sortedRounds.forEach(round => {
            const roundMatches = groupedMatches[round] || [];
            const isPast = roundMatches.every(match => {
                const matchDate = new Date(match.start_time);
                return matchDate < now || match.status === 'finished';
            });

            if (!isPast) {
                currentRounds.add(round);
            }
        });

        // Only expand the earliest future round if there are many, to avoid heavy initial render
        if (currentRounds.size > 2) {
            const firstFuture = Math.min(...Array.from(currentRounds));
            setExpandedRounds(new Set([firstFuture]));
        } else {
            setExpandedRounds(currentRounds);
        }
    }, [matches, sortedRounds, groupedMatches]);

    const toggleRound = (round: number) => {
        setExpandedRounds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(round)) {
                newSet.delete(round);
            } else {
                newSet.add(round);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white">Gestión de Partidos</h1>
                    <p className="text-gray-400 text-sm">Administrá el fixture y cargá resultados reales.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 font-bold hover:bg-red-500/20 transition-all shadow-lg text-sm"
                    >
                        <Trash2 size={18} />
                        Limpiar Todo
                    </button>
                    <button
                        onClick={handleSyncCalendar}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 font-bold hover:bg-green-500/20 transition-all shadow-lg text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Calendar'}
                    </button>
                    <ScoringButton />
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-argentina-blue text-navy-950 font-black hover:bg-argentina-blue/90 transition-colors shadow-lg text-sm"
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
                {isLoadingMatches && (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-10 h-10 text-argentina-blue animate-spin" />
                        <p className="text-gray-500 font-medium animate-pulse">Cargando partidos...</p>
                    </div>
                )}

                {!isLoadingMatches && sortedRounds.length === 0 && !isEditing && (
                    <div className="glass-panel p-12 text-center text-gray-500 rounded-2xl border border-white/5">
                        No hay partidos cargados.
                    </div>
                )}

                {sortedRounds.map((round) => {
                    const isPast = isRoundPast(round);
                    const isExpanded = expandedRounds.has(round);

                    return (
                        <div key={round} className="space-y-4">
                            <button
                                onClick={() => toggleRound(round)}
                                className="w-full flex items-center gap-4 px-2 hover:opacity-80 transition-opacity cursor-pointer group"
                            >
                                <h2 className={`text-xl font-black uppercase tracking-widest ${isPast ? 'text-gray-500' : 'text-argentina-blue'}`}>
                                    Fecha {round}
                                </h2>
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                    {groupedMatches[round].length} Partidos
                                </span>
                                {isExpanded ? (
                                    <ChevronUp size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                ) : (
                                    <ChevronDown size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                )}
                            </button>

                            {isExpanded && (
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
                                                <tr key={match.id} className={`hover:bg-white/5 transition-all ${editingResultId === match.id ? 'bg-argentina-blue/5 border-y border-argentina-blue/30' : ''}`}>
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
                                                        {editingResultId === match.id ? (
                                                            <div className="flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-200">
                                                                <div className="relative group/input">
                                                                    <input
                                                                        type="number"
                                                                        value={inlineHomeScore}
                                                                        onChange={(e) => setInlineHomeScore(e.target.value)}
                                                                        className="w-14 bg-navy-900 border-2 border-white/10 rounded-xl px-2 py-2 text-center font-black text-white text-xl focus:outline-none focus:border-argentina-blue focus:ring-4 focus:ring-argentina-blue/20 transition-all disabled:opacity-50"
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveResult(match.id)}
                                                                        autoFocus
                                                                        disabled={isSavingResult}
                                                                        min="0"
                                                                        placeholder="0"
                                                                    />
                                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 uppercase opacity-0 group-hover/input:opacity-100 transition-opacity whitespace-nowrap">Local</div>
                                                                </div>

                                                                <span className="text-argentina-blue font-black text-xl animate-pulse">:</span>

                                                                <div className="relative group/input">
                                                                    <input
                                                                        type="number"
                                                                        value={inlineAwayScore}
                                                                        onChange={(e) => setInlineAwayScore(e.target.value)}
                                                                        className="w-14 bg-navy-900 border-2 border-white/10 rounded-xl px-2 py-2 text-center font-black text-white text-xl focus:outline-none focus:border-argentina-blue focus:ring-4 focus:ring-argentina-blue/20 transition-all disabled:opacity-50"
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveResult(match.id)}
                                                                        disabled={isSavingResult}
                                                                        min="0"
                                                                        placeholder="0"
                                                                    />
                                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 uppercase opacity-0 group-hover/input:opacity-100 transition-opacity whitespace-nowrap">Visitante</div>
                                                                </div>

                                                                <div className="flex gap-1.5 ml-2">
                                                                    <button
                                                                        onClick={() => handleSaveResult(match.id)}
                                                                        disabled={isSavingResult}
                                                                        className="p-2 rounded-xl bg-green-500 text-navy-950 hover:bg-green-400 hover:scale-110 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                                                                        title="Guardar y finalizar"
                                                                    >
                                                                        {isSavingResult ? <RefreshCw size={16} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingResultId(null)}
                                                                        disabled={isSavingResult}
                                                                        className="p-2 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-all disabled:opacity-50"
                                                                        title="Cancelar (Esc)"
                                                                    >
                                                                        <X size={18} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={() => startEditingResult(match)}
                                                                className="inline-flex items-center justify-center gap-3 bg-navy-950/50 px-4 py-2 rounded-xl border border-white/5 font-mono font-black text-white text-xl cursor-pointer hover:border-argentina-blue/50 hover:bg-navy-900 transition-all group relative overflow-hidden active:scale-95"
                                                            >
                                                                <div className="absolute inset-0 bg-argentina-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <span className={match.home_score === null ? 'text-white/20' : ''}>
                                                                    {match.home_score ?? '0'}
                                                                </span>
                                                                <span className="text-argentina-blue/30">:</span>
                                                                <span className={match.away_score === null ? 'text-white/20' : ''}>
                                                                    {match.away_score ?? '0'}
                                                                </span>
                                                                <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                                    <Edit2 size={10} className="text-argentina-blue" />
                                                                </div>
                                                            </div>
                                                        )}
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
                                                                onClick={() => handleDelete(match.id)}
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
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
