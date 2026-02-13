'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { TeamForm } from '@/components/matches/TeamForm';
import { Tooltip } from '@/components/ui/Tooltip';

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

type Prediction = Database['public']['Tables']['predictions']['Row'];

interface MatchCardLargeProps {
    match: Match;
    userPrediction?: Prediction;
}

export function MatchCardLarge({ match, userPrediction }: MatchCardLargeProps) {
    const { user } = useAuth();
    const [homeScore, setHomeScore] = useState<string>(userPrediction?.home_score?.toString() || '');
    const [awayScore, setAwayScore] = useState<string>(userPrediction?.away_score?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [hoveredTeam, setHoveredTeam] = useState<'home' | 'away' | null>(null);
    const homeTeamRef = useRef<HTMLDivElement>(null);
    const awayTeamRef = useRef<HTMLDivElement>(null);

    const matchDate = new Date(match.start_time);
    const now = new Date();
    const isLocked = matchDate <= now || match.status === 'live' || match.status === 'finished';
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';

    // Capitalize first letter of day and month
    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        const parts = new Intl.DateTimeFormat('es-AR', options).formatToParts(date);

        return parts.map(p => {
            if (p.type === 'weekday' || p.type === 'month') {
                return p.value.charAt(0).toUpperCase() + p.value.slice(1);
            }
            return p.value;
        }).join('');
    };

    const handlePredictionSubmit = async () => {
        if (!user || isLocked) return;

        const home = parseInt(homeScore);
        const away = parseInt(awayScore);

        if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');

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
            setSaveStatus('error');
        } else {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }

        setIsSaving(false);
    };

    return (
        <div className={`group relative w-full ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}`}>

            {/* Status Badge - Floating */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                {isLive ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 shadow-lg shadow-red-900/50 border border-red-400/30 animate-pulse">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75 left-3"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white ml-1"></span>
                        <span className="text-xs font-black text-white uppercase tracking-wider">En Juego</span>
                    </div>
                ) : isFinished ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/80 border border-white/10 backdrop-blur-md">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Finalizado</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/80 border border-white/10 backdrop-blur-md">
                        <Clock size={14} className="text-argentina-blue" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                            {formatDate(matchDate)} - {matchDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                        </span>
                    </div>
                )}
            </div>

            {/* Main Card */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-800/80 to-navy-900/90 border border-white/5 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:shadow-argentina-blue/5">

                {/* Background Decoration */}
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-argentina-blue/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center gap-4 group/home"
                        ref={homeTeamRef}
                        onMouseEnter={() => setHoveredTeam('home')}
                        onMouseLeave={() => setHoveredTeam(null)}>
                        <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-300 group-hover/home:scale-110 drop-shadow-2xl">
                            {match.home_team.badge_url ? (
                                <img src={match.home_team.badge_url} alt={match.home_team.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full text-2xl font-black text-white/20">
                                    {match.home_team.short_name}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-white text-center leading-none tracking-tight">
                            {match.home_team.name}
                        </h3>
                        <Tooltip triggerRef={homeTeamRef as React.RefObject<HTMLElement>} isVisible={hoveredTeam === 'home'}>
                            <div className="glass-panel border-2 border-argentina-blue/30 bg-navy-900/98 backdrop-blur-2xl rounded-2xl shadow-xl">
                                <TeamForm teamId={match.home_team_id} />
                            </div>
                        </Tooltip>
                    </div>

                    {/* VS / Score Input Section */}
                    <div className="flex flex-col items-center justify-center gap-6 min-w-[200px]">

                        {isLocked ? (
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-24 flex items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner">
                                    <span className={`text-5xl font-black font-mono ${match.home_score !== null ? 'text-white' : 'text-gray-600'}`}>
                                        {match.home_score ?? '-'}
                                    </span>
                                </div>
                                <span className="text-xl font-black text-white/20">vs</span>
                                <div className="w-20 h-24 flex items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner">
                                    <span className={`text-5xl font-black font-mono ${match.away_score !== null ? 'text-white' : 'text-gray-600'}`}>
                                        {match.away_score ?? '-'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="0"
                                    value={homeScore}
                                    onChange={(e) => setHomeScore(e.target.value)}
                                    className="w-24 h-24 text-center rounded-2xl bg-navy-950 border-2 border-white/10 font-mono text-5xl font-black text-white focus:border-argentina-blue focus:ring-4 focus:ring-argentina-blue/10 transition-all outline-none placeholder:text-white/10"
                                    placeholder="-"
                                />
                                <span className="text-2xl font-black text-gray-500">-</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={awayScore}
                                    onChange={(e) => setAwayScore(e.target.value)}
                                    className="w-24 h-24 text-center rounded-2xl bg-navy-950 border-2 border-white/10 font-mono text-5xl font-black text-white focus:border-argentina-blue focus:ring-4 focus:ring-argentina-blue/10 transition-all outline-none placeholder:text-white/10"
                                    placeholder="-"
                                />
                            </div>
                        )}

                        {!isLocked && (
                            <button
                                onClick={handlePredictionSubmit}
                                disabled={isSaving || !homeScore || !awayScore}
                                className={`
                                    w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300
                                    ${saveStatus === 'success'
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                        : saveStatus === 'error'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-argentina-blue text-navy-950 hover:bg-white hover:scale-105 shadow-lg shadow-argentina-blue/20'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
                                `}
                            >
                                {saveStatus === 'success' ? 'Guardado' : saveStatus === 'error' ? 'Error' : isSaving ? 'Guardando...' : userPrediction ? 'Actualizar' : 'Guardar'}
                            </button>
                        )}

                        {isLocked && userPrediction && (
                            <div className="flex flex-col items-center gap-1 animate-fade-in">
                                <span className="text-[10px] uppercase tracking-widest text-gray-400">Tu Pronóstico</span>
                                <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10">
                                    <span className="text-lg font-mono font-bold text-argentina-blue">
                                        {userPrediction.home_score} - {userPrediction.away_score}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center gap-4 group/away"
                        ref={awayTeamRef}
                        onMouseEnter={() => setHoveredTeam('away')}
                        onMouseLeave={() => setHoveredTeam(null)}>
                        <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-300 group-hover/away:scale-110 drop-shadow-2xl">
                            {match.away_team.badge_url ? (
                                <img src={match.away_team.badge_url} alt={match.away_team.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full text-2xl font-black text-white/20">
                                    {match.away_team.short_name}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-white text-center leading-none tracking-tight">
                            {match.away_team.name}
                        </h3>
                        <Tooltip triggerRef={awayTeamRef as React.RefObject<HTMLElement>} isVisible={hoveredTeam === 'away'}>
                            <div className="glass-panel border-2 border-argentina-blue/30 bg-navy-900/98 backdrop-blur-2xl rounded-2xl shadow-xl">
                                <TeamForm teamId={match.away_team_id} />
                            </div>
                        </Tooltip>
                    </div>

                </div>
            </div>
        </div>
    );
}
