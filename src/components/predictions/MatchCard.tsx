'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { Clock, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { TeamForm } from '@/components/matches/TeamForm';
import { Tooltip } from '@/components/ui/Tooltip';
import { useRef } from 'react';

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

type Prediction = Database['public']['Tables']['predictions']['Row'];

interface MatchCardProps {
    match: Match;
    userPrediction?: Prediction;
}

export function MatchCard({ match, userPrediction }: MatchCardProps) {
    const { user } = useAuth();
    const [homeScore, setHomeScore] = useState<string>(userPrediction?.home_score?.toString() || '');
    const [awayScore, setAwayScore] = useState<string>(userPrediction?.away_score?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);
    const [hoveredTeam, setHoveredTeam] = useState<'home' | 'away' | null>(null);
    const homeTeamRef = useRef<HTMLDivElement>(null);
    const awayTeamRef = useRef<HTMLDivElement>(null);

    const matchDate = new Date(match.start_time);
    const now = new Date();
    const isLocked = matchDate <= now || match.status === 'live' || match.status === 'finished';
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';

    const handlePredictionSubmit = async () => {
        if (!user || isLocked) return;

        const home = parseInt(homeScore);
        const away = parseInt(awayScore);

        if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
            alert('Por favor ingresa valores válidos');
            return;
        }

        setIsSaving(true);

        const predictionData = {
            user_id: user.id,
            match_id: match.id,
            home_score: home,
            away_score: away,
        };

        const { error } = await supabase
            .from('predictions')
            .upsert(predictionData, {
                onConflict: 'user_id,match_id',
            });

        if (error) {
            console.error('Error saving prediction:', error);
            alert('Error al guardar la predicción');
        }

        setIsSaving(false);
    };

    return (
        <div className={`relative transition-all duration-300 ${isLocked ? 'opacity-90' : 'hover:-translate-y-1'} ${hoveredTeam ? 'z-[1000]' : 'z-auto'}`}>

            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-sm opacity-0 hover:opacity-100 transition-opacity duration-500" />

            {/* Main card */}
            <div className="relative glass-panel rounded-2xl border border-white/10 bg-navy-900/60 backdrop-blur-xl shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {isLive ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">En Vivo</span>
                            </div>
                        ) : isFinished ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <CheckCircle2 size={12} className="text-green-500" />
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Finalizado</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-argentina-blue/10 border border-argentina-blue/20">
                                <Clock size={12} className="text-argentina-blue" />
                                <span className="text-[10px] font-black text-argentina-blue uppercase tracking-widest">Programado</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {matchDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-[10px] font-mono font-black text-white bg-white/5 px-1.5 py-0.5 rounded">
                            {matchDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-2 md:p-6 space-y-4 md:space-y-6">
                    {/* Teams and Score */}
                    <div className="flex items-center justify-between gap-4">

                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-3 w-1/3 group/team relative"
                            ref={homeTeamRef}
                            onMouseEnter={() => setHoveredTeam('home')}
                            onMouseLeave={() => setHoveredTeam(null)}>
                            <Link href={`/teams/${match.home_team_id}`} className="flex flex-col items-center gap-3 w-full">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl opacity-0 group-hover/team:opacity-100 transition-opacity" />
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-white/5 p-2 md:p-3 shadow-inner transform group-hover/team:scale-105 transition-transform border border-white/5">
                                        {match.home_team.badge_url ? (
                                            <img src={match.home_team.badge_url} alt={match.home_team.name} className="w-full h-full object-contain drop-shadow-2xl" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-navy-800 rounded-xl text-xs font-black text-white/20">
                                                {match.home_team.short_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] sm:text-xs md:text-sm font-black text-white text-center leading-tight h-8 md:h-10 flex items-center justify-center group-hover/team:text-argentina-blue transition-colors">
                                    {match.home_team.name}
                                </span>
                            </Link>

                            <Tooltip triggerRef={homeTeamRef as React.RefObject<HTMLElement>} isVisible={hoveredTeam === 'home'}>
                                <div className="glass-panel border-2 border-argentina-blue/30 bg-navy-900/98 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                                    <TeamForm teamId={match.home_team_id} />
                                </div>
                            </Tooltip>
                        </div>

                        {/* Score Display/Input */}
                        <div className="flex flex-col items-center justify-center gap-3">
                            {isLocked ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-navy-950 border border-white/10 font-mono text-2xl font-black text-white">
                                        {match.home_score ?? '-'}
                                    </div>
                                    <span className="text-gray-600 font-black text-xl">-</span>
                                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-navy-950 border border-white/10 font-mono text-2xl font-black text-white">
                                        {match.away_score ?? '-'}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            value={homeScore}
                                            onChange={(e) => setHomeScore(e.target.value)}
                                            className="w-12 h-12 text-center rounded-xl bg-navy-950 border border-white/10 font-mono text-2xl font-black text-white focus:border-argentina-blue focus:ring-2 focus:ring-argentina-blue/20 transition-all"
                                            placeholder="0"
                                        />
                                        <span className="text-gray-600 font-black text-xl">-</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={awayScore}
                                            onChange={(e) => setAwayScore(e.target.value)}
                                            className="w-12 h-12 text-center rounded-xl bg-navy-950 border border-white/10 font-mono text-2xl font-black text-white focus:border-argentina-blue focus:ring-2 focus:ring-argentina-blue/20 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePredictionSubmit}
                                        disabled={isSaving || !homeScore || !awayScore}
                                        className="px-4 py-2 rounded-lg bg-argentina-blue text-white font-black text-xs uppercase tracking-widest hover:bg-argentina-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSaving ? 'Guardando...' : userPrediction ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-3 w-1/3 group/team relative"
                            ref={awayTeamRef}
                            onMouseEnter={() => setHoveredTeam('away')}
                            onMouseLeave={() => setHoveredTeam(null)}>
                            <Link href={`/teams/${match.away_team_id}`} className="flex flex-col items-center gap-3 w-full">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl opacity-0 group-hover/team:opacity-100 transition-opacity" />
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-white/5 p-2 md:p-3 shadow-inner transform group-hover/team:scale-105 transition-transform border border-white/5">
                                        {match.away_team.badge_url ? (
                                            <img src={match.away_team.badge_url} alt={match.away_team.name} className="w-full h-full object-contain drop-shadow-2xl" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-navy-800 rounded-xl text-xs font-black text-white/20">
                                                {match.away_team.short_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] sm:text-xs md:text-sm font-black text-white text-center leading-tight h-8 md:h-10 flex items-center justify-center group-hover/team:text-argentina-blue transition-colors">
                                    {match.away_team.name}
                                </span>
                            </Link>

                            <Tooltip triggerRef={awayTeamRef as React.RefObject<HTMLElement>} isVisible={hoveredTeam === 'away'}>
                                <div className="glass-panel border-2 border-argentina-blue/30 bg-navy-900/98 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                                    <TeamForm teamId={match.away_team_id} />
                                </div>
                            </Tooltip>
                        </div>
                    </div>

                    {/* User Prediction Display */}
                    {isLocked && userPrediction && (
                        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tu predicción:</span>
                            <span className="font-mono font-black text-white">
                                {userPrediction.home_score} - {userPrediction.away_score}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
