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
            id: pred.id,
            points_awarded: points
        });
    }

    // 4. Update predictions
    if (updates.length > 0) {
        const { error: updateError } = await supabase
            .from('predictions')
            .upsert(updates);

        if (updateError) throw updateError;
    }

    // 5. Update User Profiles Total Points
    // This is heavy. Ideally we use a trigger or a view. 
    // For now, let's recalculate ALL points for the affected users to be safe and simple?
    // Or just increment? Increment is risky if we re-run calculation.
    // Better strategy: Recalculate total points for all users involved.

    // Get unique user IDs
    const userIds = [...new Set(predictions.map(p => p.user_id))];

    for (const userId of userIds) {
        const { data: userPreds } = await supabase
            .from('predictions')
            .select('points_awarded')
            .eq('user_id', userId)
            .not('points_awarded', 'is', null);

        const totalPoints = userPreds?.reduce((sum, p) => sum + (p.points_awarded || 0), 0) || 0;

        await supabase
            .from('profiles')
            .update({ points: totalPoints })
            .eq('id', userId);
    }

    return { updatedCount: updates.length };
}
