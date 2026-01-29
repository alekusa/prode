'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Trophy, Calendar, CheckCircle2, AlertCircle, Edit2, Save, X } from 'lucide-react';

interface PredictionWithDetails {
    id: string;
    home_score: number;
    away_score: number;
    points_awarded: number | null;
    created_at: string;
    matches: {
        id: string;
        start_time: string;
        home_score: number | null;
        away_score: number | null;
        status: string;
        home_team: { name: string; short_name: string };
        away_team: { name: string; short_name: string };
    };
}

export default function ProfilePage() {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const [fullName, setFullName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState<PredictionWithDetails[]>([]);
    const [loadingPredictions, setLoadingPredictions] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
        }
    }, [profile]);

    useEffect(() => {
        if (user) {
            fetchPredictions();
        }
    }, [user]);

    const fetchPredictions = async () => {
        console.log("Fetching predictions for user:", user?.id);
        setLoadingPredictions(true);
        try {
            const { data, error } = await supabase
                .from('predictions')
                .select(`
                    id,
                    home_score,
                    away_score,
                    points_awarded,
                    created_at,
                    matches (
                        id,
                        start_time,
                        home_score,
                        away_score,
                        status,
                        home_team:teams!home_team_id (name, short_name),
                        away_team:teams!away_team_id (name, short_name)
                    )
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching predictions details:', error);
                setMessage({ type: 'error', text: 'No se pudieron cargar tus predicciones.' });
            } else {
                console.log("Predictions fetched:", data?.length);
                setPredictions((data as any) || []);
            }
        } catch (error: any) {
            console.error('Unexpected error in fetchPredictions:', error);
        } finally {
            setLoadingPredictions(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName, updated_at: new Date().toISOString() })
                .eq('id', user?.id);

            if (error) throw error;

            await refreshProfile();
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    console.log("ProfilePage rendering. AuthLoading:", authLoading, "User:", !!user);

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-argentina-blue"></div>
                <p className="text-gray-400 animate-pulse">Cargando perfil...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4">Iniciá sesión para ver tu perfil</h2>
                <a href="/login" className="px-6 py-3 bg-argentina-blue text-navy-950 font-bold rounded-xl">Ir al Login</a>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Profile Header */}
            <section className="relative glass-panel rounded-3xl p-8 border border-white/5 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-argentina-blue/10 blur-[80px] rounded-full" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-3xl object-cover border-4 border-white/10 shadow-2xl transition-transform group-hover:scale-105" />
                        ) : (
                            <div className="w-32 h-32 rounded-3xl bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-2xl">
                                <User size={64} className="text-gray-500" />
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-argentina-gold text-navy-950 p-2 rounded-xl shadow-lg border-2 border-navy-900">
                            <Trophy size={20} />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="flex flex-col sm:flex-row items-center gap-3">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue w-full max-w-sm"
                                        placeholder="Nombre Completo"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={loading} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                                            <Save size={20} />
                                        </button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <h1 className="text-3xl font-black text-white tracking-tight">
                                        {profile?.full_name || 'Sin Nombre'}
                                    </h1>
                                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-argentina-blue transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            )}
                            <p className="text-gray-400 font-medium">@{profile?.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>

                        {message && (
                            <div className={`text-sm p-3 rounded-lg border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="px-4 py-2 bg-argentina-blue/10 border border-argentina-blue/20 rounded-xl">
                                <p className="text-xs text-argentina-blue font-bold uppercase tracking-wider">Puntos Totales</p>
                                <p className="text-2xl font-black text-white">{profile?.points || 0}</p>
                            </div>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pronósticos</p>
                                <p className="text-2xl font-black text-white">{predictions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Predictions List */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-white">
                    <Calendar className="text-argentina-blue" />
                    <h2 className="text-2xl font-bold">Mis Pronósticos Recientes</h2>
                </div>

                {loadingPredictions ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-argentina-blue"></div></div>
                ) : predictions.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-12 text-center border border-white/5">
                        <p className="text-gray-400 mb-6">Aún no has realizado ninguna predicción.</p>
                        <a href="/predictions" className="px-6 py-3 bg-argentina-blue text-navy-950 font-bold rounded-xl hover:scale-105 transition-all inline-block">
                            Empezar a jugar
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {predictions.map((pred) => (
                            <div key={pred.id} className="relative group">
                                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/5 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative glass-panel rounded-2xl p-5 border border-white/5 bg-navy-900/40 backdrop-blur-xl space-y-4 hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-gray-500">
                                            {new Date(pred.matches.start_time).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} • {new Date(pred.matches.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}hs
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-black border ${pred.matches.status === 'finished'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-argentina-blue/10 text-argentina-blue border-argentina-blue/20'
                                            }`}>
                                            {pred.matches.status === 'finished' ? 'Finalizado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-col items-center gap-1 w-[35%]">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-[10px] text-gray-400 border border-white/5">
                                                {pred.matches.home_team.short_name}
                                            </div>
                                            <span className="text-[10px] font-black text-white line-clamp-1">{pred.matches.home_team.name}</span>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Tu Prode</span>
                                            <div className="text-lg font-black text-argentina-blue bg-navy-950/50 px-3 py-1 rounded-lg border border-white/5 shadow-inner">
                                                {pred.home_score} - {pred.away_score}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1 w-[35%]">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-[10px] text-gray-400 border border-white/5">
                                                {pred.matches.away_team.short_name}
                                            </div>
                                            <span className="text-[10px] font-black text-white line-clamp-1">{pred.matches.away_team.name}</span>
                                        </div>
                                    </div>

                                    {pred.matches.status === 'finished' && (
                                        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                Resultado: <span className="text-white font-black ml-1">{pred.matches.home_score} - {pred.matches.away_score}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${pred.points_awarded && pred.points_awarded > 0
                                                    ? 'bg-argentina-gold/20 text-argentina-gold border border-argentina-gold/30'
                                                    : 'bg-white/5 text-gray-600'
                                                }`}>
                                                {pred.points_awarded && pred.points_awarded > 0 && <Trophy size={10} />}
                                                <span className="font-black text-[10px]">+{pred.points_awarded || 0} PTS</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
