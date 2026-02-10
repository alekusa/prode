'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Trophy, ChevronLeft, Save, Plus, Minus, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { calculatePointsForMatch, refreshAllUserPoints } from '@/services/scoring';

interface MatchWithTeams {
    id: string;
    home_team: { name: string; short_name: string };
    away_team: { name: string; short_name: string };
    start_time: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
}

export default function MobileMatchReport() {
    const { id } = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [match, setMatch] = useState<MatchWithTeams | null>(null);
    const [homeScore, setHomeScore] = useState<number>(0);
    const [awayScore, setAwayScore] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'editing' | 'saving' | 'processing' | 'success' | 'error'>('editing');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const { data, error } = await supabase
                    .from('matches')
                    .select(`
                        id,
                        home_score,
                        away_score,
                        status,
                        start_time,
                        home_team:teams!home_team_id(name, short_name),
                        away_team:teams!away_team_id(name, short_name)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                const matchData = data as any;
                setMatch(matchData);
                setHomeScore(matchData.home_score ?? 0);
                setAwayScore(matchData.away_score ?? 0);
            } catch (err: any) {
                console.error("Error fetching match:", err);
                setError("No se pudo cargar el partido");
                setStatus('error');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMatch();
    }, [id]);

    const handleSave = async () => {
        if (!id || !user) return;

        setStatus('saving');
        setSaving(true);
        setError(null);

        try {
            // 1. Update Match Result
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    home_score: homeScore,
                    away_score: awayScore,
                    status: 'finished'
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // 2. Process Points
            setStatus('processing');
            await calculatePointsForMatch(id as string);
            await refreshAllUserPoints();

            setStatus('success');
            setTimeout(() => {
                router.push('/admin/matches');
            }, 3000);
        } catch (err: any) {
            console.error("Error saving result:", err);
            setError(err.message || "Error al guardar el resultado");
            setStatus('error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-navy-950">
                <Loader2 className="w-12 h-12 text-argentina-blue animate-spin mb-4" />
                <p className="text-gray-400 animate-pulse font-bold tracking-widest uppercase text-xs">Cargando Partido...</p>
            </div>
        );
    }

    if (!match) return null;

    return (
        <div className="min-h-screen bg-navy-950 text-white font-sans p-4 safe-top">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 pt-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={32} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-argentina-blue uppercase tracking-[0.2em] mb-1">Carga de Resultado</span>
                    <h1 className="text-sm font-black text-white/50">{new Date(match.start_time).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}hs</h1>
                </div>
                <div className="w-8" /> {/* Spacer */}
            </header>

            <main className="max-w-md mx-auto space-y-8">
                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white">¡Resultado Guardado!</h2>
                        <p className="text-gray-400">Los puntos han sido procesados correctamente. Volviendo a la lista...</p>
                    </div>
                ) : (
                    <>
                        {/* Score Inputs */}
                        <div className="grid grid-cols-1 gap-12 py-4">
                            {/* Home Team */}
                            <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-argentina-blue/10 blur-[60px] rounded-full -mr-10 -mt-10" />
                                <div className="relative flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-navy-900 rounded-3xl border-2 border-white/10 flex items-center justify-center text-4xl font-black text-argentina-blue shadow-2xl">
                                        {match.home_team.short_name}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tight">{match.home_team.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local</p>
                                    </div>

                                    {/* Control */}
                                    <div className="flex items-center gap-8 pt-4">
                                        <button
                                            onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                                            className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-white active:scale-90 active:bg-red-500/20 active:border-red-500/30 transition-all"
                                        >
                                            <Minus size={24} />
                                        </button>
                                        <span className="text-7xl font-black text-white tabular-nums min-w-[1.2em]">{homeScore}</span>
                                        <button
                                            onClick={() => setHomeScore(homeScore + 1)}
                                            className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-white active:scale-90 active:bg-green-500/20 active:border-green-500/30 transition-all"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Away Team */}
                            <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 relative overflow-hidden group">
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full -mr-10 -mb-10" />
                                <div className="relative flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-navy-900 rounded-3xl border-2 border-white/10 flex items-center justify-center text-4xl font-black text-gray-400 shadow-2xl">
                                        {match.away_team.short_name}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tight">{match.away_team.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Visitante</p>
                                    </div>

                                    {/* Control */}
                                    <div className="flex items-center gap-8 pt-4">
                                        <button
                                            onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                                            className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-white active:scale-90 active:bg-red-500/20 active:border-red-500/30 transition-all"
                                        >
                                            <Minus size={24} />
                                        </button>
                                        <span className="text-7xl font-black text-white tabular-nums min-w-[1.2em]">{awayScore}</span>
                                        <button
                                            onClick={() => setAwayScore(awayScore + 1)}
                                            className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-white active:scale-90 active:bg-green-500/20 active:border-green-500/30 transition-all"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 animate-in slide-in-from-bottom-2 duration-300">
                                <AlertCircle size={20} />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-4 pb-12">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`
                                    w-full py-6 rounded-[32px] font-black text-xl tracking-tight shadow-2xl transition-all flex items-center justify-center gap-3
                                    ${saving
                                        ? 'bg-navy-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-argentina-blue text-navy-950 hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(117,170,219,0.3)]'}
                                `}
                            >
                                {status === 'saving' && <Loader2 className="animate-spin" size={24} />}
                                {status === 'processing' && <Loader2 className="animate-spin" size={24} />}
                                {status === 'editing' && <Save size={24} />}

                                {status === 'saving' ? 'Guardando Resultado...' :
                                    status === 'processing' ? 'Procesando Puntos...' :
                                        'Finalizar Partido'}
                            </button>
                            <p className="text-center text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-[0.2em]">
                                Esto actualizará la tabla de posiciones automáticamente
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
