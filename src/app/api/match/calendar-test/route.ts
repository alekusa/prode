import { NextResponse } from 'next/server';
import { createMatchReminder } from '@/services/google-calendar';

export async function GET() {
    try {
        const dummyMatch = {
            id: 'test-verification-123',
            home_team: { name: 'Test Home' },
            away_team: { name: 'Test Away' },
            start_time: new Date().toISOString() // Start now
        };

        const result = await createMatchReminder(dummyMatch);

        // @ts-ignore
        if (result.success) {
            return NextResponse.json({ success: true, message: 'Google Calendar connection verified. Test event created.' });
        } else {
            // @ts-ignore
            return NextResponse.json({ success: false, error: 'Failed to create event', details: result.error }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
