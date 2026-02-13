'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Trophy, CheckCircle, UserCog } from "lucide-react";
import { ScoringButton } from "@/components/admin/ScoringButton";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { WildcardBetting } from "@/components/admin/WildcardBetting";
import Link from "next/link";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, matches: 0, predictions: 0 });

    useEffect(() => {
        async function fetchStats() {
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: matchesCount } = await supabase.from('matches').select('*', { count: 'exact', head: true });
            const { count: predictionsCount } = await supabase.from('predictions').select('*', { count: 'exact', head: true });

            setStats({
                users: usersCount || 0,
                matches: matchesCount || 0,
                predictions: predictionsCount || 0
            });
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-white">Dashboard</h1>
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-all hover:scale-105"
                    >
                        <UserCog size={18} />
                        Gestión de Usuarios
                    </Link>
                </div>
                <ScoringButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-blue-500/20 text-blue-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium">Usuarios Registrados</p>
                        <p className="text-3xl font-bold text-white">{stats.users}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-green-500/20 text-green-400">
                        <Trophy size={32} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium">Partidos Cargados</p>
                        <p className="text-3xl font-bold text-white">{stats.matches}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-purple-500/20 text-purple-400">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium">Pronósticos Totales</p>
                        <p className="text-3xl font-bold text-white">{stats.predictions}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AdminSettings />
                <WildcardBetting />
            </div>
        </div>
    );
}
