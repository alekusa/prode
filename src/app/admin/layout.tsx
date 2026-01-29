'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { LayoutDashboard, Trophy, Users, CheckSquare } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        async function checkAdmin() {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user!.id)
                .single();

            if (data?.role === 'admin') {
                setIsAdmin(true);
            } else {
                router.push('/');
            }
            setLoading(false);
        }

        checkAdmin();
    }, [user, authLoading, router]);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-argentina-blue"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 glass-panel border-r border-white/5 hidden md:block fixed h-full pt-20">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-8">Administración</h2>
                    <nav className="space-y-4">
                        <Link href="/admin" className="flex items-center gap-3 text-gray-400 hover:text-argentina-blue transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                            <LayoutDashboard size={20} />
                            Dashboard
                        </Link>
                        <Link href="/admin/matches" className="flex items-center gap-3 text-gray-400 hover:text-argentina-blue transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                            <Trophy size={20} />
                            Partidos
                        </Link>
                        <Link href="/admin/users" className="flex items-center gap-3 text-gray-400 hover:text-argentina-blue transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                            <Users size={20} />
                            Usuarios
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 md:ml-64 p-8">
                {children}
            </div>
        </div>
    );
}
