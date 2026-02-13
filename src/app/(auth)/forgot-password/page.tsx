'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        // The URL to redirect to after clicking the email link
        // In production, this should be your domain/reset-password
        const redirectTo = `${window.location.origin}/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (error) {
            setStatus('error');
            setErrorMessage(error.message);
        } else {
            setStatus('success');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-argentina-blue to-blue-600 shadow-lg shadow-blue-500/20 mb-4">
                        <Mail className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Recuperar Cuenta</h1>
                    <p className="text-gray-400">Te enviaremos un link para restablecer tu contraseña.</p>
                </div>

                {/* Form */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-argentina-blue/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />

                    {status === 'success' ? (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 text-green-500">
                                <Send size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">¡Email Enviado!</h3>
                                <p className="text-sm text-gray-400">
                                    Si el correo {email} existe en nuestra base de datos, recibirás las instrucciones en breve.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm font-bold text-argentina-blue hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} /> Volver al Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300 ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-argentina-blue transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 bg-navy-950/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-argentina-blue/50 focus:border-transparent transition-all"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium animate-shake">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-navy-950 font-black tracking-wide bg-gradient-to-r from-argentina-blue to-blue-400 hover:from-white hover:to-gray-200 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Recuperación'}
                            </button>

                            <div className="text-center pt-2">
                                <Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <ArrowLeft size={14} /> Volver
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
