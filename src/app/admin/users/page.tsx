'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, Search, KeyRound, ShieldAlert, UserCog, Edit, LogIn, Dices, Save, User as UserIcon, Wallet, RefreshCw } from 'lucide-react';
import { PASSWORD_DEFAULT } from '@/lib/constants';

type User = {
    id: string;
    email: string;
    username: string;
    created_at: string;
    last_sign_in_at: string | null;
    avatar_url?: string;
    balance: number;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [wildcardUserId, setWildcardUserId] = useState<string | null>(null);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [isWildcard, setIsWildcard] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchWildcard();
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

    async function fetchWildcard() {
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'wildcard_user_id')
            .single();
        if (data) setWildcardUserId(data.value);
    }

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

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setEditUsername(user.username);
        setEditPassword('');
        setIsWildcard(wildcardUserId === user.id);
        setShowEditModal(true);
    };

    async function handleSaveChanges() {
        if (!selectedUser) return;
        setActionLoading('save');

        try {
            // 1. Update Username if changed
            if (editUsername !== selectedUser.username) {
                await fetch('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'update_profile', userId: selectedUser.id, username: editUsername })
                });
            }

            // 2. Update Password if provided
            if (editPassword) {
                await fetch('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'reset_password', userId: selectedUser.id, newPassword: editPassword })
                });
            }

            // 3. Update Wildcard Status
            const currentlyWildcard = wildcardUserId === selectedUser.id;
            if (isWildcard && !currentlyWildcard) {
                await fetch('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'set_wildcard', userId: selectedUser.id })
                });
                setWildcardUserId(selectedUser.id);
            } else if (!isWildcard && currentlyWildcard) {
                await fetch('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'remove_wildcard' })
                });
                setWildcardUserId(null);
            }

            alert('Cambios guardados correctamente');
            fetchUsers();
            setShowEditModal(false);
        } catch (error: any) {
            alert('Error al guardar cambios: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleLoginAs() {
        if (!selectedUser) return;

        const passwordToUse = editPassword || PASSWORD_DEFAULT;
        const confirmMsg = editPassword
            ? `Se usará la contraseña ingresada: "${editPassword}"`
            : `Se usará la contraseña por defecto: "${PASSWORD_DEFAULT}"\n(Asegúrate de haberla seteado antes si no la conoces)`;

        if (!confirm(`${confirmMsg}\n\n¿Estás seguro? Se cerrará tu sesión actual de administrador.`)) return;

        setActionLoading('login');
        try {
            // If explicit password was typed, update it first to be sure
            if (editPassword) {
                await fetch('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'reset_password', userId: selectedUser.id, newPassword: editPassword })
                });
            }

            // Perform login
            await supabase.auth.signOut();
            const { error } = await supabase.auth.signInWithPassword({
                email: selectedUser.email,
                password: passwordToUse
            });

            if (error) throw error;
            window.location.href = '/predictions';
        } catch (error: any) {
            alert('Error al intentar login: ' + error.message);
            setActionLoading(null);
        }
    }

    async function handleAddBalance(userId: string) {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify({ action: 'add_balance', userId })
            });
            if (!res.ok) throw new Error('Error adding balance');
            alert('Saldo cargado correctamente');
            fetchUsers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleResetAllBalances() {
        if (!confirm('¿EstÁS SEGURO? Se pondrán en $0 los saldos de TODOS los usuarios (excepto administradores).')) return;

        setActionLoading('reset_balances');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify({ action: 'reset_all_balances' })
            });
            if (!res.ok) throw new Error('Error resetting balances');
            alert('Saldos reseteados correctamente');
            fetchUsers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    }

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
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleResetAllBalances}
                        disabled={actionLoading === 'reset_balances'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold hover:bg-orange-500/20 transition-all shadow-lg text-sm disabled:opacity-50"
                    >
                        {actionLoading === 'reset_balances' ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        Resetear Saldos
                    </button>
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
                                    <th className="px-6 py-4">Saldo</th>
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
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center text-xs font-bold text-argentina-blue">
                                                        {user.username ? user.username[0].toUpperCase() : 'U'}
                                                    </div>
                                                    {wildcardUserId === user.id && (
                                                        <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5 border border-navy-900 shadow-lg" title="Usuario Comodín">
                                                            <Dices size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white flex items-center gap-2">
                                                        {user.username}
                                                        {wildcardUserId === user.id && (
                                                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase font-black tracking-tighter">Comodín</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300 font-mono">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Wallet size={14} className="text-green-500" />
                                                <span className="font-bold text-white">${user.balance || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 hidden sm:table-cell">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 hidden md:table-cell">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleAddBalance(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="px-3 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-navy-950 transition-colors border border-green-500/20 text-xs font-bold flex items-center gap-1"
                                                    title="Cargar $5000"
                                                >
                                                    {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                                                    Cargar $5000
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 rounded-lg bg-argentina-blue/10 text-argentina-blue hover:bg-argentina-blue hover:text-navy-950 transition-colors border border-argentina-blue/20"
                                                    title="Editar Usuario"
                                                >
                                                    <Edit size={16} />
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

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg bg-navy-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-8 overflow-hidden relative">
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-argentina-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-4 text-argentina-blue relative border-b border-white/5 pb-6">
                            <div className="p-4 rounded-2xl bg-argentina-blue/10 border border-argentina-blue/20">
                                <UserIcon size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Editar Usuario</h3>
                                <p className="text-sm text-gray-400 font-mono">{selectedUser.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nombre a mostrar</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={e => setEditUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue font-bold"
                                    placeholder="Nombre del usuario"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cambiar Contraseña</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        value={editPassword}
                                        onChange={e => setEditPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                        placeholder="Nueva clave (opcional)..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Special Actions */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Configuraciones Especiales</h4>

                            <label className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/5">
                                <div className={`p-2 rounded-lg transition-colors ${isWildcard ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'}`}>
                                    <Dices size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Usuario Comodín</p>
                                    <p className="text-[11px] text-gray-500 leading-tight">Identifica a este usuario como el comodín del torneo.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isWildcard}
                                    onChange={e => setIsWildcard(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500"
                                />
                            </label>

                            <button
                                onClick={handleLoginAs}
                                disabled={actionLoading === 'login'}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all border border-blue-500/20 group"
                            >
                                <div className="flex items-center gap-4">
                                    <LogIn size={20} />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Iniciar Sesión con este usuario</p>
                                        <p className="text-[11px] text-gray-500 leading-tight">Se cerrará tu sesión actual de Admin.</p>
                                    </div>
                                </div>
                                {actionLoading === 'login' ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} className="opacity-50" />}
                            </button>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-6 py-3 rounded-xl text-sm font-black text-gray-500 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={actionLoading === 'save'}
                                className="px-8 py-3 rounded-xl text-sm font-black bg-argentina-blue text-navy-950 hover:bg-white hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-argentina-blue/20 uppercase tracking-widest"
                            >
                                {actionLoading === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

