import { NextResponse } from 'next/server';
import { createMatchReminder } from '@/services/google-calendar';

export async function GET() {
    try {
        const envCheck = {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
            hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not Set'
        };

        const dummyMatch = {
            id: 'test-verification-123',
            home_team: { name: 'Test Home' },
            away_team: { name: 'Test Away' },
            start_time: new Date().toISOString()
        };

        console.log('Running Calendar Test with Env:', envCheck);
        const result = await createMatchReminder(dummyMatch);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Google Calendar connection verified.',
                env: envCheck
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to create event',
                details: result.error,
                env: envCheck
            }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || String(error),
            stack: error.stack?.split('\n').slice(0, 3)
        }, { status: 500 });
    }
}
