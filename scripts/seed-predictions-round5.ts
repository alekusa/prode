import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});
// CAMBIA EL ROUND PAR PROXIMAS PREDICCIONES
const ROUND = 5;

function generateRandomScore(): number {
    const rand = Math.random();
    if (rand < 0.4) return Math.floor(Math.random() * 2);       // 0-1 (40%)
    if (rand < 0.7) return Math.floor(Math.random() * 2) + 2;   // 2-3 (30%)
    if (rand < 0.9) return Math.floor(Math.random() * 2) + 4;   // 4-5 (20%)
    return Math.floor(Math.random() * 2) + 6;                    // 6-7 (10%)
}

async function main() {
    console.log(`🚀 Generating predictions for round ${ROUND}...\n`);

    // 1. Fetch matches for the round
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .eq('round', ROUND);

    if (matchError || !matches?.length) {
        console.error('❌ Error or no matches found:', matchError);
        process.exit(1);
    }
    console.log(`✅ Found ${matches.length} matches in round ${ROUND}`);

    // 2. Fetch all users (profiles)
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username');

    if (profileError || !profiles?.length) {
        console.error('❌ Error or no profiles found:', profileError);
        process.exit(1);
    }
    console.log(`✅ Found ${profiles.length} users\n`);

    // 3. Generate predictions
    let totalPredictions = 0;
    let skipped = 0;

    for (const profile of profiles) {
        // Check if user already has predictions for this round
        const { data: existing } = await supabase
            .from('predictions')
            .select('id')
            .eq('user_id', profile.id)
            .in('match_id', matches.map(m => m.id))
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`⏭️  Skipping ${profile.username || profile.id} (already has predictions)`);
            skipped++;
            continue;
        }

        const predictions = matches.map(match => ({
            user_id: profile.id,
            match_id: match.id,
            home_score: generateRandomScore(),
            away_score: generateRandomScore(),
            points_awarded: null
        }));

        const { error: predError } = await supabase
            .from('predictions')
            .insert(predictions);

        if (predError) {
            console.error(`❌ Error for ${profile.username}:`, predError.message);
        } else {
            totalPredictions += predictions.length;
            console.log(`✅ ${profile.username || profile.id}: ${predictions.length} predictions created`);
        }
    }

    console.log(`\n🎉 Done!`);
    console.log(`   - Users processed: ${profiles.length}`);
    console.log(`   - Users skipped (already had predictions): ${skipped}`);
    console.log(`   - Total predictions created: ${totalPredictions}`);
}

main().catch(console.error);
