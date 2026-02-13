'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { MatchCardLarge } from '@/components/predictions/MatchCardLarge';
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

        // Find current round: first round that has at least one match not yet finished
        const now = new Date();
        let currentRound = 1;

        // Group matches by round
        const matchesByRound: Record<number, Match[]> = {};
        fetchedMatches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });

        // Find first round with at least one upcoming match
        for (let round = 1; round <= 16; round++) {
            const roundMatches = matchesByRound[round] || [];
            const hasUpcomingMatch = roundMatches.some(m => {
                const matchDate = new Date(m.start_time);
                return matchDate > now || m.status === 'scheduled' || m.status === 'live';
            });

            if (hasUpcomingMatch) {
                currentRound = round;
                break;
            }
        }

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
        <div className="space-y-12 animate-fade-in w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">

            {/* Header Section */}
            <div className="flex flex-col items-center text-center space-y-4 pt-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-argentina-blue/10 border border-argentina-blue/20">
                    <Calendar size={14} className="text-argentina-blue" />
                    <span className="text-xs font-black tracking-widest uppercase text-argentina-blue">Torneo Apertura 2026</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter glow-text leading-none">
                    {activeTab === 'predictions' ? 'Hacé tu Jugada' : 'Fixture Completo'}
                </h1>

                {/* View Switcher - Minimalist */}
                <div className="flex mt-8 p-1 bg-navy-900/50 rounded-xl border border-white/5 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('predictions')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'predictions' ? 'bg-white text-navy-950 shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                    >
                        Pronosticar
                    </button>
                    <button
                        onClick={() => setActiveTab('fixture')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'fixture' ? 'bg-white text-navy-950 shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                    >
                        Fixture
                    </button>
                </div>
            </div>

            {/* Pagination / Round Selector */}
            <div className="flex items-center justify-center gap-6 sticky top-20 z-40 py-4 backdrop-blur-md -mx-4 px-4 bg-navy-950/80 border-y border-white/5">
                <button
                    onClick={() => handleRoundChange(Math.max(1, selectedRound - 1))}
                    disabled={selectedRound === 1}
                    className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 disabled:opacity-20 disabled:hover:scale-100 transition-all group"
                >
                    <ChevronLeft size={24} className="text-white group-hover:text-argentina-blue transition-colors" />
                </button>

                <h2 className="text-3xl font-black text-white tracking-tight min-w-[180px] text-center">
                    Fecha <span className="text-argentina-blue">{selectedRound}</span>
                </h2>

                <button
                    onClick={() => handleRoundChange(Math.min(16, selectedRound + 1))}
                    disabled={selectedRound === 16}
                    className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 disabled:opacity-20 disabled:hover:scale-100 transition-all group"
                >
                    <ChevronRight size={24} className="text-white group-hover:text-argentina-blue transition-colors" />
                </button>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="text-center py-32 bg-navy-900/40 rounded-[3rem] border-2 border-dashed border-white/5">
                    <p className="text-gray-400 text-xl font-medium">No hay partidos programados para esta fecha.</p>
                </div>
            ) : activeTab === 'predictions' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredMatches.map((match) => (
                        <MatchCardLarge
                            key={match.id}
                            match={match}
                            userPrediction={predictions[match.id]}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden max-w-5xl mx-auto">
                    <div className="divide-y divide-white/5">
                        {filteredMatches.map((match) => (
                            <div key={match.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-6 w-5/12 justify-end text-right">
                                    <span className="text-lg font-bold text-white hidden sm:inline group-hover:text-argentina-blue transition-colors">{match.home_team.name}</span>
                                    <span className="text-lg font-black text-white sm:hidden">{match.home_team.short_name}</span>
                                    <img src={match.home_team.badge_url || ''} className="w-10 h-10 object-contain drop-shadow-lg" alt="" />
                                </div>

                                <div className="flex flex-col items-center gap-1 w-2/12 min-w-[120px]">
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                            {new Date(match.start_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                            {new Date(match.start_time).toLocaleDateString('es-AR', { month: 'short' })} • {new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                                        </span>
                                    </div>
                                    <div className="bg-navy-950/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10 font-mono font-black text-lg text-white shadow-inner min-w-[60px] text-center">
                                        {match.status === 'scheduled' ? 'vs' : `${match.home_score} - ${match.away_score}`}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-5/12">
                                    <img src={match.away_team.badge_url || ''} className="w-10 h-10 object-contain drop-shadow-lg" alt="" />
                                    <span className="text-lg font-bold text-white hidden sm:inline group-hover:text-argentina-blue transition-colors">{match.away_team.name}</span>
                                    <span className="text-lg font-black text-white sm:hidden">{match.away_team.short_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
