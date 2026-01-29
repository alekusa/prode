'use client';

import { MatchCard } from '@/components/predictions/MatchCard';
import { Database } from '@/types/database';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Match = Database['public']['Tables']['matches']['Row'] & {
    home_team: Database['public']['Tables']['teams']['Row'];
    away_team: Database['public']['Tables']['teams']['Row'];
};

export function MatchWrapper({ match }: { match: Match }) {
    const { user } = useAuth();
    const [prediction, setPrediction] = useState<Database['public']['Tables']['predictions']['Row'] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchPrediction() {
            try {
                const { data, error } = await supabase
                    .from('predictions')
                    .select('*')
                    .eq('user_id', user!.id)
                    .eq('match_id', match.id)
                    .maybeSingle();

                if (error) {
                    console.error("Error fetching prediction:", error);
                }

                if (isMounted) {
                    setPrediction(data);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Unexpected error fetching prediction:", error);
                if (isMounted) setLoading(false);
            }
        }

        fetchPrediction();
        return () => { isMounted = false; };
    }, [user, match.id]);

    if (loading && user) {
        // Render skeletal or loading state if needed, or just render the card without values yet
        // For better UX, we can just render the card and let the values pop in
    }

    return <MatchCard match={match} userPrediction={prediction} key={user?.id /* Reset on user change */} />;
}
