'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal } from "lucide-react";

type Profile = {
    id: string;
    username: string | null;
    points: number;
    avatar_url: string | null;
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, points, avatar_url')
                .order('points', { ascending: false })
                .limit(50);

            if (data) setUsers(data);
            setLoading(false);
        }

        fetchLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="text-yellow-400" size={24} />;
        if (index === 1) return <Medal className="text-gray-300" size={24} />;
        if (index === 2) return <Medal className="text-amber-700" size={24} />;
        return <span className="text-lg font-bold text-gray-500 font-mono w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black text-white tracking-tight">Tabla de Posiciones</h1>
                <p className="text-gray-400">Los mejores pronosticadores del torneo.</p>
            </div>

            <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Cargando posiciones...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 font-bold text-sm uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-center w-20">#</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4 text-right">Puntos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user, index) => (
                                <tr key={user.id} className={`
                                    hover:bg-white/5 transition-colors
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}
                                `}>
                                    <td className="px-6 py-4 flex justify-center items-center">
                                        {getRankIcon(index)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-argentina-blue text-lg">
                                                {user.username ? user.username[0].toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg">
                                                    {user.username || 'Usuario Anónimo'}
                                                </p>
                                                {index === 0 && <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Líder</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-2xl font-black text-white">{user.points}</span>
                                        <span className="text-xs text-gray-500 ml-1">pts</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {users.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-500">
                        Aún no hay usuarios en el ranking.
                    </div>
                )}
            </div>
        </div>
    );
}
