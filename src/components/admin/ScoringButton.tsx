'use client';

import { useState } from 'react';
import { calculatePointsForMatch, refreshAllUserPoints } from '@/services/scoring';
import { supabase } from '@/lib/supabase';
import { Calculator, Loader2 } from 'lucide-react';

export function ScoringButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const runCalculation = async () => {
        if (!confirm('¿Calcular puntos para todos los partidos finalizados? Esto actualizará los puntajes de los usuarios.')) return;

        setLoading(true);
        setMessage('Iniciando cálculo...');
        setProgress({ current: 0, total: 0 });

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

            setProgress({ current: 0, total: matches.length });

            let totalUpdated = 0;
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                setMessage(`Procesando partido ${i + 1} de ${matches.length}...`);
                const result = await calculatePointsForMatch(match.id);
                totalUpdated += result.updatedCount;
                setProgress(prev => ({ ...prev, current: i + 1 }));
            }

            setMessage('Actualizando puntos totales de los usuarios...');
            await refreshAllUserPoints();

            setMessage(`¡Éxito! ${matches.length} partidos procesados. ${totalUpdated} predicciones actualizadas.`);
        } catch (error: any) {
            console.error('Error calculating points:', error);
            setMessage('Error al calcular puntos: ' + error.message);
        } finally {
            setLoading(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                onClick={runCalculation}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-argentina-gold text-navy-950 font-bold hover:bg-argentina-gold/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:scale-100 active:scale-95 group"
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Calculator size={20} className="group-hover:rotate-12 transition-transform" />}
                {loading ? 'Procesando...' : 'Calcular Puntos'}
            </button>
            {message && (
                <div className="flex flex-col gap-1 w-full max-w-xs">
                    <span className="text-xs font-medium text-gray-300 animate-in fade-in slide-in-from-top-1">{message}</span>
                    {loading && progress.total > 0 && (
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                                className="bg-argentina-gold h-full transition-all duration-300 ease-out"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
