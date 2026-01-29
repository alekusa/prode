import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    console.log("Full Callback URL:", request.url);
    const { searchParams, origin } = new URL(request.url);
    console.log("Callback received with params:", Object.fromEntries(searchParams.entries()));
    const code = searchParams.get('code');
    // if "next" is in the params, use it as the redirect URL
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // Safe to ignore if called from a Server Component
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                            // Safe to ignore if called from a Server Component
                        }
                    },
                },
            }
        );
        console.log("Exchanging code for session...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            console.log("OAuth exchange successful, redirecting to:", next);
            return NextResponse.redirect(`${origin}${next}`);
        }
        console.error("OAuth exchange error:", error);
    } else {
        console.warn("No code provided in OAuth callback");
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
