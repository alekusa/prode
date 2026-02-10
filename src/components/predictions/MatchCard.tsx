'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { Check, Loader2, Trophy, Clock, AlertCircle } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

type Prediction = Database['public']['Tables']['predictions']['Row'];

interface MatchCardProps {
    match: Match;
    userPrediction?: Prediction | null;
}

export function MatchCard({ match, userPrediction }: MatchCardProps) {
    const { user } = useAuth();
    const [homeScore, setHomeScore] = useState<string>(userPrediction?.home_score?.toString() ?? '');
    const [awayScore, setAwayScore] = useState<string>(userPrediction?.away_score?.toString() ?? '');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Parse date and check deadline
    const matchDate = new Date(match.start_time);
    const dateStr = matchDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    const timeStr = matchDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Business Logic: Lock 5 minutes before start
    const fiveMinutesInMs = 5 * 60 * 1000;
    // During SSR or before mounting, we don't know the exact "now", so we default to stable false
    const isPastDeadline = hasMounted ? new Date().getTime() > (matchDate.getTime() - fiveMinutesInMs) : false;

    const isLocked = match.status !== 'scheduled' || isPastDeadline;
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';

    const handleSave = async () => {
        if (!user || isLocked) return;
        if (homeScore === '' || awayScore === '') return;

        setLoading(true);
        setSaved(false);
        const predictionData = {
            user_id: user.id,
            match_id: match.id,
            home_score: Math.max(0, parseInt(homeScore)),
            away_score: Math.max(0, parseInt(awayScore)),
        };

        try {
            const { error } = await supabase
                .from('predictions')
                .upsert(predictionData, { onConflict: 'user_id, match_id' });

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving prediction:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative group transition-all duration-300 ${isLocked ? 'opacity-90' : 'hover:-translate-y-1'}`}>
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative glass-panel rounded-2xl overflow-hidden border border-white/10 bg-navy-900/60 backdrop-blur-xl shadow-2xl">
                {/* Header: Status and Metadata */}
                <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {isLive ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">En Vivo</span>
                            </div>
                        ) : isFinished ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-500/10 border border-white/10">
                                <Clock size={10} className="text-gray-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Finalizado</span>
                            </div>
                        ) : match.status === 'postponed' ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                <AlertCircle size={10} className="text-yellow-500" />
                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">Postergado</span>
                            </div>
                        ) : isLocked ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                                <Clock size={10} className="text-orange-500" />
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Pronóstico Cerrado</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-argentina-blue/10 border border-argentina-blue/20">
                                <Clock size={10} className="text-argentina-blue" />
                                <span className="text-[10px] font-black text-argentina-blue uppercase tracking-wider">Próximamente</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {hasMounted ? (
                            <>
                                <span>{dateStr}</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span>{timeStr}hs</span>
                            </>
                        ) : (
                            <span className="animate-pulse">Cargando...</span>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Teams and Score Section */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-3 w-1/3 group/team">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-white/5 rounded-full blur-md opacity-0 group-hover/team:opacity-100 transition-opacity" />
                                <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-white/5 p-3 shadow-inner transform group-hover/team:scale-105 transition-transform">
                                    {match.home_team.badge_url ? (
                                        <img src={match.home_team.badge_url} alt={match.home_team.name} className="w-full h-full object-contain drop-shadow-md" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-navy-800 rounded-xl text-xs font-black text-white/20">
                                            {match.home_team.short_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs md:text-sm font-black text-white text-center leading-tight h-10 flex items-center justify-center">
                                {match.home_team.name}
                            </span>
                        </div>

                        {/* Score Inputs / Result Display */}
                        <div className="flex flex-col items-center justify-center gap-3">
                            {isLocked ? (
                                <div className="flex items-center justify-center gap-3">
                                    <span className={`text-4xl font-black tabular-nums transition-colors ${match.home_score! > match.away_score! ? 'text-argentina-gold drop-shadow-[0_0_10px_rgba(184,152,86,0.5)]' : 'text-white'}`}>
                                        {match.home_score ?? 0}
                                    </span>
                                    <div className="w-px h-8 bg-white/10" />
                                    <span className={`text-4xl font-black tabular-nums transition-colors ${match.away_score! > match.home_score! ? 'text-argentina-gold drop-shadow-[0_0_10px_rgba(184,152,86,0.5)]' : 'text-white'}`}>
                                        {match.away_score ?? 0}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={homeScore}
                                            onChange={(e) => setHomeScore(e.target.value)}
                                            disabled={loading || !user}
                                            placeholder="-"
                                            min="0"
                                            className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl font-black bg-navy-950 border-2 border-white/5 rounded-2xl focus:border-argentina-blue focus:ring-0 transition-all outline-none placeholder:text-navy-800 text-white"
                                        />
                                    </div>
                                    <span className="text-gray-700 font-black text-xl">:</span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={awayScore}
                                            onChange={(e) => setAwayScore(e.target.value)}
                                            disabled={loading || !user}
                                            placeholder="-"
                                            min="0"
                                            className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl font-black bg-navy-950 border-2 border-white/5 rounded-2xl focus:border-argentina-blue focus:ring-0 transition-all outline-none placeholder:text-navy-800 text-white"
                                        />
                                    </div>
                                </div>
                            )}
                            {isLive && <span className="text-[10px] font-black text-red-500 animate-pulse tracking-widest uppercase">Directo</span>}
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-3 w-1/3 group/team">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-white/5 rounded-full blur-md opacity-0 group-hover/team:opacity-100 transition-opacity" />
                                <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-white/5 p-3 shadow-inner transform group-hover/team:scale-105 transition-transform">
                                    {match.away_team.badge_url ? (
                                        <img src={match.away_team.badge_url} alt={match.away_team.name} className="w-full h-full object-contain drop-shadow-md" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-navy-800 rounded-xl text-xs font-black text-white/20">
                                            {match.away_team.short_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs md:text-sm font-black text-white text-center leading-tight h-10 flex items-center justify-center">
                                {match.away_team.name}
                            </span>
                        </div>
                    </div>

                    {/* Action Bar / Prediction Status */}
                    <div className="pt-2">
                        {!user ? (
                            <div className="w-full py-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2">
                                <AlertCircle size={14} className="text-gray-500" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Iniciá sesión para jugar</span>
                            </div>
                        ) : !isLocked ? (
                            <button
                                onClick={handleSave}
                                disabled={loading || homeScore === '' || awayScore === ''}
                                className={`group/btn w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden ${saved
                                    ? 'bg-green-500 text-navy-950'
                                    : 'bg-argentina-blue text-navy-950 hover:shadow-[0_8px_25px_rgba(117,170,219,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                                    } disabled:opacity-50 disabled:grayscale disabled:scale-100`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                <div className="relative flex items-center gap-2">
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : saved ? (
                                        <Check size={18} className="animate-bounce" />
                                    ) : null}
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">
                                        {loading ? 'Procesando...' : saved ? '¡Guardado!' : 'Enviar Predicción'}
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <div className="w-full space-y-3">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-950/50 border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-argentina-blue/10 flex items-center justify-center flex-shrink-0">
                                        <Check size={14} className="text-argentina-blue" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Tu Prode</div>
                                        {userPrediction ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-white tracking-widest">
                                                    {userPrediction.home_score} - {userPrediction.away_score}
                                                </span>
                                                {userPrediction.points_awarded !== null && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-argentina-gold/20 border border-argentina-gold/30">
                                                        <Trophy size={10} className="text-argentina-gold" />
                                                        <span className="text-xs font-black text-argentina-gold">+{userPrediction.points_awarded} pts</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-600 italic">No participaste</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
