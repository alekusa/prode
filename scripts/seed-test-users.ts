import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Spanish names for realistic test users
const firstNames = [
    'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Diego', 'Sofía',
    'Martín', 'Valentina', 'Santiago', 'Camila', 'Mateo', 'Isabella', 'Nicolás',
    'Lucía', 'Alejandro', 'Martina', 'Gabriel', 'Emma', 'Sebastián', 'Victoria',
    'Matías', 'Catalina', 'Tomás', 'Renata', 'Felipe', 'Julieta', 'Joaquín', 'Florencia'
];

const lastNames = [
    'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García',
    'Pérez', 'Sánchez', 'Romero', 'Torres', 'Díaz', 'Álvarez', 'Ruiz',
    'Moreno', 'Jiménez', 'Hernández', 'Gómez', 'Castro', 'Ortiz', 'Silva'
];

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomScore(): number {
    // Weight towards realistic football scores (0-3 most common)
    const rand = Math.random();
    if (rand < 0.4) return getRandomInt(0, 1);
    if (rand < 0.7) return getRandomInt(2, 3);
    if (rand < 0.9) return getRandomInt(4, 5);
    return getRandomInt(6, 7);
}

async function main() {
    console.log('🚀 Starting test user creation...\n');

    // 1. Fetch all matches from round 4
    console.log('📋 Fetching round 4 matches...');
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id, round, home_team_id, away_team_id')
        .eq('round', 4);

    if (matchError) {
        console.error('❌ Error fetching matches:', matchError);
        process.exit(1);
    }

    if (!matches || matches.length === 0) {
        console.error('❌ No matches found for round 4');
        process.exit(1);
    }

    console.log(`✅ Found ${matches.length} matches in round 4\n`);

    // 2. Create 30 test users
    console.log('👥 Creating 30 test users...');
    const createdUsers: string[] = [];

    for (let i = 0; i < 30; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        // Remove accents for email (ASCII only)
        const cleanFirstName = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanLastName = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const username = `${cleanFirstName.toLowerCase()}_${cleanLastName.toLowerCase()}_${i + 1}`;
        const email = `${username}@test.prodearg.com`;
        const password = 'TestPassword123!'; // Same password for all test users

        try {
            // Create user in auth.users (this will trigger profile creation via trigger)
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: `${firstName} ${lastName}`,
                    username: username
                }
            });

            if (authError) {
                console.error(`❌ Error creating user ${username}:`, authError.message);
                continue;
            }

            if (!authData.user) {
                console.error(`❌ No user data returned for ${username}`);
                continue;
            }

            // Update profile with username (in case trigger doesn't set it)
            await supabase
                .from('profiles')
                .update({ username, full_name: `${firstName} ${lastName}` })
                .eq('id', authData.user.id);

            createdUsers.push(authData.user.id);
            console.log(`✅ Created user ${i + 1}/30: ${username}`);
        } catch (error) {
            console.error(`❌ Unexpected error creating user ${username}:`, error);
        }
    }

    console.log(`\n✅ Successfully created ${createdUsers.length} users\n`);

    // 3. Create predictions for each user for all round 4 matches
    console.log('🎯 Creating predictions for round 4...');
    let totalPredictions = 0;

    for (const userId of createdUsers) {
        const predictions = matches.map(match => ({
            user_id: userId,
            match_id: match.id,
            home_score: generateRandomScore(),
            away_score: generateRandomScore(),
            points_awarded: null
        }));

        const { error: predError } = await supabase
            .from('predictions')
            .insert(predictions);

        if (predError) {
            console.error(`❌ Error creating predictions for user ${userId}:`, predError.message);
        } else {
            totalPredictions += predictions.length;
            console.log(`✅ Created ${predictions.length} predictions for user`);
        }
    }

    console.log(`\n🎉 Done! Created ${createdUsers.length} users with ${totalPredictions} total predictions`);
    console.log('\n📊 Summary:');
    console.log(`   - Users created: ${createdUsers.length}`);
    console.log(`   - Matches in round 4: ${matches.length}`);
    console.log(`   - Total predictions: ${totalPredictions}`);
    console.log(`   - Test user credentials: email format is username@test.prodearg.com, password: TestPassword123!`);
}

main().catch(console.error);
