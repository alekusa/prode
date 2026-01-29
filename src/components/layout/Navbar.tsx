'use client';

import Link from "next/link";
import { User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export function Navbar() {
    const { user, profile, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="group flex-shrink-0 flex items-center gap-4 transition-transform hover:scale-105">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-argentina-blue/30 shadow-[0_0_20px_rgba(117,170,219,0.3)] bg-white/5 backdrop-blur-sm">
                            <img
                                src="/images/logo.png"
                                alt="PRODEARG"
                                className="w-full h-full object-cover scale-[1] object-[center_28%]"
                            />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white uppercase italic hidden sm:block">
                            PRODE<span className="text-argentina-blue not-italic">ARG</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                            Inicio
                        </Link>
                        {user && (
                            <>
                                <Link href="/predictions" className="text-gray-300 hover:text-white transition-colors">
                                    Mis Pronósticos
                                </Link>
                                <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
                                    Tabla
                                </Link>
                                <Link href="/profile" className="text-gray-300 hover:text-white transition-colors">
                                    Mi Perfil
                                </Link>
                                {profile?.role === 'admin' && (
                                    <Link href="/admin/matches" className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-xs uppercase tracking-widest">
                                        Admin
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-white/10" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                                            <UserIcon size={16} />
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-300 hidden sm:inline-block">
                                        {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                                    </span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-red-400"
                                    title="Cerrar Sessión"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="px-4 py-2 rounded-lg bg-argentina-blue text-navy-950 font-bold text-sm hover:bg-argentina-blue/90 transition-colors">
                                Ingresar
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
