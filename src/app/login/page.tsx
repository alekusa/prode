'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getURL } from '@/lib/utils';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${getURL()}auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl animate-fade-in relative z-10">
                <div className="text-center">
                    <Link href="/" className="inline-block mb-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-argentina-blue/20 mx-auto shadow-[0_0_40px_rgba(117,170,219,0.4)] transition-transform hover:scale-105 bg-white/5 backdrop-blur-sm">
                            <img
                                src="/images/logo.png"
                                alt="PRODEARG"
                                className="w-full h-full object-cover scale-[1] object-[center_28%]"
                            />
                        </div>
                    </Link>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        Bienvenido de nuevo
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Ingresá a tu cuenta para continuar
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-4 py-4 border border-white/10 placeholder-gray-500 text-white rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-argentina-blue focus:border-transparent transition-all sm:text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-4 py-4 border border-white/10 placeholder-gray-500 text-white rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-argentina-blue focus:border-transparent transition-all sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="flex justify-end pt-2">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-argentina-blue hover:text-white transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-navy-950 bg-argentina-blue hover:bg-argentina-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-argentina-blue shadow-[0_0_20px_rgba(117,170,219,0.3)] hover:shadow-[0_0_30px_rgba(117,170,219,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Cargando...' : 'Ingresar'}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-navy-800 text-gray-400">O continuá con</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-white/10 text-sm font-bold rounded-xl text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-argentina-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                            />
                        </svg>
                        Google
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-400">
                        ¿No tenés cuenta?{' '}
                        <Link href="/signup" className="font-medium text-argentina-blue hover:text-argentina-gold transition-colors">
                            Registrate acá
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
