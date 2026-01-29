'use client';

import { useState } from 'react';
import { calculatePointsForMatch } from '@/services/scoring';
import { supabase } from '@/lib/supabase';
import { Calculator } from 'lucide-react';

export function ScoringButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const runCalculation = async () => {
        if (!confirm('¿Calcular puntos para todos los partidos finalizados? Esto actualizará los puntajes de los usuarios.')) return;

        setLoading(true);
        setMessage('');

        try {
            // Get all finished matches
            const { data: matches } = await supabase
                .from('matches')
                .select('id')
                .eq('status', 'finished');

            if (!matches || matches.length === 0) {
                setMessage('No hay partidos finalizados para procesar.');
                setLoading(false);
                return;
            }

            let totalUpdated = 0;
            for (const match of matches) {
                const result = await calculatePointsForMatch(match.id);
                totalUpdated += result.updatedCount;
            }

            setMessage(`Cálculo completado. ${matches.length} partidos procesados.`);
        } catch (error: any) {
            console.error('Error calculating points:', error);
            setMessage('Error al calcular puntos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                onClick={runCalculation}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-argentina-gold text-navy-950 font-bold hover:bg-argentina-gold/90 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
            >
                <Calculator size={20} />
                {loading ? 'Calculando...' : 'Calcular Puntos'}
            </button>
            {message && <span className="text-sm text-gray-300">{message}</span>}
        </div>
    );
}
