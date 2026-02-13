'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, KeyRound, Check, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();

    // Check if we have a session (the link should log the user in automatically)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, maybe the link is invalid or expired
                // However, supabase.auth.onAuthStateChange might pick it up
            }
        });
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setErrorMessage('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setErrorMessage('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setStatus('error');
            setErrorMessage(error.message);
        } else {
            setStatus('success');
            setTimeout(() => {
                router.push('/');
            }, 3000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/20 mb-4">
                        <KeyRound className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Nueva Contraseña</h1>
                    <p className="text-gray-400">Ingresá tu nueva clave segura.</p>
                </div>

                {/* Form */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">

                    {status === 'success' ? (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 text-green-500">
                                <Check size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">¡Contraseña Actualizada!</h3>
                                <p className="text-sm text-gray-400">
                                    Tu clave ha sido cambiada correctamente. Redirigiendo al inicio...
                                </p>
                            </div>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-sm font-bold text-green-400 hover:text-white transition-colors"
                            >
                                Ir al Inicio <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300 ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full px-4 py-3 bg-navy-950/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300 ml-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full px-4 py-3 bg-navy-950/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-shake">
                                    <AlertCircle size={16} /> {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-navy-950 font-black tracking-wide bg-gradient-to-r from-green-400 to-green-600 hover:from-white hover:to-gray-200 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Establecer Contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
