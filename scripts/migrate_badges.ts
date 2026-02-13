
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const filePath = path.join('/Users/alekuseman/development/loteria/supabase', 'update_team_badges_2026.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    // Parse the SQL file and execute updates one by one
    const updates = sql.split(';').filter(line => line.trim().startsWith('UPDATE'));

    console.log(`Found ${updates.length} updates to process.`);

    for (const update of updates) {
        const matchBadge = update.match(/badge_url = '(.*?)'/);
        const matchName = update.match(/name = '(.*?)'/);

        if (matchBadge && matchName) {
            const badgeUrl = matchBadge[1];
            const name = matchName[1].replace(/''/g, "'"); // Handle escaped single quotes for Newell's

            console.log(`Updating ${name}...`);
            const { error } = await supabase
                .from('teams')
                .update({ badge_url: badgeUrl })
                .eq('name', name);

            if (error) {
                console.error(`Error updating ${name}: `, error);
            } else {
                console.log(`Updated ${name} successfully.`);
            }
        } else {
            console.warn(`Could not parse update line: ${update}`);
        }
    }
    console.log('Migration complete!');
}

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
