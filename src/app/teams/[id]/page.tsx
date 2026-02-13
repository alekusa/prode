'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Trophy, Calendar, ChevronLeft, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Team = Database['public']['Tables']['teams']['Row'];
type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Team;
    away_team: Team;
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TeamHistoryPage({ params }: PageProps) {
    const { id: teamId } = use(params);
    const [team, setTeam] = useState<Team | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTeamData() {
            setLoading(true);

            // Fetch team info
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamId)
                .single();

            if (teamError) {
                console.error("Error fetching team:", teamError);
            } else {
                setTeam(teamData);
            }

            // Fetch all matches for the team
            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select(`
                    *,
                    home_team:teams!home_team_id(*),
                    away_team:teams!away_team_id(*)
                `)
                .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
                .order('start_time', { ascending: false });

            if (matchError) {
                console.error("Error fetching matches:", matchError);
            } else {
                setMatches(matchData as Match[]);
            }

            setLoading(false);
        }

        if (teamId) {
            fetchTeamData();
        }
    }, [teamId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 size={48} className="animate-spin text-argentina-blue" />
                <p className="text-gray-500 font-black uppercase tracking-[0.2em] animate-pulse text-xs">Cargando Historial...</p>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="text-center py-20">
                <p className="text-white text-xl font-bold">Equipo no encontrado</p>
                <Link href="/" className="text-argentina-blue mt-4 inline-block hover:underline">Volver al inicio</Link>
            </div>
        );
    }

    const pastMatches = matches.filter(m => m.status === 'finished');
    const upcomingMatches = matches.filter(m => m.status !== 'finished').reverse(); // Chronological for upcoming

    const stats = {
        played: pastMatches.length,
        won: pastMatches.filter(m => {
            const isHome = m.home_team_id === teamId;
            return isHome ? (m.home_score! > m.away_score!) : (m.away_score! > m.home_score!);
        }).length,
        drawn: pastMatches.filter(m => m.home_score === m.away_score).length,
        lost: pastMatches.filter(m => {
            const isHome = m.home_team_id === teamId;
            return isHome ? (m.home_score! < m.away_score!) : (m.away_score! < m.home_score!);
        }).length,
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-navy-900/40 p-10 md:p-16 text-center space-y-8">
                <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-argentina-blue/5" />

                <Link href="/" className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group/back">
                    <ArrowLeft size={20} className="text-gray-400 group-hover/back:text-white transition-colors" />
                </Link>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute -inset-8 bg-argentina-blue/20 rounded-full blur-[60px] opacity-50" />
                        <div className="relative w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-3xl p-6 md:p-10 border border-white/10 backdrop-blur-sm shadow-2xl flex items-center justify-center">
                            {team.badge_url ? (
                                <img src={team.badge_url} alt={team.name} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
                            ) : (
                                <div className="text-6xl font-black text-white opacity-20">{team.short_name}</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">{team.name}</h1>
                        <p className="text-argentina-blue font-black tracking-[0.3em] uppercase text-xs mt-2">{team.short_name}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Partidos", value: stats.played, color: "text-white" },
                    { label: "Ganados", value: stats.won, color: "text-green-500" },
                    { label: "Empatados", value: stats.drawn, color: "text-gray-400" },
                    { label: "Perdidos", value: stats.lost, color: "text-red-500" },
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 text-center space-y-1">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Matches List */}
            <div className="space-y-12">
                {upcomingMatches.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Calendar size={18} className="text-argentina-blue" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Próximos Partidos</h2>
                        </div>
                        <div className="grid gap-4">
                            {upcomingMatches.map(match => (
                                <MatchRow key={match.id} match={match} teamId={teamId} />
                            ))}
                        </div>
                    </section>
                )}

                {pastMatches.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Trophy size={18} className="text-argentina-gold" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Resultados Anteriores</h2>
                        </div>
                        <div className="grid gap-4">
                            {pastMatches.map(match => (
                                <MatchRow key={match.id} match={match} teamId={teamId} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function MatchRow({ match, teamId }: { match: Match; teamId: string }) {
    const isHome = match.home_team_id === teamId;
    const opponent = isHome ? match.away_team : match.home_team;
    const isFinished = match.status === 'finished';

    let result: 'W' | 'L' | 'D' | null = null;
    if (isFinished) {
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;
        if (teamScore! > opponentScore!) result = 'W';
        else if (teamScore! < opponentScore!) result = 'L';
        else result = 'D';
    }

    const resultColors = {
        W: 'border-l-4 border-l-green-500 bg-green-500/5',
        L: 'border-l-4 border-l-red-500 bg-red-500/5',
        D: 'border-l-4 border-l-gray-500 bg-gray-500/5',
        null: 'border-l-4 border-l-transparent bg-white/[0.02]'
    };

    return (
        <div className={`glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-white/[0.04] ${resultColors[result as keyof typeof resultColors] || resultColors.null}`}>
            <div className="flex flex-col items-center md:items-start gap-1 w-32 shrink-0">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fecha {match.round}</span>
                <span className="text-xs font-bold text-white">
                    {new Date(match.start_time).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                </span>
            </div>

            <div className="flex-1 flex items-center justify-center gap-8 w-full">
                <div className="flex flex-col items-center gap-2 w-[40%] text-center">
                    <img src={match.home_team.badge_url || ''} className="w-10 h-10 object-contain" alt="" />
                    <span className={`text-xs font-black uppercase tracking-tighter ${match.home_team_id === teamId ? 'text-argentina-blue' : 'text-white'}`}>
                        {match.home_team.name}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0 px-4 py-2 bg-navy-950/50 rounded-xl border border-white/5 min-w-[80px]">
                    <div className="text-lg font-black text-white tabular-nums">
                        {isFinished ? `${match.home_score} - ${match.away_score}` : 'vs'}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-[40%] text-center">
                    <img src={match.away_team.badge_url || ''} className="w-10 h-10 object-contain" alt="" />
                    <span className={`text-xs font-black uppercase tracking-tighter ${match.away_team_id === teamId ? 'text-argentina-blue' : 'text-white'}`}>
                        {match.away_team.name}
                    </span>
                </div>
            </div>

            <div className="w-32 flex justify-center md:justify-end">
                {result && (
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${result === 'W' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                            result === 'L' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                                'text-gray-400 bg-gray-500/10 border-white/10'
                        }`}>
                        {result === 'W' ? 'Victoria' : result === 'L' ? 'Derrota' : 'Empate'}
                    </div>
                )}
                {!result && (
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Programado</span>
                )}
            </div>
        </div>
    );
}
