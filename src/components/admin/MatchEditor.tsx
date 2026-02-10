'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type Team = Database['public']['Tables']['teams']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface MatchEditorProps {
    existingMatch?: Match | null;
    onSaved: () => void;
    onCancel: () => void;
}

export function MatchEditor({ existingMatch, onSaved, onCancel }: MatchEditorProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [homeTeamId, setHomeTeamId] = useState(existingMatch?.home_team_id || "");
    const [awayTeamId, setAwayTeamId] = useState(existingMatch?.away_team_id || "");
    const [startTime, setStartTime] = useState(existingMatch?.start_time ? new Date(existingMatch.start_time).toISOString().slice(0, 16) : "");
    const [round, setRound] = useState(existingMatch?.round || 1);
    const [status, setStatus] = useState<Match['status']>(existingMatch?.status || 'scheduled');
    const [homeScore, setHomeScore] = useState(existingMatch?.home_score?.toString() || "");
    const [awayScore, setAwayScore] = useState(existingMatch?.away_score?.toString() || "");

    useEffect(() => {
        async function fetchTeams() {
            const { data } = await supabase.from('teams').select('*').order('name');
            if (data) setTeams(data);
        }
        fetchTeams();
    }, []);

    // Update form state when existingMatch changes
    useEffect(() => {
        if (existingMatch) {
            setHomeTeamId(existingMatch.home_team_id || "");
            setAwayTeamId(existingMatch.away_team_id || "");
            setStartTime(existingMatch.start_time ? new Date(existingMatch.start_time).toISOString().slice(0, 16) : "");
            setRound(existingMatch.round || 1);
            setStatus(existingMatch.status || 'scheduled');
            setHomeScore(existingMatch.home_score?.toString() || "");
            setAwayScore(existingMatch.away_score?.toString() || "");
        } else {
            // Reset form for new match
            setHomeTeamId("");
            setAwayTeamId("");
            setStartTime("");
            setRound(1);
            setStatus('scheduled');
            setHomeScore("");
            setAwayScore("");
        }
    }, [existingMatch]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const matchData: any = {
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            start_time: new Date(startTime).toISOString(),
            round: round,
            status: status,
            home_score: homeScore === "" ? null : Math.max(0, parseInt(homeScore)),
            away_score: awayScore === "" ? null : Math.max(0, parseInt(awayScore)),
        };

        try {
            let savedMatch;
            if (existingMatch) {
                const { data } = await supabase.from('matches').update(matchData).eq('id', existingMatch.id).select().single();
                savedMatch = data;
            } else {
                const { data } = await supabase.from('matches').insert(matchData).select().single();
                savedMatch = data;
            }

            // Sync with Google Calendar
            if (savedMatch) {
                try {
                    // Enrich match data with team names for calendar event
                    const homeTeam = teams.find(t => t.id === homeTeamId);
                    const awayTeam = teams.find(t => t.id === awayTeamId);

                    if (homeTeam && awayTeam) {
                        await fetch('/api/match/calendar-sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                match: {
                                    id: savedMatch.id,
                                    home_team: { name: homeTeam.name },
                                    away_team: { name: awayTeam.name },
                                    start_time: savedMatch.start_time
                                }
                            })
                        });
                    }
                } catch (error) {
                    console.error("Error syncing calendar:", error);
                    // Don't block UI if calendar sync fails
                }
            }

            onSaved();
        } catch (error) {
            console.error("Error saving match:", error);
            alert("Error al guardar el partido");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">{existingMatch ? 'Editar Partido' : 'Nuevo Partido'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Local</label>
                        <select
                            value={homeTeamId}
                            onChange={(e) => setHomeTeamId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                            required
                        >
                            <option value="">Seleccionar Equipo</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Visitante</label>
                        <select
                            value={awayTeamId}
                            onChange={(e) => setAwayTeamId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                            required
                        >
                            <option value="">Seleccionar Equipo</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fecha y Hora</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Jornada (Fecha)</label>
                        <input
                            type="number"
                            value={round}
                            onChange={(e) => setRound(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                            min="1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Estado</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                        >
                            <option value="scheduled">Programado</option>
                            <option value="live">En Vivo</option>
                            <option value="finished">Finalizado</option>
                            <option value="postponed">Postergado</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-4">
                    <p className="text-sm text-gray-400 mb-4 font-bold">Resultado (Solo admins)</p>
                    <div className="flex gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Goles Local</label>
                            <input
                                type="number"
                                value={homeScore}
                                onChange={(e) => setHomeScore(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                                placeholder="-"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Goles Visitante</label>
                            <input
                                type="number"
                                value={awayScore}
                                onChange={(e) => setAwayScore(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue"
                                placeholder="-"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-argentina-blue text-navy-950 font-bold hover:bg-argentina-blue/90 transition-colors"
                    >
                        {loading ? 'Guardando...' : 'Guardar Partido'}
                    </button>
                </div>
            </form>
        </div>
    );
}
