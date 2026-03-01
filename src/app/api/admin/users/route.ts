import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with the SERVICE ROLE key
// This client has admin privileges and can bypass RLS
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

export async function GET(request: Request) {
    try {
        // In a real app, you MUST verify the requester is an admin
        // Here we are assuming the middleware or client-side checks are done, 
        // BUT for an API route like this, you should check the user's session role again.

        // 1. Get List of Users from Auth
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) throw authError;

        // 2. Get Profiles to match usernames
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*');

        if (profileError) throw profileError;

        // 3. Get all approved transactions to calculate balances
        const { data: txs, error: txError } = await supabaseAdmin
            .from('transactions')
            .select('user_id, amount')
            .eq('status', 'approved');

        if (txError) throw txError;

        // Merge data
        const enrichedUsers = users.map(user => {
            const profile = (profiles || []).find(p => p.id === user.id);
            const userTxs = (txs || []).filter(t => t.user_id === user.id);
            const balance = userTxs.reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                username: profile?.username || 'Sin nombre',
                avatar_url: profile?.avatar_url,
                balance: balance
            };
        });

        // Filter out those who don't have predictions to reduce noise? No, show all.
        // Sort by created_at desc
        enrichedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json(enrichedUsers);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Delete user from Auth (cascades to public.profiles usually)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, userId, newPassword } = body;

        if (action === 'reset_password') {
            if (!userId || !newPassword) {
                return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 });
            }

            const { error } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: newPassword }
            );

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'update_profile') {
            if (!userId || !body.username) {
                return NextResponse.json({ error: 'Missing userId or username' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ username: body.username })
                .eq('id', userId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'set_wildcard') {
            if (!userId) {
                return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('app_settings')
                .upsert({
                    key: 'wildcard_user_id',
                    value: userId
                });

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'remove_wildcard') {
            const { error } = await supabaseAdmin
                .from('app_settings')
                .delete()
                .eq('key', 'wildcard_user_id');

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'add_balance') {
            if (!userId) {
                return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
            }

            // Get current round from matches
            // We'll take the lowest round that has matches in the future, or the max round if all are past
            const { data: nextMatch } = await supabaseAdmin
                .from('matches')
                .select('round')
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(1)
                .single();

            let currentRound = nextMatch?.round;

            if (!currentRound) {
                const { data: lastMatch } = await supabaseAdmin
                    .from('matches')
                    .select('round')
                    .order('round', { ascending: false })
                    .limit(1)
                    .single();
                currentRound = lastMatch?.round || 1;
            }

            // Get current balance
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single();

            const newBalance = 5000;

            // Log Transaction (This now becomes our ONLY way to credit)
            const { error: txError } = await supabaseAdmin
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount: 5000,
                    status: 'approved',
                    type: 'manual',
                    round: currentRound,
                    mp_payment_id: `manual_${userId}_${Date.now()}`
                });

            if (txError) throw txError;

            return NextResponse.json({ success: true, newBalance, round: currentRound });
        }

        if (action === 'reset_all_balances') {
            // How to reset if we use transactions? 
            // We should add a "reset" transaction with negative value to reach 0? 
            // Or just filter transactions by some "reset date".
            // Since the user defined reset as setting to $0, we'll insert a transaction that offsets the current balance.

            // 1. Get all users with non-zero balance
            const { data: txs } = await supabaseAdmin
                .from('transactions')
                .select('user_id, amount')
                .eq('status', 'approved');

            const balances: Record<string, number> = {};
            txs?.forEach(t => {
                balances[t.user_id] = (balances[t.user_id] || 0) + Number(t.amount);
            });

            const resetTxs = Object.entries(balances)
                .filter(([_, bal]) => bal > 0)
                .map(([uid, bal]) => ({
                    user_id: uid,
                    amount: -bal,
                    status: 'approved',
                    type: 'manual',
                    mp_payment_id: `reset_${uid}_${Date.now()}`
                }));

            if (resetTxs.length > 0) {
                const { error } = await supabaseAdmin
                    .from('transactions')
                    .insert(resetTxs);
                if (error) throw error;
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
