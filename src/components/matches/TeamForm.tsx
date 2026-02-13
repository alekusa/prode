'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Loader2 } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

interface TeamFormProps {
    teamId: string;
}

export function TeamForm({ teamId }: TeamFormProps) {
    const [lastMatches, setLastMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLastMatches() {
            setLoading(true);
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    home_team:teams!home_team_id(*),
                    away_team:teams!away_team_id(*)
                `)
                .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
                .eq('status', 'finished')
                .order('start_time', { ascending: false })
                .limit(5);

            if (!error && data) {
                setLastMatches(data as Match[]);
            }
            setLoading(false);
        }

        if (teamId) {
            fetchLastMatches();
        }
    }, [teamId]);

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 size={16} className="animate-spin text-argentina-blue" />
            </div>
        );
    }

    if (lastMatches.length === 0) {
        return (
            <div className="text-[10px] text-gray-500 p-4 font-bold uppercase tracking-widest">
                Sin partidos previos
            </div>
        );
    }

    return (
        <div className="p-5 space-y-3 min-w-[220px]">
            <div className="text-[10px] font-black text-argentina-blue uppercase tracking-[0.2em] mb-3 border-b border-argentina-blue/20 pb-2">
                Últimos Resultados
            </div>
            <div className="space-y-2">
                {lastMatches.map((match) => {
                    const isHome = match.home_team_id === teamId;
                    const teamScore = isHome ? match.home_score : match.away_score;
                    const opponentScore = isHome ? match.away_score : match.home_score;
                    const opponent = isHome ? match.away_team : match.home_team;

                    let result: 'W' | 'L' | 'D' = 'D';
                    if (teamScore! > opponentScore!) result = 'W';
                    else if (teamScore! < opponentScore!) result = 'L';

                    const resultConfig = {
                        W: { label: 'G', color: 'bg-green-500/30 text-green-400 border-green-500/50' },
                        L: { label: 'P', color: 'bg-red-500/30 text-red-400 border-red-500/50' },
                        D: { label: 'E', color: 'bg-gray-500/30 text-gray-300 border-gray-500/50' }
                    }[result];

                    return (
                        <div key={match.id} className="flex items-center justify-between gap-3 group/item">
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-black ${resultConfig.color}`}>
                                    {resultConfig.label}
                                </div>
                                <span className="text-[10px] font-bold text-white uppercase truncate max-w-[80px]">
                                    vs {opponent.short_name}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-1 rounded border border-white/10">
                                {isHome ? match.home_score : match.away_score}-{isHome ? match.away_score : match.home_score}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
