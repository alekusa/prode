import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function GET() {
    try {
        // Fetch all approved transactions using admin client to bypass RLS
        const { data: txs, error } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('status', 'approved')
            .order('round', { ascending: false });

        if (error) throw error;

        return NextResponse.json(txs);
    } catch (error: any) {
        console.error('Error fetching financial stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
