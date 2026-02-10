import { supabase } from '@/lib/supabase';

export const POINTS_EXACT_SCORE = 3;
export const POINTS_RESULT = 1;
export const POINTS_NONE = 0;

export async function calculatePointsForMatch(matchId: string) {
    // 1. Fetch match details
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (matchError || !match || match.status !== 'finished' || match.home_score === null || match.away_score === null) {
        throw new Error("Match not finished or invalid");
    }

    const homeScore = match.home_score;
    const awayScore = match.away_score;

    // 2. Fetch all predictions for this match
    const { data: predictions, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId);

    if (predError) throw predError;

    let updates = [];

    // 3. Calculate points
    for (const pred of predictions) {
        let points = POINTS_NONE;

        if (pred.home_score === homeScore && pred.away_score === awayScore) {
            points = POINTS_EXACT_SCORE;
        } else {
            const matchResult = Math.sign(homeScore - awayScore); // 1 = Home Win, 0 = Draw, -1 = Away Win
            const predResult = Math.sign(pred.home_score - pred.away_score);

            if (matchResult === predResult) {
                points = POINTS_RESULT;
            }
        }

        // Only update if changed (optional optimization, but good practice)
        updates.push({
            ...pred,
            points_awarded: points
        });
    }

    // 4. Update predictions
    if (updates.length > 0) {
        // Use parallel updates with explicit filters to avoid "UPDATE requires a WHERE clause" errors
        const updatePromises = updates.map(u =>
            supabase
                .from('predictions')
                .update({ points_awarded: u.points_awarded })
                .eq('id', u.id)
        );

        const results = await Promise.all(updatePromises);
        const error = results.find(r => r.error)?.error;
        if (error) throw error;
    }

    return { updatedCount: updates.length };
}

export async function refreshAllUserPoints() {
    const { error } = await supabase.rpc('update_total_points');
    if (error) throw error;
}
