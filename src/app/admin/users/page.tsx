'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { useAuth } from "@/context/AuthContext";
import { Search, User as UserIcon, Shield, ShieldAlert, Mail } from "lucide-react";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminUsersPage() {
    const { profile: adminProfile } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    async function fetchUsers() {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('points', { ascending: false });

        if (error) {
            console.error("Error fetching users:", error);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAdmin = async (user: Profile) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', user.id);

        if (error) {
            console.error("Error updating role:", error);
        } else {
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white leading-none">Gestión de Usuarios</h1>
                    <p className="text-gray-400 text-sm">Administrá los roles y visualizá el progreso de los participantes.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-argentina-blue focus:ring-0 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Puntos</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-8 w-20 bg-white/5 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-argentina-blue/10 border border-argentina-blue/20 flex items-center justify-center overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon size={20} className="text-argentina-blue" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{user.full_name || user.username}</div>
                                                    <div className="text-[10px] opacity-50 flex items-center gap-1">
                                                        <Mail size={10} />
                                                        {user.username}@prode.com
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-black text-argentina-gold">
                                            {user.points || 0} pts
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                                            <span className={`px-2 py-0.5 rounded-md border ${user.role === 'admin'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleAdmin(user)}
                                                disabled={user.id === adminProfile?.id}
                                                className={`p-2 rounded-lg transition-all ${user.role === 'admin'
                                                        ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400'
                                                        : 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                                                    } disabled:opacity-20`}
                                                title={user.role === 'admin' ? "Quitar Admin" : "Hacer Admin"}
                                            >
                                                {user.role === 'admin' ? <Shield size={18} /> : <ShieldAlert size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
