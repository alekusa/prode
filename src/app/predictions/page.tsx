'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { MatchCard } from '@/components/predictions/MatchCard';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

export default function PredictionsPage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [predictions, setPredictions] = useState<Record<string, Database['public']['Tables']['predictions']['Row']>>({});
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<'predictions' | 'fixture'>('predictions');
    const [rounds, setRounds] = useState<number[]>([]);

    async function fetchMatches() {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *,
                home_team:teams!home_team_id(*),
                away_team:teams!away_team_id(*)
            `)
            .order('start_time', { ascending: true });

        if (error) {
            console.error("Error fetching matches:", error);
            return [];
        }
        return data as Match[];
    }

    async function fetchUserPredictions(matchIds: string[]) {
        if (!user || matchIds.length === 0) return {};

        const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .in('match_id', matchIds);

        if (error) {
            console.error("Error fetching predictions:", error);
            return {};
        }

        const predictionMap: Record<string, any> = {};
        data?.forEach(p => {
            predictionMap[p.match_id] = p;
        });
        return predictionMap;
    }

    const fetchData = async () => {
        setLoading(true);
        const fetchedMatches = await fetchMatches();
        setMatches(fetchedMatches);
        setRounds(Array.from({ length: 16 }, (_, i) => i + 1));

        // Find current round (first round that has scheduled matches)
        const currentRound = fetchedMatches.find(m => m.status === 'scheduled')?.round || 1;
        setSelectedRound(currentRound);

        if (user && fetchedMatches.length > 0) {
            const currentRoundMatchIds = fetchedMatches
                .filter(m => m.round === currentRound)
                .map(m => m.id);
            const predMap = await fetchUserPredictions(currentRoundMatchIds);
            setPredictions(predMap);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const handleRoundChange = async (round: number) => {
        setSelectedRound(round);
        if (user) {
            const roundMatchIds = matches.filter(m => m.round === round).map(m => m.id);
            const predMap = await fetchUserPredictions(roundMatchIds);
            setPredictions(prev => ({ ...prev, ...predMap }));
        }
    };

    const filteredMatches = matches.filter(m => m.round === selectedRound);

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto px-4 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-argentina-blue font-bold tracking-widest uppercase text-[10px]">
                        <Calendar size={12} />
                        <span>Torneo Apertura 2026</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight glow-text leading-none">
                        {activeTab === 'predictions' ? 'Hacé tu Jugada' : 'Fixture Completo'}
                    </h1>
                </div>

                {/* View Switcher */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('predictions')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'predictions' ? 'bg-argentina-blue text-navy-950 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Pronosticar
                    </button>
                    <button
                        onClick={() => setActiveTab('fixture')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'fixture' ? 'bg-argentina-blue text-navy-950 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Fixture
                    </button>
                </div>
            </div>

            {/* Round Selector */}
            <div className="sticky top-16 z-30 bg-navy-950/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleRoundChange(Math.max(1, selectedRound - 1))}
                        disabled={selectedRound === 1}
                        className="p-2 rounded-full hover:bg-white/5 disabled:opacity-20 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-white" />
                    </button>

                    <div className="flex-1 overflow-hidden relative">
                        <div className="flex overflow-x-auto no-scrollbar gap-2 scroll-smooth px-2">
                            {rounds.map(round => (
                                <button
                                    key={round}
                                    onClick={() => handleRoundChange(round)}
                                    className={`flex-shrink-0 px-6 py-2 rounded-xl font-bold text-sm transition-all border ${selectedRound === round
                                        ? 'bg-argentina-blue text-navy-950 border-argentina-blue shadow-[0_0_15px_rgba(117,170,219,0.3)]'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                >
                                    Fecha {round}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => handleRoundChange(Math.min(16, selectedRound + 1))}
                        disabled={selectedRound === 16}
                        className="p-2 rounded-full hover:bg-white/5 disabled:opacity-20 transition-colors"
                    >
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="text-center py-20 bg-navy-900/40 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-400 text-lg">No hay partidos programados para esta fecha.</p>
                </div>
            ) : activeTab === 'predictions' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            userPrediction={predictions[match.id]}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div className="divide-y divide-white/5">
                        {filteredMatches.map((match) => (
                            <div key={match.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4 w-1/3 justify-end text-right">
                                    <span className="text-xs font-bold text-white hidden sm:inline">{match.home_team.name}</span>
                                    <span className="text-xs font-black text-white sm:hidden">{match.home_team.short_name}</span>
                                    <img src={match.home_team.badge_url || ''} className="w-6 h-6 object-contain" alt="" />
                                </div>
                                <div className="flex flex-col items-center gap-1 w-1/4">
                                    <div className="bg-navy-950 px-3 py-1 rounded-lg border border-white/10 font-mono font-black text-white">
                                        {match.status === 'scheduled' ? 'vs' : `${match.home_score} - ${match.away_score}`}
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                                        {new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 w-1/3">
                                    <img src={match.away_team.badge_url || ''} className="w-6 h-6 object-contain" alt="" />
                                    <span className="text-xs font-bold text-white hidden sm:inline">{match.away_team.name}</span>
                                    <span className="text-xs font-black text-white sm:hidden">{match.away_team.short_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
