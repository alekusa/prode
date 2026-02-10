import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * Initialize Google Calendar API client using GoogleAuth (Async)
 * GoogleAuth is the modern and robust way to handle credentials
 */
async function getCalendarClient() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!serviceAccountEmail || !privateKey) {
        console.error('Google Calendar credentials not configured. Email:', !!serviceAccountEmail, 'Key:', !!privateKey);
        return null;
    }

    // Clean the private key: handle Vercel's \n substitution and possible wrapping quotes
    privateKey = privateKey
        .trim()
        .replace(/^['"]|['"]$/g, '')      // Remove potential wrapping quotes (single or double)
        .replace(/\\n/g, '\n')            // Handle escaped newlines
        .replace(/\\\\n/g, '\n');         // Handle double-escaped newlines

    // Ensure the key has the correct PEM format (starts with header, ends with footer)
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('Private key format invalid: Missing PEM header');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey,
            },
            scopes: SCOPES,
        });

        const authClient = await auth.getClient();
        return google.calendar({ version: 'v3', auth: authClient as any });
    } catch (error) {
        console.error('Error initializing GoogleAuth client:', error);
        throw error;
    }
}

/**
 * Calculate the exact notification time: Start Time + 95 minutes
 */
function calculateNotificationTime(startTime: string): Date {
    const start = new Date(startTime);
    // Add 95 minutes (90 min game + 5 min delay)
    // Using 95 * 60 * 1000 milliseconds
    return new Date(start.getTime() + 95 * 60000);
}

/**
 * Create or Update a Google Calendar event for a match using Service Account
 */
export async function createMatchReminder(match: {
    id: string;
    home_team: { name: string };
    away_team: { name: string };
    start_time: string;
}) {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
        console.error('GOOGLE_CALENDAR_ID not configured');
        return { success: false, error: 'GOOGLE_CALENDAR_ID missing in env' };
    }

    let calendar;
    try {
        calendar = await getCalendarClient();
    } catch (e) {
        return { success: false, error: 'Auth Init Failed: ' + String(e) };
    }

    if (!calendar) return { success: false, error: 'Failed to initialize calendar client (check server logs)' };

    // Calculate when the notification event should happen (at 95 mins)
    const eventTime = calculateNotificationTime(match.start_time);

    // Construct the direct link for mobile reporting
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reportLink = `${appUrl}/admin/matches/${match.id}/report`;

    // Create an event that lasts 15 minutes, starting exactly at 95 min mark
    const endTime = new Date(eventTime.getTime() + 15 * 60000);

    const event = {
        summary: `📝 Cargar: ${match.home_team.name} vs ${match.away_team.name}`,
        description: `El partido ha terminado (95 min).\n\n👉 CARGAR RESULTADO AQUÍ:\n${reportLink}\n\nProde Argentina Admin Panel`,
        start: {
            dateTime: eventTime.toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 0 },
            ],
        },
        colorId: '11', // Red color
    };

    try {
        // Unique Event ID
        const eventId = `match${match.id.replace(/-/g, '').toLowerCase()}`;

        try {
            await calendar.events.update({
                calendarId,
                eventId,
                requestBody: event,
            });
            console.log(`Calendar event updated for match ${match.id}`);
        } catch (error: any) {
            if (error.code === 404) {
                await calendar.events.insert({
                    calendarId,
                    requestBody: {
                        ...event,
                        id: eventId,
                    },
                });
                console.log(`Calendar event created for match ${match.id}`);
            } else {
                throw error;
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error managing Google Calendar event:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
