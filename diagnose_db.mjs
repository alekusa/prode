import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need the connection string. Usually it's in DATABASE_URL in .env
// If not, we can try to guess or ask the user.
// Since we only saw NEXT_PUBLIC_SUPABASE_URL, we might be blocked here if we don't have direct DB access.
// Let's check environment first.

async function diagnose() {
    console.log("Checking environment...");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("ERROR: DATABASE_URL not found in .env.local");
        // Try to check if we can replicate the error via Supabase Client and see details?
        // No, client already gave 500.
        return;
    }

    const sql = postgres(dbUrl);

    try {
        console.log("Connected. Checking 'profiles' table...");
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `;

        console.log("Columns in 'profiles':", columns.map(c => c.column_name));

        const hasUsername = columns.some(c => c.column_name === 'username');
        console.log("Has 'username' column?", hasUsername);

        console.log("Checking Triggers on 'auth.users' (requires high privileges)...");
        // This might fail if the user is not superuser, but let's try.
        try {
            const triggers = await sql`
                SELECT trigger_name, event_manipulation, event_object_table, action_statement
                FROM information_schema.triggers
                WHERE event_object_table = 'users' AND trigger_schema = 'auth';
            `;
            console.log("Triggers on auth.users:", triggers);
        } catch (e) {
            console.log("Could not read triggers (permission error expected).");
        }

    } catch (e) {
        console.error("SQL Error:", e);
    } finally {
        await sql.end();
    }
}

diagnose();
