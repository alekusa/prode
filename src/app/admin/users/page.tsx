'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, Search, KeyRound, ShieldAlert, UserCog } from 'lucide-react';

type User = {
    id: string;
    email: string;
    username: string;
    created_at: string;
    last_sign_in_at: string | null;
    avatar_url?: string;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        setFilteredUsers(
            users.filter(u =>
                u.email?.toLowerCase().includes(lowerSearch) ||
                u.username?.toLowerCase().includes(lowerSearch) ||
                u.id.includes(lowerSearch)
            )
        );
    }, [search, users]);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Error fetching users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar usuarios. Verifica que tengas configurada la SUPABASE_SERVICE_ROLE_KEY.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteUser(userId: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción NO se puede deshacer.')) return;

        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Error deleting user');
            }

            setUsers(users.filter(u => u.id !== userId));
            alert('Usuario eliminado correctamente');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleResetPassword() {
        if (!selectedUser || !newPassword) return;
        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setActionLoading('reset');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset_password',
                    userId: selectedUser.id,
                    newPassword
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Error resetting password');
            }

            alert(`Contraseña actualizada para ${selectedUser.email}`);
            setShowResetModal(false);
            setNewPassword('');
            setSelectedUser(null);
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    }

    const openResetModal = (user: User) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowResetModal(true);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-argentina-blue/10 border border-argentina-blue/20 text-argentina-blue text-xs font-bold uppercase tracking-widest">
                        <UserCog size={14} />
                        Administración
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-gray-400 max-w-xl">
                        Visualizá, editá y gestioná el acceso de todos los usuarios registrados en la plataforma.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por email, usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-argentina-blue w-10 h-10" />
                </div>
            ) : (
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4 hidden sm:table-cell">Registrado</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Último Acceso</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center text-xs font-bold text-argentina-blue">
                                                    {user.username ? user.username[0].toUpperCase() : 'U'}
                                                </div>
                                                <span className="font-bold text-white">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300 font-mono">{user.email}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 hidden sm:table-cell">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 hidden md:table-cell">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openResetModal(user)}
                                                    className="p-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-colors border border-orange-500/20"
                                                    title="Resetear Contraseña"
                                                >
                                                    <KeyRound size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 disabled:opacity-50"
                                                    title="Eliminar Usuario"
                                                >
                                                    {actionLoading === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-navy-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                        <div className="flex items-center gap-4 text-orange-400">
                            <div className="p-3 rounded-full bg-orange-500/20">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Resetear Contraseña</h3>
                                <p className="text-xs text-gray-400">Usuario: {selectedUser.email}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Nueva Contraseña</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                                placeholder="Escribe la nueva clave..."
                            />
                            <p className="text-xs text-gray-500">
                                Esta acción cambiará inmediatamente la contraseña del usuario. Deberás comunicársela manualmente.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={!newPassword || actionLoading === 'reset'}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading === 'reset' && <Loader2 size={16} className="animate-spin" />}
                                Confirmar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
