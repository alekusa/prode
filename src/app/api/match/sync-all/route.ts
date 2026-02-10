import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createMatchReminder } from '@/services/google-calendar';

export async function POST() {
    try {
        // Fetch all matches with team info
        const { data: matches, error: fetchError } = await supabase
            .from('matches')
            .select(`
                id,
                start_time,
                home_team:teams!home_team_id(name),
                away_team:teams!away_team_id(name)
            `);

        if (fetchError) {
            return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
        }

        if (!matches || matches.length === 0) {
            return NextResponse.json({ success: true, message: 'No hay partidos para sincronizar', count: 0 });
        }

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        // Process sequentially to avoid rate limits if there are many matches
        for (const matchRaw of matches) {
            // Fix TypeScript type inference for joined tables which might be returned as arrays
            const match = matchRaw as any;
            const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
            const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;

            // Validate data integrity
            if (!homeTeam?.name || !awayTeam?.name || !match.start_time) {
                console.warn(`Skipping invalid match ${match.id}`);
                continue;
            }

            const result = await createMatchReminder({
                id: match.id,
                home_team: { name: homeTeam.name },
                away_team: { name: awayTeam.name },
                start_time: match.start_time
            });

            if (result.success) {
                successCount++;
            } else {
                failCount++;
                errors.push({ id: match.id, error: result.error });
            }
        }

        return NextResponse.json({
            success: true,
            summary: `Sincronizados: ${successCount}. Fallidos: ${failCount}.`,
            details: { successCount, failCount, errors }
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: 'Error Interno del Servidor' }, { status: 500 });
    }
}
