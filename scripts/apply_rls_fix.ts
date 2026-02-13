import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not found in .env.local");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function runMigration() {
    console.log("Applying RLS fixes for leaderboard...");
    try {
        const migrationSql = fs.readFileSync('supabase/fix_rls_leaderboard.sql', 'utf8');
        await sql.unsafe(migrationSql);
        console.log("✅ Policies updated successfully!");
    } catch (error) {
        console.error("❌ Error applying migration:", error);
    } finally {
        await sql.end();
    }
}

runMigration();
