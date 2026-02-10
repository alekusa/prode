import { NextResponse } from 'next/server';
import { createMatchReminder } from '@/services/google-calendar';

/**
 * API Route to create/update calendar events
 * Protected: Should check for admin authentication (omitted here for simplicity, relying on data passed)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { match } = body;

        if (!match || !match.id || !match.start_time) {
            return NextResponse.json(
                { success: false, error: 'Datos del partido inválidos' },
                { status: 400 }
            );
        }

        const result = await createMatchReminder(match);

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Evento de calendario sincronizado' });
        } else {
            return NextResponse.json(
                { success: false, error: 'Error al sincronizar con el calendario' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in calendar sync API:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
