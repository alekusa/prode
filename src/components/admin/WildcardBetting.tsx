'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Dices, Save, Check, Loader2, Search, UserPlus, LogIn, Calendar } from 'lucide-react';
import { PASSWORD_DEFAULT } from '@/lib/constants';

type Profile = { id: string; username: string | null; email?: string };
type Match = {
    id: string;
    home_team: { name: string };
    away_team: { name: string };
    round: number;
    start_time: string; // Needed for sorting if we want
};

export function WildcardBetting() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedMatch, setSelectedMatch] = useState<string>('');
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [predictionId, setPredictionId] = useState<string | null>(null);

    // Create User State
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [creatingUser, setCreatingUser] = useState(false);

    // Login State
    const [loggingIn, setLoggingIn] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        // Load profiles
        const { data: profiles } = await supabase.from('profiles').select('id, username, email').order('username');
        if (profiles) setUsers(profiles);

        // Load recent matches (all to group by round)
        const { data: matchesData } = await supabase
            .from('matches')
            .select('id, round, start_time, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
            .order('round', { ascending: false })
            .order('start_time', { ascending: true }); // Secondary sort

        if (matchesData) setMatches(matchesData as any);
        setLoading(false);
    }

    // Check if prediction exists when user and match are selected
    useEffect(() => {
        if (!selectedUser || !selectedMatch) {
            setPredictionId(null);
            setHomeScore('');
            setAwayScore('');
            return;
        }

        async function checkPrediction() {
            const { data } = await supabase
                .from('predictions')
                .select('id, home_score, away_score')
                .eq('user_id', selectedUser)
                .eq('match_id', selectedMatch)
                .single();

            if (data) {
                setPredictionId(data.id);
                setHomeScore(data.home_score.toString());
                setAwayScore(data.away_score.toString());
            } else {
                setPredictionId(null);
                setHomeScore('');
                setAwayScore('');
            }
        }
        checkPrediction();
    }, [selectedUser, selectedMatch]);

    async function handleSave() {
        if (!selectedUser || !selectedMatch || homeScore === '' || awayScore === '') return;

        setSaving(true);
        setSuccess(false);

        const predictionData = {
            user_id: selectedUser,
            match_id: selectedMatch,
            home_score: parseInt(homeScore),
            away_score: parseInt(awayScore)
        };

        let error;

        if (predictionId) {
            // Update
            const { error: err } = await supabase
                .from('predictions')
                .update(predictionData)
                .eq('id', predictionId);
            error = err;
        } else {
            // Insert
            const { error: err } = await supabase
                .from('predictions')
                .insert(predictionData);
            error = err;
        }

        if (!error) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            // Refresh logic if needed
        } else {
            console.error('Error saving wildcard prediction:', error);
            alert('Error al guardar: ' + error.message);
        }
        setSaving(false);
    }

    async function handleCreateUser() {
        if (!newUsername || !newEmail) return;
        setCreatingUser(true);
        // This requires admin privileges in backend or using supabase admin client.
        // Assuming we are logged in as admin who has permissions (or using RLS bypass which we don't strictly have here client-side).
        // Since we are client-side, we can use signUp. It will create the user.
        // But signUp logs us in immediately if email confirm is off. If correct auth flow, we might lose admin session.
        // BETTER APPROACH for "Admin Tool": User creates a dummy email.

        // However, if we use signUp, it might replace current session.
        // Let's create it via a server action or API route ideally. 
        // But to keep it simple as requested:

        try {
            // We'll use a specific API route or just tell user to use signup page? 
            // No, user wants it here.
            // Using signUp will likely sign out admin.
            // We will warn about this or use a secondary client if possible (not easy in client component).

            // ACTUAL SOLUTION: Create a secondary supabase client instance just for this request? 
            // No, that doesn't work for auth.
            // We will accept that creating a user might require re-login or use a backend function.
            // Let's assume for now we just use signUp and warn admin they might be logged out, OR
            // actually, let's just use the `supabase.auth.signUp` but without creating session? 
            // No, signUp creates session by default.

            // Wait, if we use the "Login as" feature, we WANT to switch session.
            // So maybe creation is fine to switch session? No, that's annoying.

            // Let's implement creation via a new API route if we wanted to be perfect.
            // But to save time and complexity, we will just use the existing auth and tell admin "Usuario creado, session cambiada".
            // Or better: Just create it.

            alert("AVISO: Al crear usuario se cerrará tu sesión de Admin.");

            const { data, error } = await supabase.auth.signUp({
                email: newEmail,
                password: PASSWORD_DEFAULT,
                options: {
                    data: {
                        username: newUsername,
                        full_name: newUsername
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                alert("Usuario creado exitosamente. Ahora estás logueado como " + newUsername);
                window.location.href = '/predictions';
            }
        } catch (error: any) {
            alert("Error: " + error.message);
        }
        setCreatingUser(false);
    }

    async function handleLoginAsUser() {
        if (!selectedUser) return;

        // We need the email of the selected user.
        const user = users.find(u => u.id === selectedUser);
        if (!user?.email) {
            // We might not have email in profile if RLS hides it or if it's not in public profile.
            // We need to fetch email from auth.users which is not accessible directly.
            // Unless we stored it in profile (often not recommended for public profiles).
            // IF we created the user via this tool, we know the pattern/password.
            // IF it's a random user, we can't login as them without their password. (Security)

            // ASSUMPTION: This tool is for "Comodín" users created by us or with known passwords.
            // Let's prompt for email if missing.
            const email = prompt("Ingrese el email del usuario para loguearse (Password: " + PASSWORD_DEFAULT + ")");
            if (email) {
                await performLogin(email);
            }
            return;
        }

        await performLogin(user.email);
    }

    async function performLogin(email: string) {
        setLoggingIn(true);
        await supabase.auth.signOut();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: PASSWORD_DEFAULT
        });

        if (error) {
            alert("Error login: " + error.message);
            setLoggingIn(false);
        } else {
            window.location.href = '/predictions';
        }
    }

    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
        if (!acc[match.round]) acc[match.round] = [];
        acc[match.round].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => b - a);

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.includes(searchTerm)
    );

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <Dices size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Carga de Apuesta Comodín</h2>
                        <p className="text-xs text-gray-400">Gestión de apuestas especiales sin límites.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateUser(!showCreateUser)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                >
                    <UserPlus size={14} />
                    {showCreateUser ? 'Cancelar Creación' : 'Nuevo Usuario'}
                </button>
            </div>

            {/* Create User Form */}
            {showCreateUser && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-3 animate-fade-in">
                    <h3 className="text-sm font-bold text-purple-300">Crear Nuevo Comodín</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Username"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <p className="text-xs text-gray-500 self-center mr-auto">Pass por defecto: {PASSWORD_DEFAULT}</p>
                        <button
                            onClick={handleCreateUser}
                            disabled={creatingUser}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            {creatingUser ? 'Creando...' : 'Crear & Loguear'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Selection */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">1. Seleccionar Usuario</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="">-- Seleccionar --</option>
                        {filteredUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.username || 'Sin nombre'} ({u.id.slice(0, 4)}...)</option>
                        ))}
                    </select>

                    {/* Login As Button */}
                    {selectedUser && (
                        <button
                            onClick={handleLoginAsUser}
                            disabled={loggingIn}
                            className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-bold rounded-lg transition-colors border border-blue-500/30"
                        >
                            <LogIn size={14} />
                            {loggingIn ? 'Ingresando...' : 'Ingresar como este usuario'}
                        </button>
                    )}
                </div>

                {/* Match Selection Grouped by Round */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">2. Seleccionar Partido</label>
                    <div className="relative">
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                            value={selectedMatch}
                            onChange={(e) => setSelectedMatch(e.target.value)}
                            style={{ maxHeight: '200px' }}
                        >
                            <option value="">-- Seleccionar --</option>
                            {sortedRounds.map(round => (
                                <optgroup key={round} label={`Fecha ${round}`}>
                                    {matchesByRound[round].map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.home_team.name} vs {m.away_team.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Prediction Input */}
            <div className={`transition-all duration-300 ${selectedUser && selectedMatch ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <label className="text-sm text-gray-400 font-medium block mb-3">3. Ingresar Pronóstico (Goles)</label>
                    <div className="flex items-center gap-4 justify-center">
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Local</span>
                            <input
                                type="number"
                                className="w-20 bg-black/30 border border-white/10 rounded-lg py-3 text-center text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={homeScore}
                                onChange={(e) => setHomeScore(e.target.value)}
                            />
                        </div>
                        <span className="text-gray-500 font-bold text-xl">-</span>
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Visitante</span>
                            <input
                                type="number"
                                className="w-20 bg-black/30 border border-white/10 rounded-lg py-3 text-center text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={awayScore}
                                onChange={(e) => setAwayScore(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/20"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {success ? 'Apuesta Guardada Correctamente' : 'Guardar Apuesta Comodín'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
