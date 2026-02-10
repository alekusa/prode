'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    points: number;
    role: 'user' | 'admin';
    email?: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No profile found, might be a new user
                    setProfile(null);
                } else {
                    console.error('Error fetching profile details:', error);
                    setProfile(null);
                }
            } else {
                setProfile(data);
            }
        } catch (error: any) {
            // Silence AbortErrors as they are expected during navigation/re-renders
            if (error.name !== 'AbortError') {
                console.error('Unexpected error fetching profile:', error);
            }
            setProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Initial session check
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (!mounted) return;

                if (initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    await fetchProfile(initialSession.user.id);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Auth initialization error:', error);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return;

            console.log('Auth state event:', event);

            const newUser = currentSession?.user ?? null;
            setSession(currentSession);

            // Only update user and fetch profile if the ID actually changed
            // We use state functional update style if we need to see previous value, 
            // but here we can just update states.
            setUser(prevUser => {
                if (newUser?.id !== prevUser?.id) {
                    if (newUser) {
                        fetchProfile(newUser.id);
                    } else {
                        setProfile(null);
                    }
                    return newUser;
                }
                return prevUser;
            });

            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setProfile(null);
            setUser(null);
            setSession(null);
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
