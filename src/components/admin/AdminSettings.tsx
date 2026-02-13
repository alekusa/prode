'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Save, Check, Loader2 } from 'lucide-react';

export function AdminSettings() {
    const [totalPlayers, setTotalPlayers] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'total_players_fictional')
            .single();

        if (data) {
            setTotalPlayers(data.value);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        setSuccess(false);

        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'total_players_fictional',
                value: totalPlayers
            });

        if (!error) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            console.error('Error saving settings:', error);
            alert('Error al guardar');
        }
        setSaving(false);
    }

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Users size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Configuración General</h2>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Total de Jugadores (Ficticio)</label>
                <div className="flex gap-4">
                    <input
                        type="number"
                        value={totalPlayers}
                        onChange={(e) => setTotalPlayers(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-argentina-blue transition-all"
                        placeholder="Ej: 1250"
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-argentina-blue text-navy-950 font-bold rounded-xl hover:bg-argentina-blue/90 disabled:opacity-50 transition-all"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {success ? 'Guardado' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
