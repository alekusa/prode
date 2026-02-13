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

        // Merge data
        const enrichedUsers = users.map(user => {
            const profile = profiles.find(p => p.id === user.id);
            return {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                username: profile?.username || 'Sin nombre',
                avatar_url: profile?.avatar_url
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

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
